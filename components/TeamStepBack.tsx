// Animated diagram for "ตำแหน่งที่ควรยืน: ทีมเข้าเคส": the operating table seen from above with the C-arm at lateral,
// coming in from the left (tube below the table, detector above). The Surgeon works on the detector side; the
// Assistant and the Scrub stand across the table, on the tube side. Before the beam fires the Surgeon steps back
// 1–2 paces and the Assistant and Scrub go behind the lead shield; once it stops they all come back in.
// One 8 s loop (keyframes `ts-*` in globals.css). Each element's resting style is the moment of exposure (everyone
// clear, beam and scatter showing), which is what reduced motion leaves on a phone.

/** Seconds per loop. */
const LOOP = 8;
const play = (name: string) => ({ animation: `${name} ${LOOP}s ease-in-out infinite` });

const BEAM_X = 200;
const TABLE = { x: 70, y: 160, w: 380, h: 74 };
const TUBE_Y = 272;
const DETECTOR_Y = 118;
/** how far the Surgeon steps back, in drawing units (about 1–2 paces at this scale) */
const BACK = 58;

const SKIN = "#e8c4a0";
const SCRUBS = "#4f9da6";
const BEAM = "#ff4d4d";
const SCATTER = "#f08a5d";

// the Surgeon above the table (detector side), the Assistant and Scrub below it (tube side)
const SURGEON = { x: 300, y: TABLE.y - 16 };
const NEAR_Y = TABLE.y + TABLE.h + 16;
const TUBE = { x: BEAM_X, y: TUBE_Y + 11 };
const deg = (dy: number, dx: number) => (Math.atan2(dy, dx) * 180) / Math.PI;

// The lead shield stands at an angle, its face toward the tube.
const SHIELD_AT = { x: 395, y: 326 };
const SHIELD_LEN = 104;
const SHIELD = (() => {
  const r = ((deg(SHIELD_AT.y - TUBE.y, SHIELD_AT.x - TUBE.x) + 90) * Math.PI) / 180;
  const d = { x: (Math.cos(r) * SHIELD_LEN) / 2, y: (Math.sin(r) * SHIELD_LEN) / 2 };
  return { x1: SHIELD_AT.x - d.x, y1: SHIELD_AT.y - d.y, x2: SHIELD_AT.x + d.x, y2: SHIELD_AT.y + d.y };
})();

// Behind it they turn to face the tube: `turn` is how far round from facing the table (up).
const ACROSS = [
  { name: "Assistant", x: 290, hide: { x: 440, y: 298 } },
  { name: "Scrub", x: 360, hide: { x: 478, y: 348 } },
].map((p) => ({ ...p, turn: deg(TUBE.y - p.hide.y, TUBE.x - p.hide.x) + 90 }));

// Scatter leaves the patient where the beam enters (the tube side, down) most, some toward the detector side.
const SCATTER_RAYS = [
  { a: 50, len: 80 },
  { a: 80, len: 72 },
  { a: 110, len: 72 },
  { a: 140, len: 64 },
  { a: 20, len: 54 },
  { a: 160, len: 46 },
  { a: -60, len: 30 },
  { a: -120, len: 30 },
].map(({ a, len }) => {
  const r = (a * Math.PI) / 180;
  const cy = TABLE.y + TABLE.h / 2;
  const at = (d: number) => ({ x: BEAM_X + Math.cos(r) * d, y: cy + Math.sin(r) * d });
  return { a, from: at(30), to: at(30 + len) };
});

/** A person from above: shoulders, head, and a small mark on the side they face. The name sits on the far side.
 * `turn` (degrees) turns the body that far round while they are clear of the beam (the loop turns them back). */
function Person({ x, y, name, face, turn }: { x: number; y: number; name: string; face: "up" | "down"; turn?: number }) {
  const f = face === "down" ? 1 : -1;
  const turning = turn
    ? ({ "--rot": `${turn}deg`, transform: `rotate(${turn}deg)`, transformOrigin: `${x}px ${y}px`, ...play("ts-turn") } as React.CSSProperties)
    : undefined;
  return (
    <g>
      <g style={turning}>
        <ellipse cx={x} cy={y} rx={22} ry={12} fill={SCRUBS} />
        <circle cx={x} cy={y} r={10} fill={SKIN} />
        <path d={`M${x - 5} ${y + 9 * f} L${x} ${y + 16 * f} L${x + 5} ${y + 9 * f} z`} fill={SKIN} />
      </g>
      <text x={x} y={face === "down" ? y - 20 : y + 32} textAnchor="middle" fontSize="15" fontWeight="700" fill="#f3f6f8">
        {name}
      </text>
    </g>
  );
}

export function TeamStepBack({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const cy = TABLE.y + TABLE.h / 2;
  return (
    <svg
      viewBox="20 40 490 404"
      role="img"
      aria-label="มองจากด้านบน: เครื่อง C-arm ท่า Lateral เข้ามาจากด้านซ้าย หลอดเอกซเรย์อยู่ใต้เตียง ตัวรับภาพอยู่ด้านบน Surgeon ยืนฝั่งตัวรับภาพ Assistant และ Scrub ยืนฝั่งตรงข้าม ก่อนฉายรังสี Surgeon ถอยหลัง 1–2 ก้าว Assistant และ Scrub หลบหลังฉากกันรังสี หยุดฉายแล้วกลับมาที่เดิม"
      className={className}
      style={style}
    >
      <defs>
        <marker id="ts-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#f2b233" />
        </marker>
      </defs>

      {/* the C: from the detector round the left to the tube */}
      <path d={`M${BEAM_X - 30} ${DETECTOR_Y} C 30 ${DETECTOR_Y} 30 ${TUBE_Y} ${BEAM_X - 30} ${TUBE_Y}`} stroke="#6b7d8f" strokeWidth="12" fill="none" opacity="0.7" />

      {/* table and patient (head to the left) */}
      <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx="8" fill="#3a4f63" />
      <g fill="#b9a38f">
        <circle cx={TABLE.x + 34} cy={cy} r="17" />
        <rect x={TABLE.x + 56} y={cy - 20} width="230" height="40" rx="18" />
      </g>

      {/* beam: tube to detector, across the patient */}
      <polygon
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

      {/* the lead shield on the tube side, angled to face the tube */}
      <line x1={SHIELD.x1} y1={SHIELD.y1} x2={SHIELD.x2} y2={SHIELD.y2} stroke="#a3b1ba" strokeWidth="9" strokeLinecap="round" />
      <text x={Math.min(SHIELD.x1, SHIELD.x2)} y={Math.max(SHIELD.y1, SHIELD.y2) + 22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#a3b1ba">
        ฉากกันรังสี
      </text>

      {/* the distance the Surgeon steps back: shown while back */}
      <g style={play("ts-on")}>
        <line x1={SURGEON.x + 44} y1={SURGEON.y} x2={SURGEON.x + 44} y2={SURGEON.y - BACK} stroke="#f2b233" strokeWidth="2.5" markerEnd="url(#ts-arrow)" />
        <text x={SURGEON.x + 54} y={SURGEON.y - BACK / 2 + 5} fontSize="15" fontWeight="700" fill="#f2b233">
          1–2 ก้าว
        </text>
      </g>

      {/* the Surgeon, stepped back at rest; the loop brings them in to the table's edge while the beam is off */}
      <g style={{ transform: `translateY(-${BACK}px)`, ...play("ts-back") }}>
        <Person x={SURGEON.x} y={SURGEON.y} name="Surgeon" face="down" />
      </g>

      {/* the Assistant and Scrub, behind the shield facing the tube at rest; the loop brings them to the table's edge
          (they go along the table first, then back behind the shield, so they never walk through it) */}
      {ACROSS.map((p) => {
        const dx = p.hide.x - p.x;
        const dy = p.hide.y - NEAR_Y;
        const move = { "--dx": `${dx}px`, "--dy": `${dy}px` } as React.CSSProperties;
        return (
          <g key={p.name} style={{ ...move, transform: `translate(${dx}px, ${dy}px)`, ...play("ts-hide") }}>
            <Person x={p.x} y={NEAR_Y} name={p.name} face="up" turn={p.turn} />
          </g>
        );
      })}

      {/* what is happening, under the drawing */}
      <text x="265" y="432" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f3f6f8" style={{ opacity: 0, ...play("ts-off") }}>
        ไม่ฉายรังสี: ทีมทำงานชิดเตียง
      </text>
      <text x="265" y="432" textAnchor="middle" fontSize="18" fontWeight="700" fill={BEAM} style={play("ts-on")}>
        ● ฉายรังสี: ถอยห่าง หรือหลบหลังฉาก
      </text>
    </svg>
  );
}
