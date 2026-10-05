"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { liveMode, makeTransport, type PresenceMeta, type Transport } from "./transport";
import type { LiveState, Phase, Sim } from "./state";

export type LiveStatus = "connecting" | "live" | "offline" | "missing";

/**
 * One live session per page: subscribe first, then read the latest session_state,
 * and read it again on every reconnect, tab return or network return.
 * A snapshot only replaces the current one when its version is not older.
 */
export function useLive(room: string, presence: PresenceMeta | null) {
  const [state, setState] = useState<LiveState | null>(null);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const [participants, setParticipants] = useState(0);
  const transport = useRef<Transport | null>(null);

  const apply = useCallback((s: LiveState) => {
    setState((prev) => (!prev || s.version >= prev.version ? s : prev));
  }, []);

  useEffect(() => {
    const t = makeTransport(room);
    transport.current = t;
    let alive = true;

    const refetch = async () => {
      try {
        const s = await t.fetchState();
        if (!alive) return;
        if (s === null) return setStatus("missing");
        apply(s);
        setStatus("live");
      } catch {
        if (alive) setStatus("offline");
      }
    };

    t.subscribe(
      (s) => alive && apply(s),
      (connected) => {
        if (!alive) return;
        if (connected) refetch();
        else setStatus("offline");
      },
    );

    const onVisible = () => document.visibilityState === "visible" && refetch();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", refetch);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", refetch);
      t.close();
      transport.current = null;
    };
  }, [room, apply]);

  const presenceRole = presence?.role;
  const presenceName = presence?.nickname;
  useEffect(() => {
    if (!presenceRole) return;
    transport.current?.trackPresence({ role: presenceRole, nickname: presenceName }, setParticipants);
  }, [room, presenceRole, presenceName]);

  const update = useCallback(
    async (next: { sceneIndex: number; phase: Phase }, key: string) => {
      if (!transport.current) throw new Error("ยังไม่ได้เชื่อมต่อ");
      const s = await transport.current.setState(next, key);
      apply(s);
      return s;
    },
    [apply],
  );

  const setSim = useCallback(
    async (sim: Sim, key: string) => {
      if (!transport.current) throw new Error("ยังไม่ได้เชื่อมต่อ");
      const s = await transport.current.setSim(sim, key);
      apply(s);
      return s;
    },
    [apply],
  );

  const joinParticipant = useCallback(async (nickname: string) => {
    await transport.current?.joinParticipant(nickname);
  }, []);

  const submitAnswer = useCallback(async (sceneIndex: number, answer: string[]) => {
    if (!transport.current) throw new Error("ยังไม่ได้เชื่อมต่อ");
    await transport.current.submitAnswer(sceneIndex, answer);
  }, []);
  const myAnswer = useCallback(async (sceneIndex: number) => transport.current?.myAnswer(sceneIndex) ?? null, []);
  const summary = useCallback(
    async (sceneIndex: number, key?: string) => transport.current?.summary(sceneIndex, key) ?? null,
    [],
  );

  const leaderboard = useCallback(async (limit?: number) => transport.current?.leaderboard(limit) ?? [], []);
  const report = useCallback(async (key: string) => transport.current?.report(key) ?? [], []);
  const myResult = useCallback(async () => transport.current?.myResult() ?? null, []);

  return {
    state, status, participants, update, setSim, joinParticipant,
    submitAnswer, myAnswer, summary, leaderboard, myResult, report, mode: liveMode,
  };
}
