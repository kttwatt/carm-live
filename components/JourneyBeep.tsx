"use client";

import { useEffect, useState } from "react";
import { useBeep } from "@/lib/beep";

/** Beeps while the "การเดินทางของรังสี" diagram's beam is showing, read off the diagram itself so it stays in step. */
export function JourneyBeep() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => {
      const beam = document.querySelector("[data-rj-beam]");
      setOn(!!beam && Number(getComputedStyle(beam).opacity) > 0.3);
    }, 100);
    return () => clearInterval(t);
  }, []);
  useBeep(on);
  return null;
}
