import fs from "node:fs";
import path from "node:path";
import { QUESTIONS } from "./questions";
import { SCENES } from "./scenes";
import { rankRows, scoreAnswer, totalSeconds, type ReportRow } from "./scoring";
import { RoomSchema, SimSchema, StateSchema, type LiveState, type Phase } from "./state";

/**
 * Rehearsal rooms kept by the dev server itself (app/api/local), so the iPad and phones on the
 * same Wi-Fi share one room without the internet. Saved to .local-rooms.json so a server restart
 * keeps the room, its key, nicknames and answers. Never part of the GitHub Pages build.
 */
type Room = {
  key: string | null;
  state: LiveState;
  nicks: Record<string, string>;
  answers: Record<number, Record<string, string[]>>;
  /** when each answer was last changed (ms), for the speed tie-break; missing in rooms saved before it */
  times?: Record<number, Record<string, number>>;
};
type Peer = { role: string; t: number };

const FILE = path.join(process.cwd(), ".local-rooms.json");
const g = globalThis as unknown as { carmRooms?: Map<string, Room>; carmPeers?: Map<string, Map<string, Peer>> };

function rooms() {
  if (!g.carmRooms) {
    g.carmRooms = new Map();
    try {
      for (const [code, r] of Object.entries(JSON.parse(fs.readFileSync(FILE, "utf8")) as Record<string, Room>))
        g.carmRooms.set(code, r);
    } catch {}
  }
  return g.carmRooms;
}
function peers(room: string) {
  g.carmPeers ??= new Map();
  let m = g.carmPeers.get(room);
  if (!m) g.carmPeers.set(room, (m = new Map()));
  return m;
}

let saveTimer: NodeJS.Timeout | null = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.writeFile(FILE, JSON.stringify(Object.fromEntries(rooms())), () => {});
  }, 300);
}

const fresh = (): LiveState => ({ sceneIndex: 0, phase: "idle", version: 1, updatedAt: new Date().toISOString() });

/** A room code made elsewhere (e.g. the online room) is created on first open; the first presenter key used becomes its key. */
function room(code: string) {
  let r = rooms().get(code);
  if (!r) {
    r = { key: null, state: fresh(), nicks: {}, answers: {} };
    rooms().set(code, r);
    save();
  }
  return r;
}
function checkKey(r: Room, key: unknown) {
  if (typeof key !== "string" || !key) throw new Error("ลิงก์ผู้บรรยายไม่ถูกต้อง");
  if (!r.key) r.key = key;
  if (r.key !== key) throw new Error("ลิงก์ผู้บรรยายไม่ถูกต้อง");
}
function bump(r: Room, s: Omit<LiveState, "version" | "updatedAt">) {
  r.state = { ...s, version: r.state.version + 1, updatedAt: new Date().toISOString() };
  save();
  return r.state;
}

/** Seconds after the room's first answer to each question, per answer. */
function answerSecs(r: Room) {
  const out: { pid: string; sceneIndex: number; secs: number }[] = [];
  SCENES.forEach((scene, i) => {
    if (!QUESTIONS[scene.id]) return;
    const t = r.times?.[i] ?? {};
    const pids = Object.keys(r.answers[i] ?? {});
    const first = Math.min(...pids.map((p) => t[p] ?? 0));
    for (const pid of pids) out.push({ pid, sceneIndex: i, secs: ((t[pid] ?? first) - first) / 1000 });
  });
  return out;
}

function scores(r: Room) {
  const secs = totalSeconds(answerSecs(r), Object.keys(r.nicks));
  const rows = Object.entries(r.nicks).map(([pid, nickname]) => ({ pid, nickname, score: 0, correct: 0, answered: 0, secs: secs.get(pid) ?? 0 }));
  SCENES.forEach((scene, i) => {
    const q = QUESTIONS[scene.id];
    if (!q) return;
    const all = r.answers[i] ?? {};
    for (const row of rows) {
      const a = all[row.pid];
      if (!a) continue;
      const pts = scoreAnswer(a, q);
      row.score += pts;
      row.answered += 1;
      if (pts === 100) row.correct += 1;
    }
  });
  return rankRows(rows);
}

type Body = Record<string, unknown> & { op: string; room: string };

export function handle(b: Body): unknown {
  if (!RoomSchema.safeParse(b.room).success) throw new Error("ไม่พบห้องนี้");
  const r = room(b.room);
  const pid = typeof b.pid === "string" ? b.pid : "";
  switch (b.op) {
    case "create":
      checkKey(r, b.key);
      return { ok: true };
    case "state":
      return r.state;
    case "reset": {
      // Clears rehearsal names and answers before the real session; the presenter key stays.
      checkKey(r, b.key);
      r.nicks = {};
      r.answers = {};
      r.times = {};
      return bump(r, { sceneIndex: 0, phase: "idle", sim: null });
    }
    case "setState": {
      checkKey(r, b.key);
      const next = b.next as { sceneIndex: number; phase: Phase };
      const cur = r.state;
      // Same fresh-question rule as public.set_session_state (0006_fresh_questions.sql).
      const firstQuestion = SCENES.findIndex((sc) => QUESTIONS[sc.id]);
      const moved = cur.sceneIndex !== next.sceneIndex;
      if (moved && next.sceneIndex === firstQuestion) {
        r.answers = {};
        r.times = {};
      } else if ((moved && (next.phase === "idle" || next.phase === "open")) || (!moved && next.phase === "idle")) {
        delete r.answers[next.sceneIndex];
        delete r.times?.[next.sceneIndex];
      }
      return bump(r, StateSchema.omit({ version: true, updatedAt: true }).parse({ ...next, sim: cur.sim ?? null }));
    }
    case "setSim": {
      checkKey(r, b.key);
      return bump(r, { ...r.state, sim: SimSchema.parse(b.sim) });
    }
    case "hb": {
      const m = peers(b.room);
      const now = Date.now();
      if (typeof b.id === "string") m.set(b.id, { role: String(b.role), t: now });
      for (const [k, v] of m) if (now - v.t > 6000) m.delete(k);
      return { participants: [...m.values()].filter((p) => p.role === "participant").length };
    }
    case "join":
      if (!pid || typeof b.nickname !== "string") throw new Error("ต้องใส่เลขที่และชื่อเข้าห้องก่อน");
      r.nicks[pid] = b.nickname;
      save();
      return { ok: true };
    case "submit": {
      const i = Number(b.sceneIndex);
      if (r.state.sceneIndex !== i || r.state.phase !== "open") throw new Error("ปิดรับคำตอบแล้ว");
      if (!r.nicks[pid]) throw new Error("ต้องใส่เลขที่และชื่อเข้าห้องก่อน");
      const answer = (Array.isArray(b.answer) ? b.answer : []).map(String);
      const all = (r.answers[i] ??= {});
      const times = ((r.times ??= {})[i] ??= {});
      if (answer.length) {
        all[pid] = answer;
        times[pid] = Date.now();
      } else {
        delete all[pid];
        delete times[pid];
      }
      save();
      return { ok: true };
    }
    case "myAnswer":
      return { answer: r.answers[Number(b.sceneIndex)]?.[pid] ?? null };
    case "summary": {
      const i = Number(b.sceneIndex);
      const all = Object.values(r.answers[i] ?? {});
      // The projector shows the live counts to the room, so they are public once the question opens.
      const show = (!!r.key && b.key === r.key) || (r.state.sceneIndex === i && r.state.phase !== "idle");
      const counts: Record<string, number> = {};
      for (const a of all) for (const c of a) counts[c] = (counts[c] ?? 0) + 1;
      return { respondents: all.length, counts: show ? counts : null };
    }
    case "leaderboard":
      return scores(r)
        .slice(0, Number(b.limit) || 10)
        .map(({ rank, nickname, score }) => ({ rank, nickname, score }));
    case "myResult": {
      const rows = scores(r);
      const me = rows.find((x) => x.pid === pid);
      if (!me) return null;
      return { score: me.score, rank: me.rank, of: rows.length, correct: me.correct, answered: me.answered, questions: Object.keys(QUESTIONS).length };
    }
    case "report": {
      checkKey(r, b.key);
      const out: ReportRow[] = [];
      const secs = answerSecs(r);
      for (const [p, nickname] of Object.entries(r.nicks)) {
        let any = false;
        SCENES.forEach((scene, i) => {
          const a = r.answers[i]?.[p];
          if (!a) return;
          any = true;
          const q = QUESTIONS[scene.id];
          out.push({
            participantId: p,
            nickname,
            joinedAt: "",
            sceneIndex: i,
            answer: a,
            points: q ? scoreAnswer(a, q) : null,
            secs: secs.find((x) => x.pid === p && x.sceneIndex === i)?.secs ?? null,
          });
        });
        if (!any) out.push({ participantId: p, nickname, joinedAt: "", sceneIndex: null, answer: null, points: null, secs: null });
      }
      return out;
    }
    default:
      throw new Error("unknown op");
  }
}
