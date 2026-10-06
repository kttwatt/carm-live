"use client";

import { useState } from "react";

// Confetti falling from the top of the screen over the final podium, starting at `start` seconds (when 1st lands)
// and falling on for as long as the page is up. Plain CSS (keyframes `cf-fall` in globals.css), laid over everything
// without catching clicks.

const COLORS = ["#f2b233", "#ffd36e", "#5cc3e6", "#f3f6f8", "#5cc46f", "#f08a5d", "#c9d3dd"];
const PIECES = 90;

export function Confetti({ start }: { start: number }) {
  // drawn once per showing: where each piece falls, how fast, and how it turns
  const [pieces] = useState(() =>
    Array.from({ length: PIECES }, (_, i) => ({
      left: Math.random() * 100,
      w: 0.5 + Math.random() * 0.6,
      h: 0.9 + Math.random() * 0.9,
      color: COLORS[i % COLORS.length],
      fall: 3.5 + Math.random() * 3,
      // the first wave all within a second of 1st landing, the rest spread over the fall time
      delay: start + (i < 40 ? Math.random() : Math.random() * 6),
      sway: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 5),
      spin: 360 + Math.random() * 720,
    })),
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[2px]"
          style={
            {
              left: `${p.left}vw`,
              width: `${p.w}vw`,
              height: `${p.h}vw`,
              background: p.color,
              "--sway": `${p.sway}vw`,
              "--spin": `${p.spin}deg`,
              animation: `cf-fall ${p.fall}s linear ${p.delay}s infinite both`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
