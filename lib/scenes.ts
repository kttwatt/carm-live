// Scene list mirrors the slide deck: join (scan), cover, opening video, talk outline, 12 content slides (2 per speaker), references.
export type SceneKind =
  | "cover"
  | "join"
  | "video"
  | "outline"
  | "lecture"
  | "poll"
  | "predict"
  | "position"
  | "quiz"
  | "decision"
  | "simulation"
  | "leaderboard"
  | "end";

export type Scene = {
  id: string;
  title: string;
  kind: SceneKind;
  /** video scenes: file in public/ */
  video?: string;
  /** outline scenes: the talk's topics, in order */
  items?: string[];
  /** outline scenes: one short line under each topic (the closing summary) */
  notes?: string[];
  slide?: number;
  speaker?: number;
  activity?: string;
  /** the title at the top of its lecture pages in amber instead of white */
  amber?: boolean;
};

// The talk's topics: listed at the start, and again with a take-home line at the end.
const TOPICS = [
  "รังสีที่ใช้ในห้องผ่าตัดและผู้ใช้งาน Fluoroscopy",
  "การทำงานของ Fluoroscopy และอันตรายจากรังสีที่ใช้ในห้องผ่าตัด",
  "หลัก ALARA: เวลา ระยะห่าง การป้องกัน",
  "อุปกรณ์ป้องกันรังสี และเครื่องตรวจวัดรังสี",
  "ค่ากำหนดปริมาณรังสี (Dose Limits)",
  "ระยะเวลาการได้รับรังสีและการดูแลรักษาอุปกรณ์ทางรังสี",
];

export const SCENES: Scene[] = [
  { id: "join", title: "ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด", kind: "join" },
  { id: "cover", title: "ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด", kind: "cover" },
  { id: "opening", title: "วิดีโอเปิดงาน", kind: "video", video: "/video/opening-60s.mp4" },
  {
    id: "outline",
    title: "หัวข้อการบรรยาย",
    kind: "outline",
    items: TOPICS,
  },
  { id: "s01", slide: 1, speaker: 1, title: "ทำไมพยาบาลห้องผ่าตัดต้องรู้เรื่องรังสี", kind: "lecture" },
  { id: "s02", slide: 2, speaker: 1, title: "ใครเป็นผู้ใช้งานเครื่อง Fluoroscopy", kind: "poll", activity: "เลือกบุคลากรที่ใช้เครื่อง Fluoroscopy ได้ แล้วเฉลยตามร่างกฎกระทรวง ข้อ 9" },
  { id: "s02c", slide: 2, speaker: 1, title: "ใครเป็นผู้ควบคุมการใช้งานเครื่องกำเนิดรังสีได้", kind: "lecture" },
  { id: "s03", slide: 3, speaker: 2, title: "หลักการทำงานของเครื่องและอันตรายจากรังสี", kind: "lecture" },
  { id: "s04", slide: 4, speaker: 2, title: "รังสีหลักกับรังสีกระเจิง", kind: "predict", activity: "ทายว่ารังสีกระเจิงไปทางไหน แล้วดูภาพจากแบบจำลอง" },
  { id: "s05", slide: 5, speaker: 3, title: "หลัก ALARA: เวลา ระยะห่าง การป้องกัน", kind: "lecture" },
  { id: "s06", slide: 6, speaker: 3, title: "ควรยืนตรงไหนในห้องผ่าตัด", kind: "position", activity: "แตะตำแหน่ง A–F รอบเตียง แล้วเฉลยดัชนีรังสีกระเจิง" },
  { id: "s07", slide: 7, speaker: 4, title: "อุปกรณ์ป้องกันรังสีส่วนบุคคล", kind: "lecture", amber: true },
  { id: "s08", slide: 8, speaker: 4, title: "แผ่นวัดรังสีประจำตัว: ติดด้านนอกหรือด้านใน", kind: "quiz", activity: "เลือกอุปกรณ์ป้องกันและตำแหน่งติดแผ่นวัดรังสี" },
  { id: "s09a", slide: 9, speaker: 5, title: "ค่ากำหนดปริมาณรังสี (Dose Limits)", kind: "lecture" },
  { id: "s09", slide: 9, speaker: 5, title: "เกณฑ์ปริมาณรังสีและผู้ปฏิบัติงานตั้งครรภ์", kind: "decision", activity: "เพื่อนร่วมทีมแจ้งว่าตั้งครรภ์ ทีมควรทำอย่างไร" },
  { id: "s10", slide: 10, speaker: 5, title: "ห้องเอกซเรย์และการป้องกันเชิงโครงสร้าง", kind: "lecture" },
  { id: "s11", slide: 11, speaker: 6, title: "การดูแลเครื่องและเวลาการฉายรังสี", kind: "lecture" },
  // the closing summary: the same topics, each with its one-line take-home point
  {
    id: "s12",
    slide: 12,
    speaker: 6,
    title: "สรุป",
    kind: "outline",
    items: TOPICS,
    notes: [
      "ผู้ควบคุมเครื่องตามกฎหมาย: แพทย์ ทันตแพทย์ สัตวแพทย์ นักรังสีเทคนิค นักฟิสิกส์การแพทย์ เจ้าพนักงานรังสี",
      "X-ray tube → ผู้ป่วย → ตัวรับภาพ → จอภาพ รังสีกระเจิงจากผู้ป่วยออกทางฝั่งหลอดเอกซเรย์มากที่สุด",
      "ฉายให้สั้น ถอยให้ห่าง และใช้เครื่องกำบัง",
      "ชุดตะกั่ว 0.50 mm Pb ปลอกคอ แว่นตา และติด OSL ที่หน้าอกใต้เสื้อตะกั่ว",
      "ผู้ปฏิบัติงาน 20 mSv/ปี เลนส์ตา 20 mSv/ปี ทารกในครรภ์ 1 mSv",
      "ใช้ Pulsed mode บันทึกเวลาฉาย แขวนชุดตะกั่วไม่พับ บำรุงเครื่องตามกำหนด",
    ],
  },
  { id: "board", title: "อันดับคะแนน", kind: "leaderboard" },
  { id: "refs", title: "ขอบคุณ · เอกสารอ้างอิงหลัก", kind: "end" },
];

export const KIND_LABEL: Record<SceneKind, string> = {
  cover: "ปก",
  join: "สแกนเข้าห้อง",
  video: "วิดีโอ",
  outline: "หัวข้อการบรรยาย",
  lecture: "บรรยาย",
  poll: "โพล",
  predict: "ทายแล้วเฉลย",
  position: "เลือกตำแหน่ง",
  quiz: "คำถาม",
  decision: "ตัดสินใจ",
  simulation: "เกมจำลอง",
  leaderboard: "อันดับคะแนน",
  end: "ปิดท้าย",
};

const INTERACTIVE: SceneKind[] = ["poll", "predict", "position", "quiz", "decision", "simulation"];
export const isInteractive = (kind: SceneKind) => INTERACTIVE.includes(kind);

export const sceneAt = (index: number): Scene => SCENES[Math.min(Math.max(index, 0), SCENES.length - 1)];
