"use client";

import { useEffect, useState } from "react";

/**
 * Browsers only let a page play sound after someone has clicked it. Until then the main screen shows a
 * small reminder, so the click happens while setting up rather than when the video starts.
 * Hidden in the control-page miniature (?preview=1), which is always muted.
 */
export function SoundHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") === "1") return;
    if (navigator.userActivation?.hasBeenActive) return;
    setShow(true);
    const done = () => setShow(false);
    window.addEventListener("pointerdown", done, { once: true });
    window.addEventListener("keydown", done, { once: true });
    return () => {
      window.removeEventListener("pointerdown", done);
      window.removeEventListener("keydown", done);
    };
  }, []);
  if (!show) return null;
  return (
    <p className="fixed left-[2vw] top-[2vh] z-40 rounded-full bg-amber px-[1.4vw] py-[0.8vh] text-[1.1vw] font-semibold text-ink">
      🔊 คลิกที่จอนี้หนึ่งครั้ง เพื่อให้วิดีโอมีเสียง
    </p>
  );
}
