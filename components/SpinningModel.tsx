"use client";

import { useCallback, useRef } from "react";
import { asset } from "@/lib/room";

/**
 * The 3D C-arm turning slowly on its own, for a lecture page (no part picked, no beam).
 * `lite` is the light version for phones and the control-page miniature.
 */
export function SpinningModel({ lite }: { lite?: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const spin = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: "carm3d", spin: true, part: null }, window.location.origin);
  }, []);
  return (
    <iframe
      ref={ref}
      src={asset(`/carm-3d.html?embed=1&${lite ? "lite=1" : "motion=1"}&v=${process.env.MODEL_BUILD}`)}
      title="แบบจำลองสามมิติของเครื่อง C-Arm หมุนรอบ"
      loading="lazy"
      tabIndex={-1}
      onLoad={spin}
      className="pointer-events-none absolute inset-0 h-full w-full border-0"
    />
  );
}
