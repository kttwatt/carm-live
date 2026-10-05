"use client";

import { useState } from "react";
import { ORMap } from "@/components/ORMap";
import { SideView } from "@/components/SideView";
import { STAFF, behindShield, formatIndex, intensity, onFloor, source, type Geometry } from "@/lib/sim/model";
import type { Sim } from "@/lib/state";

export const simGeometry = (sim: Sim): Geometry => ({ proj: sim.proj, apTube: sim.apTube, latTube: sim.latTube, shield: sim.shield });

export function FluoroChip({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 font-semibold ${
        on ? "bg-warn text-ink" : "border border-line text-mist"
      } ${className ?? ""}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${on ? "animate-pulse bg-ink" : "bg-mist"}`} aria-hidden />
      {on ? "กำลังฉายรังสี" : "หยุดฉาย"}
    </span>
  );
}

function setupText(sim: Sim) {
  if (sim.proj === "AP") return `ท่าหน้า-หลัง · หลอดเอกซเรย์${sim.apTube === "under" ? "ใต้" : "เหนือ"}เตียง`;
  return `ท่าด้านข้าง · หลอดเอกซเรย์อยู่${sim.latTube === "far" ? "ฝั่งตรงข้ามศัลยแพทย์" : "ฝั่งศัลยแพทย์"}`;
}

/** Projector view of the demo: the room on the left, the side view and who receives how much on the right. */
export function DemoStage({ sim }: { sim: Sim }) {
  const g = simGeometry(sim);
  const so = source(g);
  const staff = STAFF.map((p) => ({ ...p, v: intensity(p, so), shielded: behindShield(p, so) })).sort((a, b) => b.v - a.v);
  const top = Math.max(...staff.map((s) => s.v), 1);
  return (
    <div className="flex items-start gap-[2.5vw]">
      <ORMap geometry={g} fluoro={sim.fluoro} className="shrink-0" style={{ width: "min(70vh, 48vw)" }} />
      <div className="flex min-w-0 flex-1 flex-col gap-[2.2vh]">
        <FluoroChip on={sim.fluoro} className="text-[1.4vw]" />
        <p className="text-[1.6vw] font-semibold">{setupText(sim)}</p>
        <SideView geometry={g} fluoro={sim.fluoro} large />
        <div className="flex flex-col gap-[1vh]">
          <p className="text-[1.2vw] text-mist">ดัชนีรังสีกระเจิงสัมพัทธ์ต่อการฉาย 1 วินาที</p>
          {staff.map((s) => (
            <div key={s.name} className="flex items-center gap-[1vw] text-[1.3vw]">
              <span className="w-[13vw] shrink-0 truncate">{s.name}</span>
              <div className="h-[1.6vh] flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{ width: sim.fluoro ? `${Math.max(3, (s.v / top) * 100)}%` : "0%", background: "linear-gradient(90deg, #f2b233, #f08a5d)" }}
                />
              </div>
              <span className="w-[6vw] text-right tabular-nums">{sim.fluoro ? formatIndex(s.v) : "–"}</span>
            </div>
          ))}
          {sim.shield && <p className="text-[1.1vw] text-mist">ใครอยู่หลังฉากกั้นตะกั่ว รังสีกระเจิงลดเหลือราว 5% (ค่าสมมติเพื่อการสอน)</p>}
        </div>
        <p className="text-[1vw] text-mist">แบบจำลองเพื่อการเรียนรู้ ไม่ใช่ปริมาณรังสีจริง</p>
      </div>
    </div>
  );
}

/** Phone view: the same room, watch-only. */
export function DemoPhone({ sim }: { sim: Sim }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber">การสาธิตบนจอหลัก</p>
        <FluoroChip on={sim.fluoro} className="text-sm" />
      </div>
      <p className="text-sm">{setupText(sim)}</p>
      <ORMap geometry={simGeometry(sim)} fluoro={sim.fluoro} />
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange, disabled }: { value: T; options: Array<[T, string]>; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="flex w-fit flex-wrap overflow-hidden rounded-lg border border-line">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-sm disabled:opacity-40 ${value === v ? "bg-sea font-semibold text-white" : ""}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Presenter controls for the demo; every change goes straight to the projector and phones. */
export function DemoControls({ sim, onChange, busy }: { sim: Sim; onChange: (next: Sim) => void; busy: boolean }) {
  const [placing, setPlacing] = useState(false);
  const set = (patch: Partial<Sim>) => onChange({ ...sim, ...patch });
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">สาธิตรังสีกระเจิง</h2>
        <button
          type="button"
          disabled={busy}
          onClick={() => set({ show: !sim.show, fluoro: sim.show ? false : sim.fluoro })}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40 ${sim.show ? "bg-sky text-ink" : "border border-sky text-sky"}`}
        >
          {sim.show ? "กำลังแสดงบนจอ · ซ่อน" : "แสดงบนจอหลักและมือถือ"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Seg value={sim.proj} options={[["AP", "ท่าหน้า-หลัง"], ["LAT", "ท่าด้านข้าง"]]} onChange={(proj) => set({ proj })} disabled={busy} />
        {sim.proj === "AP" ? (
          <Seg value={sim.apTube} options={[["under", "หลอดใต้เตียง"], ["over", "หลอดเหนือเตียง"]]} onChange={(apTube) => set({ apTube })} disabled={busy} />
        ) : (
          <Seg value={sim.latTube} options={[["far", "หลอดฝั่งตรงข้าม"], ["near", "หลอดฝั่งศัลยแพทย์"]]} onChange={(latTube) => set({ latTube })} disabled={busy} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          disabled={busy}
          onClick={() => setPlacing((p) => !p)}
          className={`rounded-lg border px-3 py-1.5 disabled:opacity-40 ${placing ? "border-amber bg-amber text-ink" : "border-line"}`}
        >
          {placing ? "แตะพื้นห้องในผังเพื่อวางฉาก" : "วางฉากกั้นตะกั่ว"}
        </button>
        {sim.shield && (
          <button type="button" disabled={busy} onClick={() => set({ shield: null })} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40">
            เอาฉากออก
          </button>
        )}
      </div>

      <ORMap
        geometry={simGeometry(sim)}
        fluoro={sim.fluoro}
        className="max-w-md"
        onFloorTap={
          placing
            ? (p) => {
                setPlacing(false);
                set({ shield: onFloor(p) });
              }
            : undefined
        }
      />

      <button
        type="button"
        disabled={busy || !sim.show}
        onClick={() => set({ fluoro: !sim.fluoro })}
        aria-pressed={sim.fluoro}
        className={`rounded-xl border-2 py-4 font-display text-lg font-bold disabled:opacity-40 ${
          sim.fluoro ? "border-warn bg-warn text-ink" : "border-warn text-warn"
        }`}
      >
        {sim.fluoro ? "■ หยุดฉายรังสี" : "▶ เปิดฉายรังสี"}
      </button>
      {!sim.show && <p className="-mt-1 text-xs text-mist">กด "แสดงบนจอหลักและมือถือ" ก่อน จึงเปิดฉายรังสีได้</p>}
    </section>
  );
}
