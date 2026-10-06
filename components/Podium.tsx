"use client";

import { useEffect, useRef } from "react";
import type { LeaderRow } from "@/lib/scoring";
import { playCeremony } from "@/lib/ceremony";
import { Confetti } from "@/components/Confetti";

// The final ranking as an Olympic podium for the top four, the rest in a compact list under it.
// Steps stand 2 · 1 · 3 · 4, so 1st is the tallest in the middle and the line steps down to its right; they rise
// one after another, 4th first and 1st last (keyframes `pd-*` in globals.css), to a drumroll, a chime as each lands and
// a fanfare for 1st (lib/ceremony.ts), and then confetti falls.

const STEPS = [
  { place: 2, height: 24, color: "linear-gradient(180deg, #e3e9ef, #a9b6c3)", delay: 0.9 },
  { place: 1, height: 32, color: "linear-gradient(180deg, #ffd36e, #f2b233)", delay: 1.4 },
  { place: 3, height: 18, color: "linear-gradient(180deg, #e3a36a, #b8733d)", delay: 0.5 },
  { place: 4, height: 12, color: "linear-gradient(180deg, #2f7fae, #0b6e99)", delay: 0.1 },
];

/** how long a step takes to rise (s, as in its animation) */
const RISE = 0.7;
const landsAt = (place: number) => STEPS.find((s) => s.place === place)!.delay + RISE;

/** `muted`: no sound, as in the control page's miniature of the screen. */
export function Podium({ rows, muted }: { rows: LeaderRow[] | null; muted?: boolean }) {
  const hasScores = !!rows?.some((r) => r.score > 0);
  // the ceremony plays once, when the podium first goes up (the board refreshes every few seconds after),
  // and fades out if the page changes before the music ends
  const played = useRef(false);
  useEffect(() => {
    if (!hasScores || muted || played.current) return;
    played.current = true;
    const stop = playCeremony({ fourth: landsAt(4), third: landsAt(3), second: landsAt(2), first: landsAt(1) });
    return () => {
      stop();
      played.current = false;
    };
  }, [hasScores, muted]);

  if (!rows) return <p className="text-[1.6vw] text-mist">กำลังรวมคะแนน…</p>;
  // Only people with points: after "start over" everyone is back at 0 and the board starts empty.
  const scored = rows.filter((r) => r.score > 0);
  if (!scored.length) return <p className="text-[1.6vw] text-mist">ยังไม่มีคะแนน</p>;
  const rest = scored.slice(4);
  return (
    <div className="flex flex-col items-center gap-[3vh]">
      <Confetti start={landsAt(1)} />
      <div className="flex items-end justify-center gap-[1.2vw]">
        {STEPS.map(({ place, height, color, delay }) => {
          const r = scored[place - 1];
          return (
            <div key={place} className="flex w-[17vw] flex-col items-center gap-[1vh]">
              {/* who: shown once their step is up */}
              <div
                className="flex flex-col items-center text-center"
                style={{ opacity: r ? 1 : 0, animation: `pd-fade 0.5s ease-out ${delay + 0.6}s both` }}
              >
                <span className={`w-full truncate font-display font-bold leading-tight ${place === 1 ? "text-[2.2vw] text-amber" : "text-[1.7vw]"}`}>
                  {r?.nickname ?? "–"}
                </span>
                <span className="text-[1.4vw] tabular-nums text-mist">{r ? `${r.score} คะแนน` : ""}</span>
              </div>
              {/* the step, with its place on the front */}
              <div
                className="relative flex w-full justify-center rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
                style={{ height: `${height}vh`, background: color, transformOrigin: "bottom", animation: `pd-grow ${RISE}s ease-out ${delay}s both` }}
              >
                <span className={`mt-[1.4vh] font-display font-bold leading-none ${place === 4 ? "text-paper" : "text-ink"} ${place === 1 ? "text-[6vw]" : "text-[4.4vw]"}`}>
                  {r?.rank ?? place}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        // 5th place on, three to a row
        <ol className="grid w-full max-w-[74vw] grid-cols-3 gap-[1vh_1.4vw]" style={{ animation: "pd-fade 0.6s ease-out 2.2s both" }}>
          {rest.map((r) => (
            <li key={`${r.rank}-${r.nickname}`} className="flex items-center gap-[1vw] rounded-xl bg-night-2 px-[1.2vw] py-[0.8vh] text-[1.5vw]">
              <span className="w-[2.2vw] shrink-0 font-display font-bold tabular-nums text-mist">{r.rank}</span>
              <span className="min-w-0 flex-1 truncate">{r.nickname}</span>
              <span className="shrink-0 font-semibold tabular-nums">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
