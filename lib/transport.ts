"use client";

import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { type LeaderRow, type MyResult, type ReportRow } from "./scoring";
import { BASE_PATH } from "./room";
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
  /** counts is null until the presenter key is given or the scene's question opens */
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
  await lan({ op: "create", room, key });
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
    type Row = { participant_id: string; nickname: string; joined_at: string; scene_index: number | null; answer: string[] | null; points: number | null; secs: number | null };
    return ((data ?? []) as Row[]).map((r) => ({
      participantId: r.participant_id,
      nickname: r.nickname,
      joinedAt: r.joined_at,
      sceneIndex: r.scene_index,
      answer: r.answer,
      points: r.points,
      secs: r.secs == null ? null : Number(r.secs),
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

/* ---------------- Local: rooms kept by this computer's dev server (app/api/local), shared over Wi-Fi ---------------- */

async function lan<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_PATH}/api/local`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as { data?: T; error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? "เชื่อมต่อเครื่องผู้บรรยายไม่ได้");
  return json.data as T;
}

/** One participant per device (kept across reloads, like the Supabase anonymous sign-in). */
function localPid() {
  let id = localStorage.getItem("carm-local-pid");
  if (!id) localStorage.setItem("carm-local-pid", (id = uid()));
  return id;
}

class LocalTransport implements Transport {
  mode = "local" as const;
  private id = uid();
  private timers: number[] = [];
  constructor(private room: string) {}
  private call<T>(op: string, extra: Record<string, unknown> = {}) {
    return lan<T>({ op, room: this.room, ...extra });
  }

  async fetchState() {
    return StateSchema.parse(await this.call("state"));
  }

  // Polls the server; a version change is a new snapshot, a failed request means offline.
  subscribe(onState: (s: LiveState) => void, onStatus: (c: boolean) => void) {
    let last = -1;
    let up: boolean | null = null;
    const tick = async () => {
      try {
        const s = await this.fetchState();
        if (up !== true) onStatus((up = true));
        if (s.version !== last) onState(s);
        last = s.version;
      } catch {
        if (up !== false) onStatus((up = false));
      }
    };
    tick();
    this.timers.push(window.setInterval(tick, 700));
  }

  async setState(next: { sceneIndex: number; phase: Phase }, key: string) {
    return StateSchema.parse(await this.call("setState", { next, key }));
  }

  async setSim(sim: Sim, key: string) {
    return StateSchema.parse(await this.call("setSim", { sim, key }));
  }

  trackPresence(meta: PresenceMeta, onCount: (n: number) => void) {
    const beat = () =>
      this.call<{ participants: number }>("hb", { id: this.id, role: meta.role })
        .then((r) => onCount(r.participants))
        .catch(() => {});
    beat();
    this.timers.push(window.setInterval(beat, 2000));
  }

  async joinParticipant(nickname: string) {
    await this.call("join", { pid: localPid(), nickname });
  }

  async report(key: string) {
    return this.call<ReportRow[]>("report", { key });
  }

  async leaderboard(limit = 10) {
    return this.call<LeaderRow[]>("leaderboard", { limit });
  }

  async myResult() {
    return this.call<MyResult | null>("myResult", { pid: localPid() });
  }

  async submitAnswer(sceneIndex: number, answer: string[]) {
    await this.call("submit", { pid: localPid(), sceneIndex, answer });
  }

  async myAnswer(sceneIndex: number) {
    return (await this.call<{ answer: string[] | null }>("myAnswer", { pid: localPid(), sceneIndex })).answer;
  }

  async summary(sceneIndex: number, presenterKey?: string) {
    return this.call<Summary>("summary", { sceneIndex, key: presenterKey });
  }

  close() {
    this.timers.forEach(clearInterval);
  }
}
