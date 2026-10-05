"use client";

import { useCallback, useEffect, useRef } from "react";
import { asset } from "@/lib/room";
import type { Sim } from "@/lib/state";

/** Scenes where the presenter can put the 3D C-arm model on the main screen. */
export const MODEL3D_SCENES = ["s04"];

export type M3 = NonNullable<Sim["m3"]>;
export const DEFAULT_M3: M3 = { on: false, part: null, fire: false, flip: false };

export const M3_PARTS = [
  { id: "tube", n: 1, name: "หลอดเอกซเรย์" },
  { id: "collimator", n: 2, name: "ตัวจำกัดลำรังสี" },
  { id: "detector", n: 3, name: "ตัวรับภาพ" },
  { id: "carm", n: 4, name: "แขนรูปตัว C" },
  { id: "base", n: 5, name: "ฐานเครื่อง" },
  { id: "monitor", n: 6, name: "รถจอภาพ" },
  { id: "switch", n: 7, name: "สวิตช์ฉายรังสี" },
];

/** Main screen: the 3D page in a frame, kept in step with the presenter's settings. */
export function Model3DStage({ m3 }: { m3: M3 }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: "carm3d", part: m3.part, fire: m3.fire, flip: m3.flip }, window.location.origin);
  }, [m3.part, m3.fire, m3.flip]);
  useEffect(send, [send]);
  return (
    <main className="relative flex-1">
      <iframe
        ref={ref}
        src={asset("/carm-3d.html?embed=1")}
        title="แบบจำลองสามมิติของเครื่อง C-Arm"
        onLoad={send}
        className="absolute inset-0 h-full w-full border-0"
      />
    </main>
  );
}

/** Control page: show/hide the model and drive it from the iPad. */
export function Model3DControls({ sim, onChange, busy }: { sim: Sim; onChange: (s: Sim) => void; busy: boolean }) {
  const m3 = sim.m3 ?? DEFAULT_M3;
  const set = (patch: Partial<M3>) => onChange({ ...sim, m3: { ...m3, ...patch } });
  const btn = "rounded-lg border px-3 py-2 text-sm disabled:opacity-40";
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold">แบบจำลองสามมิติของเครื่อง C-Arm</p>
        <button
          onClick={() => set({ on: !m3.on })}
          disabled={busy}
          className={`ml-auto rounded-xl border-2 px-4 py-2 font-display font-bold disabled:opacity-40 ${m3.on ? "border-warn text-warn" : "border-sky text-sky"}`}
        >
          {m3.on ? "ซ่อนจากจอหลัก" : "แสดงบนจอหลัก"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => set({ fire: !m3.fire })}
          disabled={busy || !m3.on}
          className={`rounded-xl border-2 py-3 font-display font-bold disabled:opacity-40 ${m3.fire ? "border-warn bg-warn text-ink" : "border-warn text-warn"}`}
        >
          {m3.fire ? "■ หยุดฉายรังสี" : "● ฉายรังสี"}
        </button>
        <button
          onClick={() => set({ flip: !m3.flip })}
          disabled={busy || !m3.on}
          className={`rounded-xl border-2 py-3 font-display font-bold disabled:opacity-40 ${m3.flip ? "border-amber text-amber" : "border-line"}`}
        >
          {m3.flip ? "หลอดอยู่เหนือเตียง" : "หลอดอยู่ใต้เตียง"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => set({ part: null })} disabled={busy || !m3.on} className={`${btn} ${m3.part === null ? "border-amber text-amber" : "border-line"}`}>
          ภาพรวม
        </button>
        {M3_PARTS.map((p) => (
          <button
            key={p.id}
            onClick={() => set({ part: m3.part === p.id ? null : p.id })}
            disabled={busy || !m3.on}
            className={`${btn} ${m3.part === p.id ? "border-amber text-amber" : "border-line"}`}
          >
            <span className="mr-1 font-mono">{p.n}</span>
            {p.name}
          </button>
        ))}
      </div>
      <p className="text-xs text-mist">เฉลยแล้วกดแสดงบนจอหลัก ฉายรังสีให้เห็นว่ารังสีกระเจิงออกจากตัวผู้ป่วย แล้วกลับด้านหลอดให้เห็นรังสีพุ่งไปที่ศีรษะของทีม</p>
    </section>
  );
}
