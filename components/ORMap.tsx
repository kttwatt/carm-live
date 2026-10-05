"use client";

import { useEffect, useRef } from "react";
import { ISO, ROOM, SPOTS, STAFF, formatIndex, heatImage, intensity, source, type Geometry, type Pt } from "@/lib/sim/model";

type Props = {
  geometry: Geometry;
  /** spot the viewer picked */
  selected?: string | null;
  onPick?: (spot: string) => void;
  /** show the scatter field and an index at each spot */
  reveal?: boolean;
  /** spots to mark as the answer once revealed */
  correct?: string[];
  /** how many people picked each spot */
  counts?: Record<string, number> | null;
  className?: string;
  style?: React.CSSProperties;
  /** demo mode: fluoroscopy on shows the field instantly and an index on every person; off hides it instantly */
  fluoro?: boolean;
  /** demo mode: tapping the floor reports the point (used to place the lead shield) */
  onFloorTap?: (p: Pt) => void;
};

// The drawn window: the floor around the table where people stand (cropped so it reads well on a phone).
const VIEW = { x: -225, y: -235, w: 455, h: 465 };

/** Top-view operating room: table and patient in the middle, C-arm, staff, and standing spots A–F. */
export function ORMap({ geometry, selected, onPick, reveal, correct = [], counts, className, style, fluoro, onFloorTap }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const demo = fluoro !== undefined;
  const lit = !!reveal || !!fluoro;

  function floorTap(e: React.MouseEvent<SVGSVGElement>) {
    if (!onFloorTap || !svgRef.current) return;
    const m = svgRef.current.getScreenCTM();
    if (!m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    onFloorTap({ x: Math.round(pt.x), y: Math.round(pt.y) });
  }
  const so = source(geometry);
  const { proj, apTube } = geometry;

  useEffect(() => {
    const c = canvas.current;
    if (!c || !lit) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const off = document.createElement("canvas");
    off.width = 150;
    off.height = 125;
    off.getContext("2d")!.putImageData(heatImage(geometry), 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = true;
    // heatImage covers the whole room at 4 cm per pixel; draw only the visible window.
    ctx.drawImage(off, (VIEW.x - ROOM.x0) / 4, (VIEW.y - ROOM.y0) / 4, VIEW.w / 4, VIEW.h / 4, 0, 0, c.width, c.height);
  }, [geometry, lit]);

  const s = so.s;
  const tubeY = s * 84;
  const detY = -s * 62;

  return (
    <div className={`flex max-w-full flex-col gap-1 ${style?.width ? "" : "w-full"} ${className ?? ""}`} style={style}>
    <div style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }} className="relative w-full overflow-hidden rounded-2xl border border-line bg-[#132235]">
      <canvas
        ref={canvas}
        width={VIEW.w}
        height={VIEW.h}
        aria-hidden
        className={`absolute inset-0 h-full w-full ${demo ? "" : "transition-opacity duration-300"}`}
        style={{ opacity: lit ? 1 : 0 }}
      />
      <svg
        ref={svgRef}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        className={`absolute inset-0 h-full w-full ${onFloorTap ? "cursor-crosshair" : ""}`}
        role="img"
        aria-label="ผังห้องผ่าตัดมองจากด้านบน"
        onClick={floorTap}
      >
        {Array.from({ length: 11 }, (_, i) => -250 + i * 50).map((x) => (
          <line key={`x${x}`} x1={x} y1={-250} x2={x} y2={250} stroke="#ffffff" strokeOpacity={0.05} />
        ))}
        {Array.from({ length: 9 }, (_, i) => -200 + i * 50).map((y) => (
          <line key={`y${y}`} x1={-300} y1={y} x2={300} y2={y} stroke="#ffffff" strokeOpacity={0.05} />
        ))}
        {[100, 200].map((r) => (
          <g key={r}>
            <circle cx={so.src.x} cy={so.src.y} r={r} fill="none" stroke="#bfd0de" strokeOpacity={0.45} strokeDasharray="4 6" />
            <text x={so.src.x + r * 0.72 + 4} y={so.src.y - r * 0.72 - 4} fontSize={13} fill="#bfd0de">
              {r / 100} ม.
            </text>
          </g>
        ))}
        <text x={-130} y={-218} textAnchor="middle" fontSize={15} fontWeight={600} fill="#bfd0de">
          ฝั่งศัลยแพทย์
        </text>
        <text x={-140} y={222} textAnchor="middle" fontSize={15} fontWeight={600} fill="#bfd0de">
          ฝั่งตรงข้าม
        </text>

        {/* table and patient */}
        <rect x={-110} y={-32} width={220} height={64} rx={6} fill="#3a4f63" />
        <g fill="#b9a38f">
          <circle cx={-93} cy={0} r={13} />
          <rect x={-78} y={-21} width={98} height={42} rx={16} />
          <rect x={14} y={-17} width={88} height={14} rx={6} />
          <rect x={14} y={3} width={88} height={14} rx={6} />
        </g>
        <text x={-30} y={5} textAnchor="middle" fontSize={12.5} fill="#132235">
          ผู้ป่วย
        </text>

        {/* C-arm */}
        <rect x={5} y={140} width={60} height={46} rx={6} fill="#6b7d8f" opacity={0.7} />
        <text x={35} y={205} textAnchor="middle" fontSize={12.5} fill="#bfd0de">
          ฐานเครื่อง C-arm
        </text>
        {proj === "AP" ? (
          <>
            <line x1={35} y1={140} x2={35} y2={34} stroke="#6b7d8f" strokeWidth={12} strokeLinecap="round" opacity={0.6} />
            <rect x={ISO.x - 18} y={-18} width={36} height={36} rx={3} fill="#7f9bff" opacity={lit ? 0.6 : 0.25} className={fluoro ? "animate-pulse" : undefined} />
            <rect x={ISO.x - 24} y={-24} width={48} height={48} rx={4} fill={apTube === "under" ? "#f3f6f8" : "none"} fillOpacity={0.55} stroke="#f3f6f8" strokeWidth={2} strokeDasharray={apTube === "under" ? undefined : "4 4"} />
            <circle cx={ISO.x} cy={0} r={16} fill={apTube === "over" ? "#f3f6f8" : "none"} fillOpacity={0.7} stroke="#f3f6f8" strokeWidth={2} strokeDasharray={apTube === "over" ? undefined : "4 4"} />
            <text x={ISO.x + 30} y={-30} fontSize={12.5} fill="#f3f6f8">
              {apTube === "under" ? "หลอดเอกซเรย์ใต้เตียง" : "หลอดเอกซเรย์เหนือเตียง"}
            </text>
          </>
        ) : (
          <>
            <line x1={ISO.x} y1={tubeY} x2={ISO.x} y2={detY} stroke="#6b7d8f" strokeWidth={12} strokeLinecap="round" opacity={0.6} />
            {s > 0 ? (
              <line x1={35} y1={140} x2={35} y2={tubeY + 14} stroke="#6b7d8f" strokeWidth={12} strokeLinecap="round" opacity={0.6} />
            ) : (
              <path d={`M35 140 C 150 140 150 ${tubeY} ${ISO.x + 20} ${tubeY}`} stroke="#6b7d8f" strokeWidth={12} fill="none" opacity={0.6} />
            )}
            <polygon
              points={`${ISO.x - 9},${tubeY} ${ISO.x + 9},${tubeY} ${ISO.x + 16},${detY} ${ISO.x - 16},${detY}`}
              fill="#7f9bff"
              opacity={lit ? 0.6 : 0.25} className={fluoro ? "animate-pulse" : undefined}
            />
            {/* labels sit inside the devices: the space around them is crowded with staff and spots */}
            <rect x={ISO.x - 34} y={tubeY - 13} width={68} height={26} rx={4} fill="#f2b233" stroke="#0e1a2b" strokeWidth={2} />
            <text x={ISO.x} y={tubeY + 4.5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#12202e">
              หลอดเอกซเรย์
            </text>
            <rect x={ISO.x - 34} y={detY - 10} width={68} height={20} rx={3} fill="#f3f6f8" stroke="#0e1a2b" strokeWidth={2} />
            <text x={ISO.x} y={detY + 4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="#12202e">
              แผ่นรับภาพ
            </text>
          </>
        )}
        {so.shieldSeg && (
          <g>
            <line x1={so.shieldSeg.a.x} y1={so.shieldSeg.a.y} x2={so.shieldSeg.b.x} y2={so.shieldSeg.b.y} stroke="#a3b1ba" strokeWidth={9} strokeLinecap="round" />
            <text x={geometry.shield!.x} y={geometry.shield!.y + 24} textAnchor="middle" fontSize={12} fill="#f3f6f8" paintOrder="stroke" stroke="#0e1a2b" strokeWidth={4}>
              ฉากกั้นตะกั่ว
            </text>
          </g>
        )}

        {/* staff */}
        {STAFF.map((p) => (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r={12} fill="#16263b" stroke="#f3f6f8" strokeWidth={2} />
            <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize={11} fill="#f3f6f8">
              {p.name}
            </text>
            {fluoro && (
              <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize={13} fontWeight={700} fill="#f2b233" paintOrder="stroke" stroke="#0e1a2b" strokeWidth={4}>
                {formatIndex(intensity(p, so))}
              </text>
            )}
          </g>
        ))}

        {/* standing spots */}
        {Object.entries(SPOTS).map(([id, p]) => {
          const isSel = selected === id;
          const isRight = reveal && correct.includes(id);
          const n = counts?.[id];
          return (
            <g
              key={id}
              role={onPick ? "radio" : undefined}
              aria-checked={onPick ? isSel : undefined}
              aria-label={onPick ? `จุด ${id} ${p.label}` : undefined}
              tabIndex={onPick ? 0 : undefined}
              onClick={
                onPick
                  ? (e) => {
                      e.stopPropagation();
                      onPick(id);
                    }
                  : undefined
              }
              onKeyDown={onPick ? (e) => (e.key === "Enter" || e.key === " ") && onPick(id) : undefined}
              style={{ cursor: onPick ? "pointer" : undefined, outline: "none" }}
            >
              {/* generous invisible touch target */}
              <circle cx={p.x} cy={p.y} r={30} fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={isSel ? 22 : 19}
                fill={isSel ? "#f2b233" : "#0e1a2b"}
                fillOpacity={isSel ? 1 : 0.75}
                stroke={isRight ? "#5cc46f" : isSel ? "#f2b233" : "#bfd0de"}
                strokeWidth={isRight ? 5 : 2.5}
                strokeDasharray={isSel || isRight ? undefined : "4 3"}
              />
              <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize={18} fontWeight={700} fill={isSel ? "#12202e" : "#f3f6f8"}>
                {id}
              </text>
              {lit && (
                <text x={p.x} y={p.y + 40} textAnchor="middle" fontSize={13} fontWeight={600} fill="#f3f6f8" paintOrder="stroke" stroke="#0e1a2b" strokeWidth={4}>
                  ดัชนี {formatIndex(intensity(p, so))}
                </text>
              )}
              {n != null && (
                <text x={p.x} y={p.y - 28} textAnchor="middle" fontSize={14} fontWeight={700} fill="#f2b233" paintOrder="stroke" stroke="#0e1a2b" strokeWidth={4}>
                  {n} คน
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
      {lit && (
        <p className="text-xs leading-snug text-mist">
          ดัชนีรังสีกระเจิงสัมพัทธ์ต่อการฉาย 1 วินาที จากแบบจำลองเพื่อการเรียนรู้ ไม่ใช่ปริมาณรังสีจริง
        </p>
      )}
    </div>
  );
}
