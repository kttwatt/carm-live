"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// One page per child, swiped left/right (scroll snap does the swiping; buttons and arrow keys step too).
// Each page scrolls up/down on its own when its content is taller than the screen.
export function SlideDeck({ ids, children }: { ids: string[]; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pages = Children.toArray(children);
  const total = pages.length;

  const go = useCallback(
    (i: number, smooth = true) => {
      const el = track.current;
      if (!el) return;
      const to = Math.max(0, Math.min(total - 1, i));
      el.scrollTo({ left: to * el.clientWidth, behavior: smooth ? "smooth" : "instant" });
    },
    [total],
  );

  // Open at the slide named in the link (#s03), and follow links to other slides inside the deck.
  // The counter is set here too: the browser may already have scrolled to the slide before the page
  // came alive, and then no scroll event follows.
  useEffect(() => {
    const jump = (smooth: boolean) => {
      const at = ids.indexOf(decodeURIComponent(location.hash.slice(1)));
      if (at < 0) return;
      go(at, smooth);
      setIndex(at);
    };
    jump(false);
    const onHash = () => jump(true);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [ids, go]);

  // Stay on the same slide when the phone turns sideways or the window resizes.
  const current = useRef(0);
  useEffect(() => {
    current.current = index;
  }, [index]);
  useEffect(() => {
    const onResize = () => go(current.current, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) {
      setIndex(i);
      history.replaceState(null, "", i === 0 ? location.pathname : `#${ids[i]}`);
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <div
        ref={track}
        onScroll={onScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none]"
      >
        {pages.map((page, i) => (
          <div key={ids[i]} id={ids[i]} className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 py-8">{page}</div>
          </div>
        ))}
      </div>

      <nav className="flex items-center justify-between gap-3 border-t border-line bg-night-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="สไลด์ก่อนหน้า"
          className="rounded-lg px-4 py-2 font-display text-xl font-bold text-amber disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-sm tabular-nums text-mist">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label="สไลด์ถัดไป"
          className="rounded-lg px-4 py-2 font-display text-xl font-bold text-amber disabled:opacity-30"
        >
          ›
        </button>
      </nav>
    </div>
  );
}
