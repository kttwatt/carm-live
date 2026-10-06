// Three small moving icons under the "หลัก ALARA" cards, one per principle (keyframes `al-*` in globals.css):
// Time, a clock whose hand sweeps round while rays pulse out of it; Distance, a person walking away from the X-ray
// tube and back; Shielding, rays travelling in and stopping at the lead apron, beside the collar and a mobile shield.

const INK = "#2f6db5";
const FILL = "#5b9be0";
const RAY = "#f08a5d";
const LIGHT = "#f2b233";

const loop = (name: string, s: number, timing = "linear") => ({ animation: `${name} ${s}s ${timing} infinite` });

function Time() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-auto" role="img" aria-label="เวลา: นาฬิกา เข็มหมุน รังสีออกมาตามเวลาที่ฉาย">
      <g stroke={RAY} strokeWidth="3" strokeLinecap="round" style={loop("al-pulse", 1.2)}>
        <line x1="72" y1="44" x2="108" y2="30" />
        <line x1="74" y1="48" x2="112" y2="48" />
        <line x1="72" y1="52" x2="108" y2="66" />
      </g>
      <circle cx="44" cy="47" r="30" fill="#fff" stroke={INK} strokeWidth="5" />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1="44" y1="21" x2="44" y2="26" stroke={INK} strokeWidth="3" transform={`rotate(${a} 44 47)`} />
      ))}
      <line x1="44" y1="47" x2="58" y2="47" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <g style={{ transformOrigin: "44px 47px", ...loop("al-spin", 3) }}>
        <line x1="44" y1="47" x2="44" y2="24" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="44" cy="47" r="3.5" fill={INK} />
    </svg>
  );
}

function Distance() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-auto" role="img" aria-label="ระยะห่าง: คนเดินออกห่างจากหลอดเอกซเรย์">
      {/* the tube on the ceiling and its light */}
      <rect x="14" y="6" width="30" height="10" rx="2" fill="#9aa8b5" />
      <path d="M18 16 L40 16 L50 40 L8 40 z" fill={LIGHT} style={loop("al-pulse", 1.2)} />
      {/* how far */}
      <g stroke={INK} strokeWidth="3" strokeLinecap="round">
        <line x1="16" y1="62" x2="56" y2="62" />
        <path d="M22 56 L16 62 L22 68 M50 56 L56 62 L50 68" fill="none" />
      </g>
      {/* the person, walking away and back */}
      <g style={loop("al-walk", 4, "ease-in-out")}>
        <circle cx="80" cy="22" r="7" fill={FILL} />
        <path d="M80 30 L78 52" stroke={FILL} strokeWidth="8" strokeLinecap="round" />
        <path d="M79 34 L90 44 M79 34 L70 44" stroke={FILL} strokeWidth="5" strokeLinecap="round" />
        <g style={{ transformOrigin: "78px 52px", ...loop("al-step", 0.8, "ease-in-out") }}>
          <path d="M78 52 L88 72" stroke={FILL} strokeWidth="6" strokeLinecap="round" />
        </g>
        <g style={{ transformOrigin: "78px 52px", ...loop("al-step-b", 0.8, "ease-in-out") }}>
          <path d="M78 52 L70 72" stroke={FILL} strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

function Shielding() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-auto" role="img" aria-label="การกำบัง: รังสีมากระทบชุดตะกั่วแล้วหยุด ปลอกคอกันรังสี และฉากกันรังสีแบบเคลื่อนที่">
      {/* rays coming in from the left, stopping at the apron */}
      <g stroke={RAY} strokeWidth="3" strokeLinecap="round" strokeDasharray="6 6" style={loop("al-flow", 0.6)}>
        <line x1="2" y1="44" x2="22" y2="44" />
        <line x1="2" y1="56" x2="22" y2="56" />
        <line x1="2" y1="68" x2="22" y2="68" />
      </g>
      {/* collar and apron */}
      <path d="M30 14 Q42 6 54 14 L52 20 Q42 14 32 20 z" fill={FILL} />
      <path d="M30 26 L36 24 L42 30 L48 24 L54 26 L58 40 L56 80 L28 80 L26 40 z" fill={FILL} stroke={INK} strokeWidth="2" style={loop("al-glow", 1.2)} />
      {/* mobile shield */}
      <rect x="76" y="14" width="34" height="56" rx="3" fill="#bfe4e0" stroke={INK} strokeWidth="3" />
      <line x1="93" y1="70" x2="93" y2="80" stroke={INK} strokeWidth="3" />
      <line x1="80" y1="80" x2="106" y2="80" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="82" cy="84" r="3" fill={INK} />
      <circle cx="104" cy="84" r="3" fill={INK} />
    </svg>
  );
}

/** The three icons in a row, each on a light tile, in the order of the cards. */
export function AlaraIcons({ lite }: { lite?: boolean }) {
  return (
    // On the projector they move even under reduced motion; phones keep the viewer's setting.
    <div className={`grid grid-cols-3 gap-[1.4cqw] ${lite ? "" : "motion-demo"}`}>
      {[Time, Distance, Shielding].map((Icon, i) => (
        <div key={i} className="flex h-[16cqh] items-center justify-center rounded-2xl border-2 border-sky bg-paper p-[1cqh]">
          <Icon />
        </div>
      ))}
    </div>
  );
}
