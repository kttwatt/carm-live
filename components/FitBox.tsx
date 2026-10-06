"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Fills the room left under a page's title: the content zooms up to `cap` times its size, or down as far as it
 * must, so no picture or line ever falls off the screen. The content is laid over the room rather than in it, so
 * zooming it never changes the room it is measured against. `of` is what it shows (the page): a new one is fitted afresh. */
export function FitBox({ of, cap, className = "", children }: { of: unknown; cap: number; className?: string; children: ReactNode }) {
  const room = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = room.current;
    const el = body.current;
    if (!box || !el) return;
    const fit = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      // does the content fit at zoom z? (text rewraps as the zoom changes, so the size is not simply proportional)
      const fits = (z: number) => {
        el.style.zoom = String(z);
        el.style.width = `${w / z}px`;
        const top = box.getBoundingClientRect();
        for (const n of el.querySelectorAll("*")) {
          const r = n.getBoundingClientRect();
          if ((r.width || r.height) && (r.bottom > top.bottom + 2 || r.right > top.right + 2)) return false;
        }
        return true;
      };
      if (fits(cap)) return;
      // the largest zoom that fits, to within 1%
      let lo = 0.3;
      let hi = cap;
      while (hi - lo > 0.01) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      fits(lo);
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    // pictures and the web font change the size once they arrive
    el.addEventListener("load", fit, true);
    document.fonts?.ready.then(fit);
    return () => {
      watch.disconnect();
      el.removeEventListener("load", fit, true);
    };
  }, [of, cap]);

  return (
    // clipped, so a size being tried that is too large never gives the page a scrollbar (which would change the room)
    <div ref={room} className="relative min-h-0 flex-1 overflow-hidden">
      <div ref={body} className={`absolute left-0 top-0 ${className}`}>
        {children}
      </div>
    </div>
  );
}
