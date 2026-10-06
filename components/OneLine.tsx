"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** A title kept on one line (or on the lines its "\n" breaks make): at `size` (vw) when it fits, smaller by just
 * enough when it does not. A title so long that it would shrink under `min` (vw) wraps at `min` instead, so it never
 * ends up smaller than the text under it. */
export function OneLine({ size, min, className = "", children }: { size: number; min: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      // set on the element: the global "text-wrap: balance" for headings would otherwise let it wrap.
      // "pre" keeps a line break written in the text ("\n"), so a long title can be split where it reads best.
      el.style.whiteSpace = "pre";
      el.style.fontSize = `${size}vw`;
      if (el.scrollWidth <= el.clientWidth) return;
      // without wrapping, the widest line grows in step with the size; 0.99 leaves a hair of margin
      const fitted = (size * el.clientWidth * 0.99) / el.scrollWidth;
      if (fitted >= min) {
        el.style.fontSize = `${fitted}vw`;
      } else {
        el.style.whiteSpace = "pre-line";
        el.style.fontSize = `${min}vw`;
      }
    };
    fit();
    // the web font changes the width once it arrives
    document.fonts?.ready.then(fit);
  }, [size, min, children]);

  return (
    <h1 ref={ref} className={className}>
      {children}
    </h1>
  );
}
