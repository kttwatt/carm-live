// Animated diagram for "การเดินทางของรังสี": a C-arm seen from the patient's feet turns through AP, lateral
// and inverted (keyframes `rj-*` in globals.css). At each position it fires one exposure in four steps, which
// line up with the page's four points; LecturePage lights those up on the same clock.
// With reduced motion every animation is off and the diagram rests at AP with everything shown.

/** Seconds per position: about 1 s to turn, then one exposure. The point cards loop on this. */
export const JOURNEY_SHOT = 8;
const TURN = JOURNEY_SHOT * 3;

const shot = (name: string) => ({ animation: `${name} ${JOURNEY_SHOT}s linear infinite` });
const turn = (name: string) => ({ animation: `${name} ${TURN}s linear infinite` });
const flow = { animation: "rj-flow 0.6s linear infinite" };

// The C turns about the patient's centre.
const CX = 220;
const CY = 230;

// Drawn as AP (tube under the table, beam going up); the group rotates for the other positions.
const RAYS = [-48, -24, 0, 24, 48].map((dx) => ({ x1: CX + dx * 0.25, x2: CX + dx }));

// Scatter leaves the patient all round, most of it back toward the tube (down, at AP).
const SCATTER = [
  { a: 35, len: 78 },
  { a: 60, len: 70 },
  { a: 120, len: 70 },
  { a: 145, len: 78 },
  { a: 0, len: 52 },
  { a: 180, len: 52 },
  { a: -40, len: 32 },
  { a: -140, len: 32 },
].map(({ a, len }) => {
  const r = (a * Math.PI) / 180;
  const at = (d: number) => ({ x: CX + Math.cos(r) * d, y: CY + Math.sin(r) * d });
  return { a, from: at(80), to: at(80 + len) };
});

const POSITIONS = [
  { name: "AP View", where: "หลอดเอกซเรย์อยู่ใต้เตียงผ่าตัด ตัวรับภาพอยู่ด้านบน", verdict: "แนะนำ: รังสีกระเจิงลงด้านล่าง", color: "#5cc46f" },
  { name: "Lateral", where: "หลอดเอกซเรย์อยู่ด้านซ้าย ตัวรับภาพอยู่ด้านขวา", verdict: "ควรยืนฝั่งตัวรับภาพ ไม่ยืนฝั่งหลอด", color: "#f2b233" },
  { name: "Invert", where: "หลอดเอกซเรย์อยู่ด้านบน ตัวรับภาพอยู่ใต้โต๊ะ", verdict: "หลีกเลี่ยง: รังสีกระเจิงขึ้นใบหน้าและดวงตา", color: "#f08a5d" },
];

// A nurse standing left of the table (the side the tube swings to at lateral). While the scatter of each position
// plays, the nurse clutches the part that takes the most of it, drawn orange: legs at AP (scatter goes down),
// the trunk at lateral (the tube is on the nurse's side), the face at invert (scatter goes up).
const NX = -50; // the nurse's centre line
const SKIN_TONE = "#e8c4a0";
const SCRUBS = "#4f9da6";
const PANTS = "#2f5b78";
const SLEEVES = "#2f7880"; // darker than the top, so the arms read against it
const HURT = "#f08a5d";

function Nurse({ hurt }: { hurt?: "legs" | "trunk" | "head" }) {
  const c = (part: "legs" | "trunk" | "head", base: string) => (hurt === part ? HURT : base);
  // a few short strokes beside the part that hurts
  const ouch = (x: number, y: number) => (
    <g stroke={HURT} strokeWidth="3" strokeLinecap="round">
      <line x1={x} y1={y - 12} x2={x + 6} y2={y - 20} />
      <line x1={x + 4} y1={y} x2={x + 14} y2={y} />
      <line x1={x} y1={y + 12} x2={x + 6} y2={y + 20} />
    </g>
  );
  const legs = (
    <g stroke={c("legs", PANTS)} strokeWidth="12" strokeLinecap="round">
      <line x1={NX - 8} y1="296" x2={NX - 10} y2="386" />
      <line x1={NX + 8} y1="296" x2={NX + 10} y2="386" />
    </g>
  );
  if (hurt === "legs")
    // bent over at the hips, hands on the knees
    return (
      <g>
        {legs}
        <g transform={`rotate(28 ${NX} 298)`}>
          <rect x={NX - 17} y="214" width="34" height="84" rx="12" fill={SCRUBS} />
          <circle cx={NX} cy="196" r="15" fill={SKIN_TONE} />
        </g>
        <g stroke={SLEEVES} strokeWidth="9" strokeLinecap="round">
          <line x1={NX + 22} y1="228" x2={NX - 6} y2="338" />
          <line x1={NX + 46} y1="240" x2={NX + 12} y2="340" />
        </g>
        {ouch(NX + 20, 352)}
      </g>
    );
  if (hurt === "trunk")
    // leaning back from the table, arms wrapped round the middle
    return (
      <g transform={`rotate(-10 ${NX} 386)`}>
        {legs}
        <rect x={NX - 17} y="214" width="34" height="84" rx="12" fill={HURT} />
        <circle cx={NX} cy="196" r="15" fill={SKIN_TONE} />
        <g stroke={SLEEVES} strokeWidth="9" strokeLinecap="round">
          <line x1={NX - 14} y1="226" x2={NX + 10} y2="262" />
          <line x1={NX + 14} y1="226" x2={NX - 10} y2="266" />
        </g>
        {ouch(NX + 26, 250)}
      </g>
    );
  if (hurt === "head")
    // hunched, hands over the face
    return (
      <g transform={`rotate(8 ${NX} 386)`}>
        {legs}
        <rect x={NX - 17} y="214" width="34" height="84" rx="12" fill={SCRUBS} />
        <circle cx={NX} cy="196" r="15" fill={HURT} />
        <g stroke={SLEEVES} strokeWidth="9" strokeLinecap="round">
          <line x1={NX - 14} y1="226" x2={NX - 4} y2="198" />
          <line x1={NX + 14} y1="226" x2={NX + 6} y2="200" />
        </g>
        <circle cx={NX - 3} cy="196" r="5" fill={SKIN_TONE} />
        <circle cx={NX + 6} cy="198" r="5" fill={SKIN_TONE} />
        {ouch(NX + 22, 186)}
      </g>
    );
  return (
    <g>
      {legs}
      <rect x={NX - 17} y="214" width="34" height="84" rx="12" fill={SCRUBS} />
      <circle cx={NX} cy="196" r="15" fill={SKIN_TONE} />
      <g stroke={SLEEVES} strokeWidth="9" strokeLinecap="round">
        <line x1={NX - 14} y1="224" x2={NX - 20} y2="290" />
        <line x1={NX + 14} y1="224" x2={NX + 20} y2="290" />
      </g>
    </g>
  );
}

// Entrance skin, facing the tube at each position (patient ellipse rx 80, ry 62).
const SKIN = ["M170 282 Q220 310 270 282", "M159 190 Q121 230 159 270", "M170 178 Q220 150 270 178"];

export function RadiationJourney({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="-100 0 540 460"
      role="img"
      aria-label="เครื่อง C-arm หมุนท่า AP, Lateral และ Invert รังสีเอกซ์จากหลอดเข้าสู่ผู้ป่วย กระเจิงออกทางฝั่งหลอดมากที่สุด และส่วนน้อยทะลุถึงตัวรับภาพ พยาบาลที่ยืนข้างเตียงเจ็บที่ขาในท่า AP ที่ลำตัวในท่า Lateral และที่ใบหน้าในท่า Invert"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="rj-cone" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f2b233" stopOpacity="0.6" />
          <stop offset="1" stopColor="#f2b233" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="rj-hot">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#f2b233" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f2b233" stopOpacity="0" />
        </radialGradient>
        <marker id="rj-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#f08a5d" />
        </marker>
      </defs>

      {/* legend */}
      <g fontSize="12" fontWeight="600">
        <rect x="12" y="12" width="14" height="10" rx="2" fill="#132c5c" stroke="#bccce6" />
        <text x="32" y="21" fill="#f3f6f8">X-ray tube</text>
        <rect x="12" y="30" width="14" height="6" rx="1" fill="#5cc3e6" />
        <text x="32" y="37" fill="#5cc3e6">ตัวรับภาพ</text>
        <line x1="12" y1="50" x2="26" y2="50" stroke="#f2b233" strokeWidth="3" />
        <text x="32" y="54" fill="#f2b233">Primary beam</text>
        <line x1="12" y1="66" x2="26" y2="66" stroke="#f08a5d" strokeWidth="3" strokeDasharray="4 3" />
        <text x="32" y="70" fill="#f08a5d">Scatter</text>
      </g>

      {/* monitor */}
      <rect x="356" y="12" width="72" height="48" rx="5" fill="#0b1f45" stroke="#bccce6" strokeWidth="2" />
      <g style={shot("rj-image")}>
        <ellipse cx="392" cy="36" rx="24" ry="14" fill="#bccce6" opacity="0.55" />
        <circle cx="395" cy="39" r="7" fill="#f3f6f8" />
      </g>
      <text x="392" y="76" fill="#bccce6" fontSize="12" textAnchor="middle">จอภาพ</text>

      {/* the C-arm with tube, detector and the exposure, turning about the patient */}
      <g style={{ ...turn("rj-turn"), transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box" }}>
        <path d={`M${CX} ${CY + 168} A168 168 0 0 0 ${CX} ${CY - 168} L${CX} ${CY - 118}`} fill="none" stroke="#46566a" strokeWidth="14" strokeLinejoin="round" />

        <polygon points={`${CX - 12},${CY + 132} ${CX + 12},${CY + 132} ${CX + 60},${CY + 56} ${CX - 60},${CY + 56}`} fill="url(#rj-cone)" style={shot("rj-beam")} />
        <g stroke="#ffd36b" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 13" style={shot("rj-rays")}>
          {RAYS.map((r) => (
            <line key={r.x1} x1={r.x1} y1={CY + 130} x2={r.x2} y2={CY + 58} style={flow} />
          ))}
        </g>

        <g stroke="#f08a5d" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 7" fill="none" style={shot("rj-scatter")}>
          {SCATTER.map((s) => (
            <line key={s.a} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} markerEnd="url(#rj-arrow)" style={flow} />
          ))}
        </g>

        <g stroke="#5cc3e6" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 12" style={shot("rj-through")}>
          {[-24, 0, 24].map((dx) => (
            <line key={dx} x1={CX + dx} y1={CY - 64} x2={CX + dx} y2={CY - 100} style={flow} />
          ))}
        </g>

        {/* tube: filament, electrons, glowing target */}
        <rect x={CX - 40} y={CY + 132} width="80" height="36" rx="8" fill="#132c5c" stroke="#bccce6" strokeWidth="2" />
        <rect x={CX - 30} y={CY + 144} width="10" height="14" rx="2" fill="#bccce6" />
        <polygon points={`${CX + 18},${CY + 140} ${CX + 30},${CY + 140} ${CX + 30},${CY + 160} ${CX + 12},${CY + 160}`} fill="#bccce6" />
        <circle cx={CX + 18} cy={CY + 142} r="16" fill="url(#rj-hot)" style={shot("rj-tube")} />
        <line x1={CX - 18} y1={CY + 151} x2={CX + 12} y2={CY + 149} stroke="#5cc3e6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 8" style={{ ...shot("rj-electrons"), ...flow }} />

        {/* detector */}
        <rect x={CX - 62} y={CY - 118} width="124" height="16" rx="3" fill="#132c5c" stroke="#5cc3e6" strokeWidth="2" />
        <rect x={CX - 62} y={CY - 118} width="124" height="16" rx="3" fill="#5cc3e6" style={shot("rj-image")} />
      </g>

      {/* patient on the table, which stay put */}
      <rect x="110" y="294" width="220" height="10" rx="2" fill="#46566a" />
      <ellipse cx={CX} cy={CY} rx="80" ry="62" fill="#e6ecf3" stroke="#bccce6" strokeWidth="2" />
      <circle cx={CX + 8} cy={CY + 10} r="26" fill="none" stroke="#46566a" strokeWidth="2.5" />
      {SKIN.map((d, i) => (
        <path key={d} d={d} fill="none" stroke="#f08a5d" strokeWidth="7" strokeLinecap="round" opacity={i ? 0 : 1} style={turn(`rj-skin-${i + 1}`)} />
      ))}

      {/* the nurse beside the table: standing, then hurt where this position's scatter lands */}
      <g style={turn("rj-calm")}>
        <Nurse />
      </g>
      {(["legs", "trunk", "head"] as const).map((part, i) => (
        <g key={part} opacity="0" style={turn(`rj-hurt-${i + 1}`)}>
          <Nurse hurt={part} />
        </g>
      ))}
      <text x={NX} y="408" fill="#bccce6" fontSize="13" fontWeight="600" textAnchor="middle">
        พยาบาล
      </text>

      {/* which position is playing */}
      {POSITIONS.map((p, i) => (
        <g key={p.name} opacity={i ? 0 : 1} style={turn(`rj-pos-${i + 1}`)}>
          <text x="12" y="432" fill="#f3f6f8" fontSize="17" fontWeight="700">
            {p.name}
            <tspan fill="#bccce6" fontSize="13" fontWeight="600" dx="8">
              {p.where}
            </tspan>
          </text>
          <text x="12" y="452" fill={p.color} fontSize="13" fontWeight="700">
            {p.verdict}
          </text>
        </g>
      ))}
    </svg>
  );
}
