"use client";

import { useEffect, useState } from "react";
import type { Summary } from "./transport";
import type { Phase } from "./state";

/** Polls the answer summary every 2 s while a question scene is live (presenter and projector only). */
export function useSummary(
  summary: (sceneIndex: number, key?: string) => Promise<Summary | null>,
  sceneIndex: number,
  phase: Phase,
  enabled: boolean,
  key?: string,
) {
  const [data, setData] = useState<Summary | null>(null);
  useEffect(() => {
    setData(null);
    if (!enabled) return;
    let alive = true;
    const load = () =>
      summary(sceneIndex, key)
        .then((s) => alive && s && setData(s))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [summary, sceneIndex, phase, enabled, key]);
  return data;
}
