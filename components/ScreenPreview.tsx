"use client";

import { useEffect, useRef, useState } from "react";
import { BASE_PATH, roomHref } from "@/lib/room";

// The projector page is laid out in vw/vh, so render it at a projector size and scale it down.
const W = 1280;
const H = 720;

/**
 * The real main screen for this room, shrunk to fit: whatever the projector shows, the presenter sees.
 * As large as the height allows while open/reveal stay above the bottom bar (about 530px of other controls),
 * but never smaller than before on short screens such as iPad mini landscape.
 */
export function ScreenPreview({ room }: { room: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="relative mx-auto aspect-video w-full max-w-[max(calc(36dvh*16/9),calc((100dvh-530px)*16/9))] overflow-hidden rounded-xl border border-line bg-night">
      {scale > 0 && (
        <iframe
          src={`${BASE_PATH}${roomHref("screen", room)}&preview=1`}
          title="ภาพบนจอหลัก"
          tabIndex={-1}
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
