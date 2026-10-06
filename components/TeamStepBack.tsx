// Animated diagram for "ตำแหน่งที่ควรยืน: ทีมเข้าเคส": the operating table seen from above with the C-arm at lateral
// (tube below the table, detector above). The team (Surgeon, Assistant, Scrub) works at the table's edge on the
// detector side; before the beam fires they step back 1–2 paces and face the tube, and come back once it stops.
// One 8 s loop (keyframes `ts-*` in globals.css). Each element's resting style is the moment of exposure (team back,
// beam and scatter showing), which is what reduced motion leaves on a phone.

/** Seconds per loop. */
const LOOP = 8;
const play = (name: string) => ({ animation: `${name} ${LOOP}s ease-in-out infinite` });

const BEAM_X = 320;
const TABLE = { x: 70, y: 160, w: 380, h: 74 };
const TUBE_Y = 272;
const DETECTOR_Y = 118;
/** how far the team steps back, in drawing units (about 1–2 paces at this scale) */
const BACK = 58;

const SKIN = "#e8c4a0";
const SCRUBS = "#4f9da6";
const BEAM = "#ff4d4d";
const SCATTER = "#f08a5d";

const TEAM = [
  { x: 86, name: "Scrub" },
  { x: 160, name: "Surgeon" },
  { x: 236, name: "Assistant" },
];

// Scatter leaves the patient where the beam enters (the tube side, down) most, some toward the team.
const SCATTER_RAYS = [
  { a: 60, len: 70 },
  { a: 90, len: 64 },
  { a: 120, len: 70 },
  { a: 20, len: 46 },
  { a: 160, len: 46 },
  { a: -60, len: 30 },
  { a: -120, len: 30 },
].map(({ a, len }) => {
  const r = (a * Math.PI) / 180;
  const cy = TABLE.y + TABLE.h / 2;
  const at = (d: number) => ({ x: BEAM_X + Math.cos(r) * d, y: cy + Math.sin(r) * d });
  return { a, from: at(30), to: at(30 + len) };
});

/** A person from above: shoulders, head, and a small mark on the side they face (down, toward the tube). */
function Person({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={22} ry={12} fill={SCRUBS} />
      <circle cx={x} cy={y} r={10} fill={SKIN} />
      <path d={`M${x - 5} ${y + 9} L${x} ${y + 16} L${x + 5} ${y + 9} z`} fill={SKIN} />
      <text x={x} y={y - 20} textAnchor="middle" fontSize="15" fontWeight="700" fill="#f3f6f8">
        {name}
      </text>
    </g>
  );
}

export function TeamStepBack({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const cy = TABLE.y + TABLE.h / 2;
  const nearY = TABLE.y - 16;
  return (
    <svg
      viewBox="24 36 486 336"
      role="img"
      aria-label="มองจากด้านบน: เครื่อง C-arm ท่า Lateral หลอดเอกซเรย์อยู่ใต้เตียง ตัวรับภาพอยู่ด้านบน ทีม Surgeon Assistant และ Scrub ยืนฝั่งตัวรับภาพ ก่อนฉายรังสีถอยหลัง 1–2 ก้าวและหันหน้าเข้าหาหลอดเอกซเรย์ หยุดฉายแล้วกลับมาที่เดิม"
      className={className}
      style={style}
    >
      {/* the C: from the detector round the right to the tube */}
      <path d={`M${BEAM_X + 30} ${DETECTOR_Y} C 500 ${DETECTOR_Y} 500 ${TUBE_Y} ${BEAM_X + 30} ${TUBE_Y}`} stroke="#6b7d8f" strokeWidth="12" fill="none" opacity="0.7" />

      {/* table and patient (head to the left) */}
      <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx="8" fill="#3a4f63" />
      <g fill="#b9a38f">
        <circle cx={TABLE.x + 34} cy={cy} r="17" />
        <rect x={TABLE.x + 56} y={cy - 20} width="230" height="40" rx="18" />
      </g>

      {/* beam: tube to detector, across the patient */}
      <polygon
        data-ts-beam
        points={`${BEAM_X - 10},${TUBE_Y} ${BEAM_X + 10},${TUBE_Y} ${BEAM_X + 20},${DETECTOR_Y + 8} ${BEAM_X - 20},${DETECTOR_Y + 8}`}
        fill={BEAM}
        style={{ opacity: 0.6, ...play("ts-beam") }}
      />
      <g stroke={SCATTER} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" style={play("ts-scatter")}>
        {SCATTER_RAYS.map((s) => (
          <line key={s.a} x1={s.from.x} y1={s.from.y} x2={s.to.x} y2={s.to.y} />
        ))}
      </g>

      {/* tube and detector */}
      <rect x={BEAM_X - 50} y={TUBE_Y - 4} width="100" height="30" rx="5" fill="#f2b233" stroke="#0e1a2b" strokeWidth="2" />
      <text x={BEAM_X} y={TUBE_Y + 16} textAnchor="middle" fontSize="14" fontWeight="700" fill="#12202e">
        หลอดเอกซเรย์
      </text>
      <rect x={BEAM_X - 44} y={DETECTOR_Y - 20} width="88" height="27" rx="4" fill="#f3f6f8" stroke="#0e1a2b" strokeWidth="2" />
      <text x={BEAM_X} y={DETECTOR_Y} textAnchor="middle" fontSize="14" fontWeight="700" fill="#12202e">
        ตัวรับภาพ
      </text>

      {/* the distance they step back: shown while they are back */}
      <g style={play("ts-on")}>
        <line x1="40" y1={nearY} x2="40" y2={nearY - BACK} stroke="#f2b233" strokeWidth="2.5" markerEnd="url(#ts-arrow)" />
        <text x="50" y={nearY - BACK / 2 + 5} fontSize="15" fontWeight="700" fill="#f2b233">
          1–2 ก้าว
        </text>
      </g>
      <defs>
        <marker id="ts-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#f2b233" />
        </marker>
      </defs>

      {/* the team, stepped back at rest; the loop brings them in to the table's edge while the beam is off */}
      <g style={{ transform: `translateY(-${BACK}px)`, ...play("ts-team") }}>
        {TEAM.map((p) => (
          <Person key={p.name} x={p.x} y={nearY} name={p.name} />
        ))}
      </g>

      {/* what is happening, under the drawing */}
      <text x="260" y="350" textAnchor="middle" fontSize="20" fontWeight="700" fill="#f3f6f8" style={{ opacity: 0, ...play("ts-off") }}>
        ไม่ฉายรังสี: ทีมทำงานชิดเตียง
      </text>
      <text x="260" y="350" textAnchor="middle" fontSize="20" fontWeight="700" fill={BEAM} style={play("ts-on")}>
        ● ฉายรังสี: ถอยหลัง 1–2 ก้าว หันหน้าเข้าหาหลอด
      </text>
    </svg>
  );
}
