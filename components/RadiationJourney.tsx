// Animated diagram for "การเดินทางของรังสี": one 12 s loop in four steps (keyframes `rj-*` in globals.css).
// The steps line up with the page's four points, which LecturePage lights up on the same clock.
// With reduced motion every animation is off and the whole diagram shows at once.

/** Seconds per loop; LecturePage starts each point card one step (22% of this) after the last. */
export const JOURNEY_LOOP = 12;

const anim = (name: string, extra = "") => ({ animation: `${name} ${JOURNEY_LOOP}s linear infinite${extra}` });
const flow = { animation: "rj-flow 0.6s linear infinite" };

// Primary beam rays: from the tube window down to the patient's skin.
const RAYS = [-62, -31, 0, 31, 62].map((dx) => ({ x1: 200 + dx * 0.15, x2: 200 + dx * 1.15 }));

// Scatter leaves the patient in every direction, more of it back toward the tube.
const SCATTER: { x: number; y: number; a: number; len: number }[] = [
  { x: 130, y: 238, a: -150, len: 62 },
  { x: 160, y: 226, a: -120, len: 70 },
  { x: 240, y: 226, a: -60, len: 70 },
  { x: 270, y: 238, a: -30, len: 62 },
  { x: 98, y: 268, a: 180, len: 52 },
  { x: 302, y: 268, a: 0, len: 52 },
  { x: 112, y: 296, a: 150, len: 40 },
  { x: 288, y: 296, a: 30, len: 40 },
];

export function RadiationJourney({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 400 430"
      role="img"
      aria-label="รังสีเอกซ์จาก X-ray tube เข้าสู่ผู้ป่วย กระเจิงออกรอบตัวผู้ป่วย และส่วนน้อยทะลุถึงตัวรับภาพ"
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id="rj-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2b233" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f2b233" stopOpacity="0.12" />
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

      {/* beam cone, on from the end of step 1 until the image is made */}
      <polygon points="190,72 210,72 272,232 128,232" fill="url(#rj-cone)" style={anim("rj-beam")} />

      {/* 2 · photons travelling down the primary beam */}
      <g stroke="#ffd36b" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="7 13" style={anim("rj-rays")}>
        {RAYS.map((r) => (
          <line key={r.x1} x1={r.x1} y1={74} x2={r.x2} y2={230} style={flow} />
        ))}
      </g>

      {/* 3 · scatter out of the patient */}
      <g stroke="#f08a5d" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="6 7" fill="none" style={anim("rj-scatter")}>
        {SCATTER.map((s) => {
          const r = (s.a * Math.PI) / 180;
          return (
            <line
              key={`${s.x}-${s.y}`}
              x1={s.x}
              y1={s.y}
              x2={s.x + Math.cos(r) * s.len}
              y2={s.y + Math.sin(r) * s.len}
              markerEnd="url(#rj-arrow)"
              style={flow}
            />
          );
        })}
      </g>

      {/* 4 · the little that gets through, down to the image receptor */}
      <g stroke="#5cc3e6" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 12" style={anim("rj-through")}>
        {[176, 200, 224].map((x) => (
          <line key={x} x1={x} y1={318} x2={x} y2={366} style={flow} />
        ))}
      </g>

      {/* X-ray tube with cathode and anode */}
      <rect x="120" y="14" width="160" height="58" rx="10" fill="#132c5c" stroke="#bccce6" strokeWidth="2" />
      <rect x="140" y="32" width="14" height="22" rx="3" fill="#bccce6" />
      <polygon points="246,28 262,28 262,58 236,58" fill="#bccce6" />
      <circle cx="243" cy="52" r="20" fill="url(#rj-hot)" style={anim("rj-tube")} />
      {/* 1 · electrons from the hot filament to the target */}
      <line x1="158" y1="43" x2="238" y2="47" stroke="#5cc3e6" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 10" style={{ ...anim("rj-electrons"), ...flow }} />


      {/* patient on the table */}
      <ellipse cx="200" cy="270" rx="104" ry="48" fill="#e6ecf3" stroke="#bccce6" strokeWidth="2" />
      <circle cx="210" cy="284" r="30" fill="none" stroke="#46566a" strokeWidth="2.5" />
      {/* 2 · entrance skin takes the most dose */}
      <path d="M134 236 Q200 206 266 236" fill="none" stroke="#f08a5d" strokeWidth="7" strokeLinecap="round" style={anim("rj-skin")} />
      <rect x="70" y="320" width="260" height="10" rx="2" fill="#46566a" />

      {/* image receptor and monitor */}
      <rect x="130" y="368" width="140" height="16" rx="3" fill="#132c5c" stroke="#5cc3e6" strokeWidth="2" />
      <rect x="130" y="368" width="140" height="16" rx="3" fill="#5cc3e6" style={anim("rj-image")} />
      <rect x="306" y="352" width="76" height="52" rx="5" fill="#0b1f45" stroke="#bccce6" strokeWidth="2" />
      <line x1="344" y1="404" x2="344" y2="416" stroke="#bccce6" strokeWidth="3" />
      <g style={anim("rj-image")}>
        <ellipse cx="344" cy="378" rx="26" ry="15" fill="#bccce6" opacity="0.55" />
        <circle cx="347" cy="381" r="8" fill="#f3f6f8" />
      </g>

      {/* labels */}
      <g fill="#f3f6f8" fontSize="14" fontWeight="600">
        <text x="290" y="40">X-ray tube</text>
        <text x="16" y="150" fill="#f2b233">Primary beam</text>
        <text x="300" y="190" fill="#f08a5d">Scatter</text>
        <text x="72" y="348">ผู้ป่วย</text>
        <text x="130" y="402" fill="#5cc3e6">ตัวรับภาพ</text>
        <text x="314" y="428" fill="#bccce6" fontSize="12">จอภาพ</text>
      </g>
    </svg>
  );
}
