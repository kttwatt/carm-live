"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** A title kept on one line: at `size` (vw) when it fits, smaller by just enough when it does not. */
export function OneLine({ size, className = "", children }: { size: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = `${size}vw`;
      // on one line the width grows in step with the size; 0.99 leaves a hair of margin
      if (el.scrollWidth > el.clientWidth) el.style.fontSize = `${(size * el.clientWidth * 0.99) / el.scrollWidth}vw`;
    };
    fit();
    // the web font changes the width once it arrives
    document.fonts?.ready.then(fit);
  }, [size, children]);

  return (
    // set on the element: the global "text-wrap: balance" for headings would otherwise let it wrap
    <h1 ref={ref} className={className} style={{ whiteSpace: "nowrap" }}>
      {children}
    </h1>
  );
}
