import { z } from "zod";

// "scores": after a question is revealed, the running scores show before the next scene.
export const PHASES = ["idle", "open", "locked", "revealed", "scores"] as const;
export type Phase = (typeof PHASES)[number];

const PointSchema = z.object({ x: z.number(), y: z.number() });

/** The presenter's radiation demo: C-arm setup, shield, fluoroscopy on/off, and whether it is on screen. */
export const SimSchema = z.object({
  show: z.boolean(),
  fluoro: z.boolean(),
  proj: z.enum(["AP", "LAT"]),
  apTube: z.enum(["under", "over"]),
  latTube: z.enum(["far", "near"]),
  shield: PointSchema.nullable(),
  /** the join QR is shown full-size on the main screen (presenter pressed "QR เข้าห้อง") */
  qr: z.boolean().optional(),
  /** video scenes: false while the presenter has paused it; vidSeq goes up for "play from the start" */
  vidPlay: z.boolean().optional(),
  vidSeq: z.number().int().optional(),
});
export type Sim = z.infer<typeof SimSchema>;
export const DEFAULT_SIM: Sim = { show: false, fluoro: false, proj: "LAT", apTube: "under", latTube: "far", shield: null };

// Every change carries the full snapshot plus a version, so a client can always overwrite its local copy.
export const StateSchema = z.object({
  sceneIndex: z.number().int().min(0),
  phase: z.enum(PHASES),
  version: z.number().int().min(0),
  updatedAt: z.string(),
  sim: SimSchema.nullable().optional(),
});
export type LiveState = z.infer<typeof StateSchema>;

export const PHASE_LABEL: Record<Phase, string> = {
  idle: "ยังไม่เปิดรับคำตอบ",
  open: "เปิดรับคำตอบ",
  locked: "ปิดรับคำตอบแล้ว",
  revealed: "เฉลยแล้ว",
  scores: "แสดงคะแนน",
};

export const NicknameSchema = z.string().trim().min(1, "ใส่เลขที่และชื่อ").max(24, "เลขที่และชื่อยาวได้ไม่เกิน 24 ตัวอักษร");

const ROOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const RoomSchema = z.string().regex(/^[A-Z0-9]{4,8}$/);
export const normalizeRoom = (raw: string) => raw.trim().toUpperCase();

export function randomRoom(len = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join("");
}

export function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// crypto.randomUUID only exists on https or localhost; phones on the LAN dev address use plain http.
export const uid = () => randomKey().slice(0, 32);
