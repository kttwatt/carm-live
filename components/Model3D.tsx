"use client";

import { useCallback, useEffect, useRef } from "react";
import { asset } from "@/lib/room";
import { useBeep } from "@/lib/beep";
import type { Sim } from "@/lib/state";

export type M3 = NonNullable<Sim["m3"]>;
export const DEFAULT_M3: M3 = { on: false, part: null, fire: false, flip: false, spin: false, lat: false };

export const M3_PARTS = [
  { id: "tube", n: 1, name: "หลอดเอกซเรย์" },
  { id: "collimator", n: 2, name: "ตัวจำกัดลำรังสี" },
  { id: "detector", n: 3, name: "ตัวรับภาพ" },
  { id: "carm", n: 4, name: "C Arm" },
  { id: "base", n: 5, name: "ฐานเครื่อง" },
  { id: "monitor", n: 6, name: "จอแสดงผล" },
  { id: "switch", n: 7, name: "Switch" },
];

/**
 * The 3D page in a frame, kept in step with the presenter's settings. `lite` is the light phone version.
 * On the projector (not lite, not `muted`) it beeps while the beam is on, like the real machine.
 */
export function Model3DStage({ m3, lite, muted }: { m3: M3; lite?: boolean; muted?: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useBeep(m3.fire && !lite && !muted);
  const send = useCallback(() => {
    const msg = { type: "carm3d", part: m3.part, fire: m3.fire, flip: m3.flip, spin: !!m3.spin, lat: !!m3.lat };
    ref.current?.contentWindow?.postMessage(msg, window.location.origin);
  }, [m3.part, m3.fire, m3.flip, m3.spin, m3.lat]);
  useEffect(send, [send]);
  const frame = (
    <iframe
      ref={ref}
      src={asset(`/carm-3d.html?embed=1&${lite ? "lite=1" : "motion=1"}&v=${process.env.MODEL_BUILD}`)}
      title="แบบจำลองสามมิติของเครื่อง C-Arm"
      onLoad={send}
      className="absolute inset-0 h-full w-full border-0"
    />
  );
  if (lite)
    return (
      <section aria-label="แบบจำลองสามมิติบนจอหลัก" className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-amber">แบบจำลองบนจอหลัก · ลากเพื่อหมุนดูเองได้</p>
        <div className="relative h-[68svh] overflow-hidden rounded-2xl border border-line">{frame}</div>
      </section>
    );
  return <main className="relative flex-1">{frame}</main>;
}

/** Control page: show/hide the model and drive it from the iPad. */
export function Model3DControls({ sim, onChange, busy }: { sim: Sim; onChange: (s: Sim) => void; busy: boolean }) {
  const m3 = sim.m3 ?? DEFAULT_M3;
  const set = (patch: Partial<M3>) => onChange({ ...sim, m3: { ...m3, ...patch } });
  const btn = "rounded-lg border px-3 py-2 text-sm disabled:opacity-40";
  // Folded to one button while the model is off; the controls rise in once it is on the main screen.
  if (!m3.on)
    return (
      <button
        onClick={() => set({ on: true })}
        disabled={busy}
        className="flex w-fit items-center gap-2 rounded-xl border-2 border-sky px-5 py-2.5 font-display font-bold text-sky disabled:opacity-40"
      >
        <span aria-hidden>▸</span> C-Arm 3D
      </button>
    );
  return (
    <section className="flex animate-[rise_0.35s_ease-out] flex-col gap-3 rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-semibold">แบบจำลองสามมิติของเครื่อง C-Arm</p>
        <button
          onClick={() => set({ on: !m3.on })}
          disabled={busy}
          className={`ml-auto rounded-xl border-2 px-4 py-2 font-display font-bold disabled:opacity-40 ${m3.on ? "border-warn text-warn" : "border-sky text-sky"}`}
        >
          {m3.on ? "ซ่อนจากจอหลักและมือถือ" : "แสดงบนจอหลักและมือถือ"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-mist">ท่าถ่าย</span>
        <div className="flex overflow-hidden rounded-xl border-2 border-sky" role="group" aria-label="ท่าถ่าย">
          {([
            [false, "AP"],
            [true, "LAT"],
          ] as const).map(([lat, label]) => (
            <button
              key={label}
              onClick={() => set({ lat })}
              disabled={busy || !m3.on}
              aria-pressed={!!m3.lat === lat}
              className={`px-5 py-2 font-display font-bold disabled:opacity-40 ${!!m3.lat === lat ? "bg-sky text-ink" : "text-sky"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
          aria-pressed={m3.flip}
          className={`rounded-xl border-2 py-3 font-display font-bold disabled:opacity-40 ${m3.flip ? "border-amber bg-amber text-ink" : "border-amber text-amber"}`}
        >
          Invert
        </button>
        <button
          onClick={() => set({ spin: !m3.spin })}
          disabled={busy || !m3.on}
          aria-pressed={!!m3.spin}
          className={`rounded-xl border-2 py-3 font-display font-bold disabled:opacity-40 ${m3.spin ? "border-sky bg-sky text-ink" : "border-sky text-sky"}`}
        >
          {m3.spin ? "■ หยุดหมุน" : "⟳ หมุนรอบ"}
        </button>
        <button
          onClick={() => set({ part: null })}
          disabled={busy || !m3.on}
          className={`rounded-xl border-2 py-3 font-display font-bold disabled:opacity-40 ${m3.part === null ? "border-paper bg-paper text-ink" : "border-line"}`}
        >
          ภาพรวม
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
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
      <p className="text-xs text-mist">ใช้ได้ทุกฉาก แบบจำลองจะแสดงแทนฉากบนจอหลัก และขึ้นบนมือถือผู้เข้าร่วมแบบเบา (หมุนดูเองได้) จนกว่าจะกดซ่อน เลือกชิ้นส่วนแล้วจอหลักจะซูมเข้าไปและขึ้นคำอธิบายกลางจอ กด Invert ให้เห็นรังสีพุ่งไปที่ศีรษะของทีมเมื่อX-ray tube อยู่เหนือเตียง</p>
    </section>
  );
}
