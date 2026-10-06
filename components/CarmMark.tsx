// A small C-arm drawing for the middle of the join QR: the C open to the right, detector at the top, X-ray tube at
// the bottom with a faint beam between them, on a wheeled base with the radiation sign. Bold outlines so it reads
// when small.

const NAVY = "#0b1f45";
const AMBER = "#f2b233";

export function CarmMark({ className }: { className?: string }) {
  return (
    <svg viewBox="112 52 252 334" className={className} aria-hidden>
      {/* base on wheels, with the radiation sign */}
      <rect x="150" y="318" width="170" height="40" rx="12" fill="#c9d3dd" stroke={NAVY} strokeWidth="7" />
      <circle cx="178" cy="366" r="13" fill={NAVY} />
      <circle cx="292" cy="366" r="13" fill={NAVY} />
      <g transform="translate(235 338)">
        <circle r="15" fill={AMBER} stroke={NAVY} strokeWidth="4" />
        <circle r="3.5" fill={NAVY} />
        {[0, 120, 240].map((a) => (
          <path key={a} d="M0 0 L12 -6 A13 13 0 0 1 12 6 z" transform={`rotate(${a - 90}) translate(2 0)`} fill={NAVY} />
        ))}
      </g>
      {/* the column up to the C */}
      <rect x="222" y="268" width="26" height="54" fill="#9aa8b5" stroke={NAVY} strokeWidth="7" />
      {/* the C */}
      <path d="M300 92 A112 112 0 1 0 300 296" fill="none" stroke={NAVY} strokeWidth="40" strokeLinecap="round" />
      <path d="M300 92 A112 112 0 1 0 300 296" fill="none" stroke="#5cc3e6" strokeWidth="26" strokeLinecap="round" />
      {/* detector at the top end, tube at the bottom end, a faint beam between */}
      <rect x="282" y="66" width="66" height="34" rx="6" fill="#f3f6f8" stroke={NAVY} strokeWidth="7" />
      <rect x="284" y="284" width="62" height="38" rx="8" fill={AMBER} stroke={NAVY} strokeWidth="7" />
      <path d="M302 284 L328 284 L334 100 L296 100 z" fill="#ff4d4d" opacity="0.28" />
    </svg>
  );
}
