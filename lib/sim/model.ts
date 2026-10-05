// Educational scatter model, ported from carm-simulator/index.html (same constants and references).
// Units: centimetres on a top-view floor plan; the patient lies along x, the surgeon side is y < 0.
// Every number it produces is a Relative Exposure Index, never a dose.

export type Projection = "AP" | "LAT";
export type Geometry = {
  proj: Projection;
  /** AP only: x-ray tube under or over the table */
  apTube: "under" | "over";
  /** LAT only: tube on the side opposite the surgeon ("far") or on the surgeon's side ("near") */
  latTube: "far" | "near";
  /** centre of a 1 m mobile lead shield, or null */
  shield: Pt | null;
};
export type Pt = { x: number; y: number };

export const ROOM = { x0: -300, y0: -250, w: 600, h: 500 };
export const ISO: Pt = { x: 35, y: 0 };
export const TABLE = { x0: -110, x1: 110, y0: -32, y1: 32 };

export const FACTORS = { barrier: 0.05, apron: 0.1, eyePPE: 0.3, apUnder: 0.35, apOver: 1, wMin: 0.35 };

export const SPOTS: Record<string, Pt & { label: string }> = {
  A: { x: -75, y: -82, label: "ฝั่งศัลยแพทย์ ใกล้ศีรษะ" },
  B: { x: 165, y: -82, label: "ฝั่งศัลยแพทย์ ปลายเตียง" },
  C: { x: 35, y: -195, label: "ฝั่งศัลยแพทย์ ห่างเตียง 2 เมตร" },
  D: { x: 105, y: 80, label: "ฝั่งตรงข้าม ใกล้เตียง" },
  E: { x: -95, y: 88, label: "ฝั่งตรงข้าม ใกล้ศีรษะ" },
  F: { x: 190, y: 195, label: "ฝั่งตรงข้าม ห่างเตียง" },
};

export const STAFF: Array<Pt & { name: string }> = [
  { name: "ศัลยแพทย์", x: -20, y: -66 },
  { name: "พยาบาลส่งเครื่องมือ", x: 100, y: -74 },
  { name: "วิสัญญี", x: -195, y: 0 },
];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export type Source = { src: Pt; u: Pt | null; s: 1 | -1; shieldSeg: { a: Pt; b: Pt } | null };

/** Scatter comes from the beam's entry surface: the isocentre in AP, 18 cm towards the tube in lateral. */
export function source(g: Geometry): Source {
  const s: 1 | -1 = g.latTube === "far" ? 1 : -1;
  const src = g.proj === "AP" ? { ...ISO } : { x: ISO.x, y: s * 18 };
  const u = g.proj === "AP" ? null : { x: 0, y: s };
  let shieldSeg = null;
  if (g.shield) {
    const c = g.shield;
    let nx = c.x - src.x;
    let ny = c.y - src.y;
    const L = Math.hypot(nx, ny) || 1;
    nx /= L;
    ny /= L;
    shieldSeg = { a: { x: c.x + ny * 50, y: c.y - nx * 50 }, b: { x: c.x - ny * 50, y: c.y + nx * 50 } };
  }
  return { src, u, s, shieldSeg };
}

function segmentsCross(p1: Pt, p2: Pt, p3: Pt, p4: Pt) {
  const o = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return o(p3, p4, p1) > 0 !== o(p3, p4, p2) > 0 && o(p1, p2, p3) > 0 !== o(p1, p2, p4) > 0;
}

/** Directional weight: 1 on the tube side, 0.35 on the detector side (lateral); 1 everywhere in AP top view. */
export function weight(p: Pt, so: Source) {
  if (!so.u) return 1;
  const dx = p.x - so.src.x;
  const dy = p.y - so.src.y;
  const L = Math.hypot(dx, dy) || 1;
  const c = (dx * so.u.x + dy * so.u.y) / L;
  return FACTORS.wMin + (1 - FACTORS.wMin) * Math.pow((1 + c) / 2, 1.2);
}

export const behindShield = (p: Pt, so: Source) => !!so.shieldSeg && segmentsCross(so.src, p, so.shieldSeg.a, so.shieldSeg.b);
export const distanceM = (p: Pt, so: Source) => Math.hypot(p.x - so.src.x, p.y - so.src.y) / 100;

/** Relative Exposure Index per second of fluoroscopy, before personal protective equipment. 100 = 1 m, tube side, lateral. */
export function intensity(p: Pt, so: Source) {
  const d = Math.max(distanceM(p, so), 0.35);
  return ((100 * weight(p, so)) / (d * d)) * (behindShield(p, so) ? FACTORS.barrier : 1);
}

/** Eye-level factor: in AP the tube under the table sends most scatter down. */
export const eyeFactor = (g: Geometry) => (g.proj === "AP" ? (g.apTube === "under" ? FACTORS.apUnder : FACTORS.apOver) : 1);

/** Keep a standing position on the floor and off the table. */
export function onFloor(p: Pt): Pt {
  const x = clamp(p.x, -285, 285);
  let y = clamp(p.y, -235, 235);
  if (x > -128 && x < 128 && y > -50 && y < 50) y = y < 0 ? -50 : 50;
  return { x: Math.round(x), y: Math.round(y) };
}

export const formatIndex = (v: number) => (v >= 100 ? Math.round(v).toLocaleString("th-TH") : v >= 10 ? v.toFixed(0) : v.toFixed(1));

/* ---------- heat map ---------- */

const STOPS: Array<[number, [number, number, number]]> = [
  [0, [255, 230, 120]],
  [0.35, [255, 170, 40]],
  [0.7, [235, 90, 30]],
  [1, [190, 30, 60]],
];
function ramp(t: number): [number, number, number] {
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const [t0, c0] = STOPS[i - 1];
      const [t1, c1] = STOPS[i];
      const k = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k)) as [number, number, number];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

/** 150 × 125 cells of 4 cm, log-scaled, ready for putImageData. */
export function heatImage(g: Geometry): ImageData {
  const so = source(g);
  const W = 150;
  const H = 125;
  const img = new ImageData(W, H);
  const lo = -0.5;
  const hi = 2.9;
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const t = clamp((Math.log10(intensity({ x: ROOM.x0 + (i + 0.5) * 4, y: ROOM.y0 + (j + 0.5) * 4 }, so)) - lo) / (hi - lo));
      const [r, gr, b] = ramp(t);
      const k = (j * W + i) * 4;
      img.data[k] = r;
      img.data[k + 1] = gr;
      img.data[k + 2] = b;
      img.data[k + 3] = Math.round(255 * (0.04 + 0.82 * Math.pow(t, 1.15)));
    }
  return img;
}
