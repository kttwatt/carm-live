import type { Geometry } from "@/lib/sim/model";

/** Scatter arcs fanning out from (cx, cy) towards `dir` degrees; thicker = more scatter. */
function Arcs({ cx, cy, dir, radii, width, opacity, on }: { cx: number; cy: number; dir: number; radii: number[]; width: number; opacity: number; on: boolean }) {
  return (
    <>
      {radii.map((r, i) => {
        const a0 = ((dir - 65) * Math.PI) / 180;
        const a1 = ((dir + 65) * Math.PI) / 180;
        return (
          <path
            key={r}
            d={`M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`}
            fill="none"
            stroke="#ff6a33"
            strokeLinecap="round"
            strokeWidth={width - i * 0.6}
            opacity={on ? opacity - i * 0.18 : 0.12}
          />
        );
      })}
    </>
  );
}

/**
 * The view the top-down map cannot give: AP seen from the side of the bed (tube under vs over the table,
 * against the team's eye level), or lateral seen from the foot of the bed (tube side vs detector side).
 */
export function SideView({ geometry, fluoro, large }: { geometry: Geometry; fluoro: boolean; large?: boolean }) {
  const svgCls = large ? "w-full max-h-[26vh]" : "w-full";
  const capCls = large ? "text-[1.15vw] leading-snug text-mist" : "text-sm leading-snug text-mist";
  const t = { fontSize: 11, fill: "#bfd0de" };
  if (geometry.proj === "AP") {
    const under = geometry.apTube === "under";
    const tubeY = under ? 96 : 14;
    const detY = under ? 22 : 96;
    return (
      <figure className="flex flex-col gap-1">
        <svg viewBox="0 0 320 140" className={svgCls} role="img" aria-label={`ภาพด้านข้าง ท่าหน้า-หลัง หลอดเอกซเรย์${under ? "ใต้" : "เหนือ"}เตียง`}>
          <line x1={0} y1={132} x2={320} y2={132} stroke="#2a3d55" strokeWidth={2} />
          <rect x={40} y={76} width={200} height={6} rx={2} fill="#3a4f63" />
          <rect x={135} y={82} width={10} height={50} fill="#3a4f63" />
          <ellipse cx={140} cy={67} rx={92} ry={10} fill="#b9a38f" />
          <polygon
            points={under ? "144,96 156,96 162,32 138,32" : "144,34 156,34 162,96 138,96"}
            fill="#7f9bff"
            opacity={fluoro ? 0.55 : 0.15}
          />
          <rect x={134} y={tubeY} width={32} height={20} rx={3} fill="#f2b233" stroke="#0e1a2b" />
          <rect x={124} y={detY} width={52} height={10} rx={2} fill="#f3f6f8" stroke="#0e1a2b" />
          <text x={172} y={tubeY + 14} {...t}>หลอดเอกซเรย์</text>
          <text x={182} y={detY + 9} {...t}>แผ่นรับภาพ</text>
          <Arcs cx={150} cy={under ? 78 : 57} dir={under ? 90 : -90} radii={[16, 28, 40]} width={3} opacity={0.9} on={fluoro} />
          <Arcs cx={150} cy={under ? 57 : 78} dir={under ? -90 : 90} radii={[12, 20]} width={1.6} opacity={0.45} on={fluoro} />
          <line x1={200} y1={24} x2={284} y2={24} stroke="#5cc3e6" strokeDasharray="3 3" strokeWidth={1.2} />
          <text x={222} y={19} {...t}>ระดับตาของทีม</text>
          <g stroke="#f3f6f8" strokeWidth={2} fill="none">
            <circle cx={292} cy={24} r={7} />
            <line x1={292} y1={31} x2={292} y2={96} />
            <line x1={292} y1={96} x2={284} y2={130} />
            <line x1={292} y1={96} x2={300} y2={130} />
          </g>
        </svg>
        <figcaption className={capCls}>
          {under
            ? "หลอดอยู่ใต้เตียง รังสีกระเจิงส่วนใหญ่ลงไปทางพื้นและขา ตาและคอของทีมได้รับน้อยกว่า"
            : "หลอดอยู่เหนือเตียง รังสีกระเจิงพุ่งขึ้นมาที่ระดับตาและคอของทีม"}
        </figcaption>
      </figure>
    );
  }
  const right = geometry.latTube === "far";
  return (
    <figure className="flex flex-col gap-1">
      <svg viewBox="0 0 320 140" className={svgCls} role="img" aria-label="ภาพจากปลายเตียง ท่าด้านข้าง">
        <line x1={0} y1={132} x2={320} y2={132} stroke="#2a3d55" strokeWidth={2} />
        <rect x={110} y={80} width={80} height={6} rx={2} fill="#3a4f63" />
        <rect x={145} y={86} width={10} height={46} fill="#3a4f63" />
        <ellipse cx={150} cy={67} rx={30} ry={13} fill="#b9a38f" />
        <polygon points={right ? "222,60 222,74 72,77 72,57" : "78,60 78,74 228,77 228,57"} fill="#7f9bff" opacity={fluoro ? 0.55 : 0.15} />
        <rect x={right ? 222 : 52} y={55} width={26} height={24} rx={3} fill="#f2b233" stroke="#0e1a2b" />
        <rect x={right ? 62 : 228} y={50} width={10} height={34} rx={2} fill="#f3f6f8" stroke="#0e1a2b" />
        <Arcs cx={right ? 181 : 119} cy={67} dir={right ? 0 : 180} radii={[16, 28, 40]} width={3} opacity={0.9} on={fluoro} />
        <Arcs cx={right ? 119 : 181} cy={67} dir={right ? 180 : 0} radii={[12, 20]} width={1.6} opacity={0.45} on={fluoro} />
        <text x={right ? 205 : 18} y={46} {...t}>หลอดเอกซเรย์</text>
        <text x={right ? 40 : 224} y={46} {...t}>แผ่นรับภาพ</text>
        <text x={16} y={126} {...t}>ฝั่งศัลยแพทย์</text>
        <text x={238} y={126} {...t}>ฝั่งตรงข้าม</text>
      </svg>
      <figcaption className={capCls}>
        ฝั่งหลอดเอกซเรย์ได้รังสีกระเจิงมากกว่าฝั่งแผ่นรับภาพราว 2–3 เท่า อย่าจำซ้ายหรือขวา ให้ดูว่าหลอดอยู่ฝั่งไหน
      </figcaption>
    </figure>
  );
}
