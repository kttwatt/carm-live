import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { isTopic, pagesFor } from "@/lib/pages";
import { KIND_LABEL, SCENES, isInteractive } from "@/lib/scenes";
import { LecturePage } from "@/components/LecturePage";
import { SlideDeck } from "@/components/SlideDeck";

// Read-only copy of the lecture for phones, no room code needed: the same pages the main screen shows,
// one per frame, swiped left/right in deck order.
export const metadata: Metadata = { title: "เนื้อหาสไลด์ · C-Arm Radiation Safety" };

const COVER = SCENES.find((s) => s.kind === "cover");
const OUTLINE = SCENES.find((s) => s.kind === "outline");
const SLIDES = SCENES.filter((s) => s.slide != null);

// Frames in deck order. Units are cqw/cqh of the 16:9 frame, matching the main screen's vw/vh.
const frames: { id: string; node: ReactNode }[] = [];

if (COVER) {
  frames.push({
    id: COVER.id,
    node: (
      // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
      <img
        src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/cover.webp`}
        alt="การสัมมนา ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด แลกเปลี่ยนความรู้เรื่องรังสีที่ใช้ในห้องผ่าตัดกับการป้องกันรังสี"
        className="h-full w-full object-contain"
      />
    ),
  });
}

if (OUTLINE?.items) {
  frames.push({
    id: OUTLINE.id,
    node: (
      <main className="flex flex-1 flex-col justify-center gap-[4cqh] px-[8cqw] py-[7cqh]">
        <h1 className="font-display text-[4cqw] font-bold leading-tight">{OUTLINE.title}</h1>
        <ol className="flex flex-col gap-[2.2cqh]">
          {OUTLINE.items.map((item, i) => (
            <li key={item} className="flex items-baseline gap-[1.4cqw] text-[2.4cqw] leading-snug">
              <span className="w-[2.6cqw] shrink-0 text-right font-display font-bold tabular-nums text-amber">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </main>
    ),
  });
}

for (const s of SLIDES) {
  const pages = pagesFor(s.id);
  if (isInteractive(s.kind) || pages.length === 0) {
    frames.push({
      id: s.id,
      node: (
        <main className="relative flex flex-1 flex-col justify-center gap-[3cqh] px-[7cqw] py-[8cqh]">
          <h1 className="font-display text-[4.2cqw] font-bold leading-tight">{s.title}</h1>
          {isInteractive(s.kind) && s.activity && (
            <div className="mt-[2cqh] flex max-w-[60cqw] flex-col gap-[1cqh] rounded-3xl bg-amber p-[2.5cqw] text-ink">
              <p className="text-[1.3cqw] font-semibold tracking-wide">กิจกรรมบนมือถือ · {KIND_LABEL[s.kind]}</p>
              <p className="text-[2cqw] leading-snug">{s.activity}</p>
            </div>
          )}
        </main>
      ),
    });
    continue;
  }
  pages.forEach((p, n) => {
    frames.push({
      id: n === 0 ? s.id : `${s.id}-${n + 1}`,
      node: (
        <main
          className={`relative flex flex-1 flex-col gap-[3cqh] px-[7cqw] ${p.top ? "justify-start py-[6cqh]" : "justify-center py-[8cqh]"}`}
          style={p.top && p.topGap ? { paddingTop: `${p.topGap}cqh` } : undefined}
        >
          {!isTopic(p) && !p.noTitle && (
            <h1 className={`font-display text-[3cqw] font-bold leading-tight ${s.amber ? "text-amber" : ""}`} style={p.scale ? { zoom: p.scale } : undefined}>
              {s.title}
            </h1>
          )}
          <LecturePage page={p} index={n} total={pages.length} lite />
        </main>
      ),
    });
  });
}

export default function Slides() {
  return <SlideDeck ids={frames.map((f) => f.id)}>{frames.map((f) => <Fragment key={f.id}>{f.node}</Fragment>)}</SlideDeck>;
}
