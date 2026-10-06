"use client";

import { useEffect, useState } from "react";
import { useBeep } from "@/lib/beep";

/** Beeps while a diagram's beam is showing (by default the "การเดินทางของรังสี" one), read off the diagram itself so
 * it stays in step. `beam` picks the beam element. */
export function JourneyBeep({ beam = "[data-rj-beam]" }: { beam?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => {
      const el = document.querySelector(beam);
      setOn(!!el && Number(getComputedStyle(el).opacity) > 0.3);
    }, 100);
    return () => clearInterval(t);
  }, [beam]);
  useBeep(on);
  return null;
}
