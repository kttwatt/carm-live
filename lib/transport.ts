"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { QUESTIONS } from "./questions";
import { SCENES } from "./scenes";
import { scoreAnswer, type LeaderRow, type MyResult, type ReportRow } from "./scoring";
import { SimSchema, StateSchema, randomKey, randomRoom, uid, type LiveState, type Phase, type Sim } from "./state";

export type Role = "presenter" | "screen" | "participant";
export type PresenceMeta = { role: Role; nickname?: string };

export interface Transport {
  mode: "supabase" | "local";
  /** null = the room does not exist */
  fetchState(): Promise<LiveState | null>;
  /** Call before fetchState so no change is missed; onStatus(true) fires on every (re)connect. */
  subscribe(onState: (s: LiveState) => void, onStatus: (connected: boolean) => void): void;
  setState(next: { sceneIndex: number; phase: Phase }, presenterKey: string): Promise<LiveState>;
  setSim(sim: Sim, presenterKey: string): Promise<LiveState>;
  trackPresence(meta: PresenceMeta, onCount: (participants: number) => void): void;
  joinParticipant(nickname: string): Promise<void>;
  submitAnswer(sceneIndex: number, answer: string[]): Promise<void>;
  myAnswer(sceneIndex: number): Promise<string[] | null>;
  /** counts is null until the presenter key is given or the scene is revealed */
  summary(sceneIndex: number, presenterKey?: string): Promise<Summary>;
  leaderboard(limit?: number): Promise<LeaderRow[]>;
  /** presenter only: every participant and answer with points */
  report(presenterKey: string): Promise<ReportRow[]>;
  /** null when this device has not joined */
  myResult(): Promise<MyResult | null>;
  close(): void;
}

export type Summary = { respondents: number; counts: Record<string, number> | null };

const SERVER_ERRORS: Record<string, string> = {
  "answers closed": "ปิดรับคำตอบแล้ว",
  "join the room first": "ต้องใส่เลขที่และชื่อเข้าห้องก่อน",
  "sign in required": "ต้องใส่เลขที่และชื่อเข้าห้องก่อน",
  "invalid answer": "คำตอบไม่ถูกต้อง",
  "room not found": "ไม่พบห้องนี้",
  "presenter key invalid": "ลิงก์ผู้บรรยายไม่ถูกต้อง",
  "invalid demo settings": "ค่าการสาธิตไม่ถูกต้อง",
};
const friendly = (e: { message: string }) => new Error(SERVER_ERRORS[e.message] ?? e.message);

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const liveMode: Transport["mode"] = URL && ANON ? "supabase" : "local";

let client: SupabaseClient | null = null;
function supabase() {
  if (!client) client = createClient(URL!, ANON!, { realtime: { params: { eventsPerSecond: 10 } } });
  return client;
}

export function makeTransport(room: string): Transport {
  return liveMode === "supabase" ? new SupabaseTransport(supabase(), room) : new LocalTransport(room);
}

export async function createSession(title: string): Promise<{ room: string; key: string }> {
  if (liveMode === "supabase") {
    const { data, error } = await supabase().rpc("create_session", { p_title: title });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { room: row.room_code, key: row.presenter_key };
  }
  const room = randomRoom();
  const key = randomKey();
  localStorage.setItem(`carm-local-key-${room}`, key);
  const s: LiveState = { sceneIndex: 0, phase: "idle", version: 1, updatedAt: new Date().toISOString() };
  localStorage.setItem(`carm-local-state-${room}`, JSON.stringify(s));
  return { room, key };
}

/* ---------------- Supabase: Postgres changes for state, Presence for counts ---------------- */

type StateRow = { scene_index: number; phase: string; version: number | string; updated_at: string; sim?: unknown };
const fromRow = (r: StateRow): LiveState =>
  StateSchema.parse({
    sceneIndex: r.scene_index,
    phase: r.phase,
    version: Number(r.version),
    updatedAt: r.updated_at,
    sim: SimSchema.nullable().catch(null).parse(r.sim ?? null),
  });

class SupabaseTransport implements Transport {
  mode = "supabase" as const;
  private sessionId: string | null = null;
  private channels: RealtimeChannel[] = [];
  private closed = false;
  constructor(private sb: SupabaseClient, private room: string) {}

  private async ensureSessionId() {
    if (this.sessionId) return this.sessionId;
    const { data, error } = await this.sb.from("sessions").select("id").eq("room_code", this.room).maybeSingle();
    if (error) throw error;
    this.sessionId = data?.id ?? null;
    return this.sessionId;
  }

  async fetchState() {
    const id = await this.ensureSessionId();
    if (!id) return null;
    const { data, error } = await this.sb.from("session_state").select("*").eq("session_id", id).single();
    if (error) throw error;
    return fromRow(data as StateRow);
  }

  subscribe(onState: (s: LiveState) => void, onStatus: (c: boolean) => void) {
    this.ensureSessionId()
      .then((id) => {
        if (this.closed) return;
        if (!id) return onStatus(true); // lets the caller fetch and discover the room is missing
        // A unique topic per transport: supabase-js hands back a still-closing channel with the same topic.
        const ch = this.sb
          .channel(`state:${id}:${uid()}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "session_state", filter: `session_id=eq.${id}` },
            (p) => {
              try {
                onState(fromRow(p.new as StateRow));
              } catch {
                /* ignore malformed rows */
              }
            },
          )
          .subscribe((status, err) => {
            if (err) console.warn("realtime state channel:", status, err.message);
            onStatus(status === "SUBSCRIBED");
          });
        this.channels.push(ch);
      })
      .catch((e) => {
        console.warn("realtime subscribe failed:", e?.message ?? e);
        onStatus(false);
      });
  }

  async setState(next: { sceneIndex: number; phase: Phase }, key: string) {
    const { data, error } = await this.sb.rpc("set_session_state", {
      p_room: this.room,
      p_key: key,
      p_scene: next.sceneIndex,
      p_phase: next.phase,
    });
    if (error) throw friendly(error);
    return fromRow((Array.isArray(data) ? data[0] : data) as StateRow);
  }

  async setSim(sim: Sim, key: string) {
    const { data, error } = await this.sb.rpc("set_sim", { p_room: this.room, p_key: key, p_sim: sim });
    if (error) throw friendly(error);
    return fromRow((Array.isArray(data) ? data[0] : data) as StateRow);
  }

  async submitAnswer(sceneIndex: number, answer: string[]) {
    const { error } = await this.sb.rpc("submit_response", { p_room: this.room, p_scene: sceneIndex, p_answer: answer });
    if (error) throw friendly(error);
  }

  async myAnswer(sceneIndex: number) {
    const id = await this.ensureSessionId();
    const { data: auth } = await this.sb.auth.getSession();
    if (!id || !auth.session) return null;
    const { data } = await this.sb
      .from("responses")
      .select("answer")
      .eq("session_id", id)
      .eq("scene_index", sceneIndex)
      .eq("user_id", auth.session.user.id)
      .maybeSingle();
    return (data?.answer as string[] | undefined) ?? null;
  }

  async summary(sceneIndex: number, presenterKey?: string) {
    const { data, error } = await this.sb.rpc("response_summary", {
      p_room: this.room,
      p_scene: sceneIndex,
      p_key: presenterKey ?? null,
    });
    if (error) throw friendly(error);
    return { respondents: Number(data?.respondents ?? 0), counts: data?.counts ?? null } as Summary;
  }

  async leaderboard(limit = 10) {
    const { data, error } = await this.sb.rpc("leaderboard", { p_room: this.room, p_limit: limit });
    if (error) throw friendly(error);
    return (data ?? []) as LeaderRow[];
  }

  async report(key: string) {
    const { data, error } = await this.sb.rpc("session_report", { p_room: this.room, p_key: key });
    if (error) throw friendly(error);
    type Row = { participant_id: string; nickname: string; joined_at: string; scene_index: number | null; answer: string[] | null; points: number | null };
    return ((data ?? []) as Row[]).map((r) => ({
      participantId: r.participant_id,
      nickname: r.nickname,
      joinedAt: r.joined_at,
      sceneIndex: r.scene_index,
      answer: r.answer,
      points: r.points,
    }));
  }

  async myResult() {
    const { data: auth } = await this.sb.auth.getSession();
    if (!auth.session) return null;
    const { data, error } = await this.sb.rpc("my_result", { p_room: this.room });
    if (error) throw friendly(error);
    const r = Array.isArray(data) ? data[0] : data;
    return r ? { score: r.score, rank: r.rank, of: r.total, correct: r.correct, answered: r.answered, questions: r.questions } : null;
  }

  trackPresence(meta: PresenceMeta, onCount: (n: number) => void, attempt = 0) {
    if (this.closed) return;
    // Presence needs the shared topic, so wait for an earlier channel on it (dev remounts) to finish closing.
    const topic = `presence:${this.room}`;
    if (this.sb.getChannels().some((c) => c.topic === `realtime:${topic}`) && attempt < 20) {
      window.setTimeout(() => this.trackPresence(meta, onCount, attempt + 1), 150);
      return;
    }
    const ch = this.sb.channel(topic, { config: { presence: { key: uid() } } });
    ch.on("presence", { event: "sync" }, () => {
      const st = ch.presenceState<PresenceMeta>();
      onCount(Object.values(st).filter((metas) => metas.some((m) => m.role === "participant")).length);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track(meta);
    });
    this.channels.push(ch);
  }

  async joinParticipant(nickname: string) {
    const { data: auth } = await this.sb.auth.getSession();
    if (!auth.session) {
      const { error } = await this.sb.auth.signInAnonymously();
      if (error) throw error;
    }
    const id = await this.ensureSessionId();
    if (!id) throw new Error("ไม่พบห้องนี้");
    const { error } = await this.sb
      .from("participants")
      .upsert({ session_id: id, nickname }, { onConflict: "session_id,user_id" });
    if (error) throw error;
  }

  close() {
    this.closed = true;
    this.channels.forEach((c) => this.sb.removeChannel(c));
    this.channels = [];
  }
}

/* ---------------- Local: one browser, several tabs (rehearsal without a backend) ---------------- */

type LocalMsg =
  | { type: "state"; state: unknown }
  | { type: "hb"; id: string; role: Role };

class LocalTransport implements Transport {
  mode = "local" as const;
  private bc: BroadcastChannel;
  private id = uid();
  private peers = new Map<string, { role: Role; t: number }>();
  private timers: number[] = [];
  private listeners: Array<() => void> = [];
  constructor(private room: string) {
    this.bc = new BroadcastChannel(`carm-${room}`);
  }
  private stateKey() {
    return `carm-local-state-${this.room}`;
  }

  async fetchState() {
    const raw = localStorage.getItem(this.stateKey());
    if (!raw) return null;
    return StateSchema.parse(JSON.parse(raw));
  }

  subscribe(onState: (s: LiveState) => void, onStatus: (c: boolean) => void) {
    const onMsg = (e: MessageEvent<LocalMsg>) => {
      if (e.data?.type !== "state") return;
      const p = StateSchema.safeParse(e.data.state);
      if (p.success) onState(p.data);
    };
    this.bc.addEventListener("message", onMsg);
    this.listeners.push(() => this.bc.removeEventListener("message", onMsg));
    onStatus(true);
  }

  async setState(next: { sceneIndex: number; phase: Phase }, key: string) {
    if (localStorage.getItem(`carm-local-key-${this.room}`) !== key) throw new Error("ลิงก์ผู้บรรยายไม่ถูกต้อง");
    const cur = await this.fetchState();
    // Same fresh-question rule as public.set_session_state (0006_fresh_questions.sql).
    const firstQuestion = SCENES.findIndex((sc) => QUESTIONS[sc.id]);
    const moved = cur?.sceneIndex !== next.sceneIndex;
    if (moved && next.sceneIndex === firstQuestion) {
      SCENES.forEach((_, i) => localStorage.removeItem(this.answersKey(i)));
    } else if ((moved && (next.phase === "idle" || next.phase === "open")) || (!moved && next.phase === "idle")) {
      localStorage.removeItem(this.answersKey(next.sceneIndex));
    }
    const s: LiveState = { ...next, sim: cur?.sim ?? null, version: (cur?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.stateKey(), JSON.stringify(s));
    this.bc.postMessage({ type: "state", state: s } satisfies LocalMsg);
    return s;
  }

  async setSim(sim: Sim, key: string) {
    if (localStorage.getItem(`carm-local-key-${this.room}`) !== key) throw new Error("ลิงก์ผู้บรรยายไม่ถูกต้อง");
    const cur = await this.fetchState();
    if (!cur) throw new Error("ไม่พบห้องนี้");
    const s: LiveState = { ...cur, sim, version: cur.version + 1, updatedAt: new Date().toISOString() };
    localStorage.setItem(this.stateKey(), JSON.stringify(s));
    this.bc.postMessage({ type: "state", state: s } satisfies LocalMsg);
    return s;
  }

  trackPresence(meta: PresenceMeta, onCount: (n: number) => void) {
    const count = () => {
      const now = Date.now();
      for (const [k, v] of this.peers) if (now - v.t > 6000) this.peers.delete(k);
      const others = [...this.peers.values()].filter((p) => p.role === "participant").length;
      onCount(others + (meta.role === "participant" ? 1 : 0));
    };
    const onMsg = (e: MessageEvent<LocalMsg>) => {
      if (e.data?.type !== "hb" || e.data.id === this.id) return;
      this.peers.set(e.data.id, { role: e.data.role, t: Date.now() });
      count();
    };
    this.bc.addEventListener("message", onMsg);
    this.listeners.push(() => this.bc.removeEventListener("message", onMsg));
    const beat = () => {
      this.bc.postMessage({ type: "hb", id: this.id, role: meta.role } satisfies LocalMsg);
      count();
    };
    beat();
    this.timers.push(window.setInterval(beat, 2000));
  }

  async joinParticipant(nickname: string) {
    const nicks = this.nicknames();
    nicks[this.pid()] = nickname;
    localStorage.setItem(`carm-local-nicks-${this.room}`, JSON.stringify(nicks));
  }
  private nicknames(): Record<string, string> {
    return JSON.parse(localStorage.getItem(`carm-local-nicks-${this.room}`) ?? "{}");
  }
  private scores() {
    const rows = Object.entries(this.nicknames()).map(([pid, nickname]) => ({ pid, nickname, score: 0, correct: 0, answered: 0 }));
    SCENES.forEach((scene, i) => {
      const q = QUESTIONS[scene.id];
      if (!q) return;
      const all = this.answers(i);
      for (const r of rows) {
        const a = all[r.pid];
        if (!a) continue;
        const pts = scoreAnswer(a, q);
        r.score += pts;
        r.answered += 1;
        if (pts === 100) r.correct += 1;
      }
    });
    rows.sort((a, b) => b.score - a.score);
    return rows.map((r) => ({ ...r, rank: rows.findIndex((x) => x.score === r.score) + 1 }));
  }

  async report(key: string) {
    if (localStorage.getItem(`carm-local-key-${this.room}`) !== key) throw new Error("ลิงก์ผู้บรรยายไม่ถูกต้อง");
    const rows: ReportRow[] = [];
    for (const [pid, nickname] of Object.entries(this.nicknames())) {
      let any = false;
      SCENES.forEach((scene, i) => {
        const a = this.answers(i)[pid];
        if (!a) return;
        any = true;
        const q = QUESTIONS[scene.id];
        rows.push({ participantId: pid, nickname, joinedAt: "", sceneIndex: i, answer: a, points: q ? scoreAnswer(a, q) : null });
      });
      if (!any) rows.push({ participantId: pid, nickname, joinedAt: "", sceneIndex: null, answer: null, points: null });
    }
    return rows;
  }

  async leaderboard(limit = 10) {
    return this.scores().slice(0, limit).map(({ rank, nickname, score }) => ({ rank, nickname, score }));
  }

  async myResult() {
    const rows = this.scores();
    const me = rows.find((r) => r.pid === this.pid());
    if (!me) return null;
    return { score: me.score, rank: me.rank, of: rows.length, correct: me.correct, answered: me.answered, questions: Object.keys(QUESTIONS).length };
  }

  // Each tab is its own participant in rehearsal mode.
  private pid() {
    let id = sessionStorage.getItem("carm-local-pid");
    if (!id) sessionStorage.setItem("carm-local-pid", (id = uid()));
    return id;
  }
  private answersKey(sceneIndex: number) {
    return `carm-local-resp-${this.room}-${sceneIndex}`;
  }
  private answers(sceneIndex: number): Record<string, string[]> {
    return JSON.parse(localStorage.getItem(this.answersKey(sceneIndex)) ?? "{}");
  }

  async submitAnswer(sceneIndex: number, answer: string[]) {
    const s = await this.fetchState();
    if (!s || s.sceneIndex !== sceneIndex || s.phase !== "open") throw new Error("ปิดรับคำตอบแล้ว");
    const all = this.answers(sceneIndex);
    if (answer.length) all[this.pid()] = answer;
    else delete all[this.pid()];
    localStorage.setItem(this.answersKey(sceneIndex), JSON.stringify(all));
  }

  async myAnswer(sceneIndex: number) {
    return this.answers(sceneIndex)[this.pid()] ?? null;
  }

  async summary(sceneIndex: number, presenterKey?: string) {
    const all = Object.values(this.answers(sceneIndex));
    const s = await this.fetchState();
    const show =
      (presenterKey && localStorage.getItem(`carm-local-key-${this.room}`) === presenterKey) ||
      (s?.sceneIndex === sceneIndex && s.phase === "revealed");
    const counts: Record<string, number> = {};
    for (const a of all) for (const c of a) counts[c] = (counts[c] ?? 0) + 1;
    return { respondents: all.length, counts: show ? counts : null };
  }

  close() {
    this.timers.forEach(clearInterval);
    this.listeners.forEach((off) => off());
    this.bc.close();
  }
}
