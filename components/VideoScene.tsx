"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/room";

/**
 * Full-screen video on the main screen, driven by the presenter: it starts from the beginning when the
 * scene opens or `seq` goes up, and follows `playing`. The browser may refuse to play sound before anyone
 * has clicked the page; then it plays muted and asks for one click on the projector screen.
 */
export function VideoScene({ src, playing, seq, muted }: { src: string; playing: boolean; seq: number; muted: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsClick, setNeedsClick] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (v) v.currentTime = 0;
  }, [seq]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (!playing) return v.pause();
    v.play().catch(() => {
      if (muted) return;
      v.muted = true;
      setNeedsClick(true);
      v.play().catch(() => {});
    });
  }, [playing, seq, muted]);

  const unmute = () => {
    const v = ref.current;
    if (!v || muted) return;
    v.muted = false;
    setNeedsClick(false);
  };

  return (
    <main className="relative flex-1 bg-black" onClick={unmute}>
      <video ref={ref} src={asset(src)} muted={muted} playsInline preload="auto" className="absolute inset-0 h-full w-full object-contain" />
      {needsClick && (
        <p className="absolute bottom-[4vh] left-1/2 -translate-x-1/2 rounded-full bg-amber px-[2vw] py-[1vh] text-[1.4vw] font-semibold text-ink">
          คลิกที่จอนี้หนึ่งครั้งเพื่อเปิดเสียง
        </p>
      )}
    </main>
  );
}
