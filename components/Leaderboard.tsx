"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { LeaderRow, MyResult } from "@/lib/scoring";

/** Re-reads a value every few seconds while `enabled`. */
export function usePolled<T>(load: () => Promise<T>, enabled: boolean, everyMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const run = () =>
      load()
        .then((d) => alive && setData(d))
        .catch(() => {});
    run();
    const t = window.setInterval(run, everyMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [load, enabled, everyMs]);
  return data;
}

const MEDAL: Record<number, string> = { 1: "#f2b233", 2: "#c9d3dd", 3: "#d08a4e" };

/** Counts a number up from where it was to its new value. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      return setShown(value);
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
}

/**
 * Leaderboard as score bars: each bar's length is the score against the leader's,
 * bars grow in, scores count up, and gains (+100) and rank moves (▲2) show since the last refresh.
 */
export function LeaderList({
  rows,
  size = "md",
  me,
}: {
  rows: LeaderRow[] | null;
  size?: "md" | "xl";
  /** on a participant's phone: their own standing, highlighted, and added below the top list if they are not in it */
  me?: LeaderRow | null;
}) {
  const xl = size === "xl";
  const [grown, setGrown] = useState(false);
  const prev = useRef<Map<string, { score: number; rank: number }>>(new Map());
  const [moves, setMoves] = useState<Map<string, { gain: number; climb: number }>>(new Map());

  useEffect(() => {
    if (!rows) return;
    const next = new Map<string, { gain: number; climb: number }>();
    rows.forEach((r) => {
      const p = prev.current.get(r.nickname);
      if (p) next.set(r.nickname, { gain: r.score - p.score, climb: p.rank - r.rank });
    });
    setMoves(next);
    prev.current = new Map(rows.map((r) => [r.nickname, { score: r.score, rank: r.rank }]));
    const t = window.setTimeout(() => setGrown(true), 60);
    return () => clearTimeout(t);
  }, [rows]);

  if (!rows) return <p className="text-mist">กำลังรวมคะแนน…</p>;
  // Only people with points: after "start over" everyone is back at 0 and the board starts empty.
  const scored = rows.filter((r) => r.score > 0);
  if (!scored.length) return <p className={`text-mist ${xl ? "text-[1.6vw]" : ""}`}>ยังไม่มีคะแนน</p>;
  const top = Math.max(...scored.map((r) => r.score), 1);
  const isMe = (r: LeaderRow) => !!me && r.nickname === me.nickname && r.rank === me.rank;
  const items = scored.map((r) => ({ r, gapBefore: false }));
  if (me && me.score > 0 && !scored.some(isMe)) items.push({ r: me, gapBefore: true });

  return (
    <ol className={`flex flex-col ${xl ? "gap-[1.2vh]" : "gap-1.5"}`}>
      {items.map(({ r, gapBefore }, i) => {
        const medal = MEDAL[r.rank];
        const mine = isMe(r);
        const pct = r.score > 0 ? Math.max(8, (r.score / top) * 100) : 0;
        const m = moves.get(r.nickname);
        // dark text only where the full gold bar sits behind it
        const lead = r.rank === 1 && r.score > 0;
        return (
          <Fragment key={`${r.nickname}-${i}`}>
          {gapBefore && (
            <li aria-hidden className="text-center leading-none text-mist">
              ⋯
            </li>
          )}
          <li
            key={`${r.nickname}-${i}`}
            aria-current={mine ? "true" : undefined}
            className={`relative overflow-hidden rounded-xl bg-night-2 animate-[rise_.5s_ease-out_both] ${
              mine ? "ring-2 ring-sky ring-offset-2 ring-offset-night" : ""
            }`}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {/* the bar: length = score relative to the leader */}
            <div
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-xl transition-[width] duration-[1100ms] ease-out"
              style={{
                width: grown ? `${pct}%` : "0%",
                transitionDelay: `${i * 90 + 150}ms`,
                background:
                  r.rank === 1
                    ? "linear-gradient(90deg, #f2b233, #ffd36e)"
                    : r.rank <= 3
                      ? `linear-gradient(90deg, ${medal}55, ${medal}99)`
                      : "linear-gradient(90deg, #0b6e9955, #5cc3e688)",
              }}
            />
            <div className={`relative flex items-center gap-[1.2vw] ${xl ? "px-[1.4vw] py-[1.1vh] text-[1.9vw]" : "gap-3 px-3 py-2"}`}>
              <span
                className={`grid shrink-0 place-items-center rounded-full font-display font-bold tabular-nums ${
                  xl ? "h-[2.6vw] w-[2.6vw]" : "h-7 w-7 text-sm"
                } ${r.rank === 1 ? "animate-[glow_2s_ease-in-out_infinite]" : ""}`}
                style={
                  lead
                    ? { background: "#12202e", color: "#f2b233" }
                    : medal
                      ? { background: medal, color: "#12202e" }
                      : { background: "#0e1a2b", color: "#bfd0de" }
                }
              >
                {r.rank}
              </span>
              <span className={`min-w-0 flex-1 truncate ${lead ? "font-semibold text-[#12202e]" : ""}`}>
                {r.nickname}
                {mine && (
                  <span className={`ml-2 rounded-full bg-sky px-2 py-0.5 text-xs font-bold text-ink ${xl ? "text-[1vw]" : ""}`}>คุณ</span>
                )}
                {m && m.climb > 0 && (
                  <span className={`ml-2 font-semibold text-ok ${xl ? "text-[1.2vw]" : "text-xs"} ${lead ? "!text-[#1d6b2c]" : ""}`}>
                    ▲{m.climb}
                  </span>
                )}
              </span>
              {m && m.gain > 0 && (
                <span
                  key={`${r.nickname}-${r.score}`}
                  className={`rounded-full bg-ok px-[0.6em] font-bold text-ink animate-[pop_.6s_ease-out_both] ${xl ? "text-[1.3vw]" : "text-xs"}`}
                >
                  +{m.gain}
                </span>
              )}
              <span className={`font-semibold tabular-nums ${lead ? "text-[#12202e]" : ""}`}>
                <CountUp value={r.score} /> คะแนน
              </span>
            </div>
          </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export function MyScore({ result }: { result: MyResult | null }) {
  if (!result) return <p className="text-mist">กำลังรวมคะแนน…</p>;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-night-2 p-5">
      <p className="text-sm font-semibold tracking-wide text-amber">คะแนนของคุณ</p>
      <p className="font-display text-5xl font-bold tabular-nums">{result.score}</p>
      <p>
        อันดับ <b className="tabular-nums">{result.rank}</b> จาก {result.of} คน
      </p>
      <p className="text-sm text-mist">
        ตอบถูกเต็ม {result.correct} ข้อ · ตอบ {result.answered} จาก {result.questions} ข้อ
      </p>
    </div>
  );
}
