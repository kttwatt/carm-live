// Question content per scene. Facts and wording follow the references reviewed for the seminar;
// items marked [ยืนยัน] still need sign-off from the course's radiation safety officer.
import type { Geometry } from "./sim/model";

export type Choice = { id: string; label: string };
export type Question = {
  prompt: string;
  multi?: boolean;
  choices: Choice[];
  correct: string[];
  /** "* " lines become a list; text between ==…== is highlighted (components/Explanation.tsx) */
  explanation: string;
  /** answer by tapping spots A–F on the operating-room map set up like this */
  map?: Geometry;
};

export const QUESTIONS: Record<string, Question> = {
  s02: {
    prompt: "ใครเป็นผู้ใช้งานเครื่อง Fluoroscopy",
    multi: true,
    choices: [
      { id: "physician", label: "แพทย์" },
      { id: "dentist", label: "ทันตแพทย์" },
      { id: "vet", label: "สัตวแพทย์" },
      { id: "radtech", label: "นักรังสีเทคนิค" },
      { id: "physicist", label: "นักฟิสิกส์การแพทย์" },
      { id: "radofficer", label: "เจ้าพนักงานรังสี" },
      { id: "rn", label: "พยาบาลวิชาชีพ" },
      { id: "pn", label: "ผู้ช่วยพยาบาล" },
    ],
    correct: ["physician", "dentist", "vet", "radtech", "physicist", "radofficer"],
    explanation:
      "ร่างกฎกระทรวง ข้อ 9 กำหนดผู้ควบคุมการใช้งานเครื่องกำเนิดรังสีไว้ 6 กลุ่ม คือ\n" +
      "* แพทย์\n* ทันตแพทย์\n* สัตวแพทย์\n* นักรังสีเทคนิค\n* นักฟิสิกส์การแพทย์\n* เจ้าพนักงานรังสี\n" +
      "==ส่วนพยาบาลวิชาชีพและผู้ช่วยพยาบาลไม่อยู่ในรายชื่อนี้==",
  },
  s04: {
    prompt: "ขณะฉายรังสี แหล่งรังสีกระเจิงที่สำคัญที่สุดต่อบุคลากรอยู่ที่ไหน",
    choices: [
      { id: "tube", label: "หลอดเอกซเรย์" },
      { id: "patient", label: "ร่างกายผู้ป่วย" },
      { id: "detector", label: "แผ่นรับภาพ" },
      { id: "walls", label: "ผนังห้องผ่าตัด" },
    ],
    correct: ["patient"],
    explanation:
      "รังสีกระเจิงเกิดเมื่อลำรังสีกระทบร่างกายผู้ป่วย มากที่สุดด้านที่ลำรังสีเข้า (ฝั่งหลอดเอกซเรย์) ที่ระยะ 1 เมตรได้ราว 0.1% ของรังสีที่เข้าผิวผู้ป่วย และลดลงตามระยะยกกำลังสอง",
  },
  s06: {
    prompt: "ท่าถ่ายด้านข้าง หลอดเอกซเรย์อยู่ฝั่งตรงข้ามศัลยแพทย์ คุณเป็นพยาบาลช่วยรอบนอก จะยืนจุดไหนเพื่อรับรังสีกระเจิงน้อยที่สุด",
    choices: [
      { id: "A", label: "A · ฝั่งศัลยแพทย์ ใกล้ศีรษะ" },
      { id: "B", label: "B · ฝั่งศัลยแพทย์ ปลายเตียง" },
      { id: "C", label: "C · ฝั่งศัลยแพทย์ ห่างเตียง 2 เมตร" },
      { id: "D", label: "D · ฝั่งตรงข้าม ใกล้เตียง" },
      { id: "E", label: "E · ฝั่งตรงข้าม ใกล้ศีรษะ" },
      { id: "F", label: "F · ฝั่งตรงข้าม ห่างเตียง" },
    ],
    correct: ["C"],
    map: { proj: "LAT", latTube: "far", apTube: "under", shield: null },
    explanation:
      "จุด C อยู่ฝั่งแผ่นรับภาพและห่างที่สุด ฝั่งหลอดเอกซเรย์ได้รับรังสีกระเจิงมากกว่าฝั่งแผ่นรับภาพราว 2–3 เท่า อย่าจำซ้ายหรือขวา ให้ดูว่าหลอดอยู่ฝั่งไหน แล้วถอยห่างเท่าที่งานอนุญาต",
  },
  s08: {
    prompt: "ถ้ามีแผ่นวัดรังสีประจำตัวเพียงแผ่นเดียว ควรติดที่ไหน",
    choices: [
      { id: "collar_out", label: "ที่คอเสื้อ นอกเสื้อตะกั่ว" },
      { id: "waist_in", label: "ที่เอว ใต้เสื้อตะกั่ว" },
      { id: "chest_in", label: "ที่หน้าอก ใต้เสื้อตะกั่ว" },
      { id: "pocket", label: "ในกระเป๋าชุดผ่าตัด" },
    ],
    correct: ["collar_out"],
    explanation:
      "NCRP 122: มีแผ่นเดียวให้ติดที่คอเสื้อนอกเสื้อตะกั่ว เพื่อประเมินรังสีที่ศีรษะ คอ และเลนส์ตา มีสองแผ่นให้เพิ่มอีกแผ่นที่เอวใต้เสื้อตะกั่ว แผ่นวัดรังสีไม่ได้ป้องกันรังสี [ยืนยันตามระเบียบของหน่วยงาน]",
  },
  s09: {
    prompt: "เพื่อนพยาบาลแจ้งว่าตั้งครรภ์ และถูกจัดเข้าเคสที่ใช้ C-arm ทีมควรทำอย่างไรก่อน",
    choices: [
      { id: "ban", label: "ห้ามเข้าห้องที่มีรังสีทุกกรณี" },
      { id: "assess", label: "แจ้งหัวหน้าและผู้รับผิดชอบความปลอดภัยทางรังสี เพื่อประเมินงานและติดตามปริมาณรังสี" },
      { id: "double", label: "สวมเสื้อตะกั่วสองชั้นแล้วทำงานตามปกติ" },
      { id: "nothing", label: "ไม่ต้องทำอะไร เพราะรังสีกระเจิงน้อยมาก" },
    ],
    correct: ["assess"],
    explanation:
      "ICRP 103: หลังแจ้งตั้งครรภ์ ควรจัดสภาพงานให้ทารกในครรภ์ได้รับไม่เกินราว 1 มิลลิซีเวิร์ตตลอดช่วงที่เหลือ การตั้งครรภ์ไม่ได้แปลว่าต้องหยุดงานรังสีเสมอไป แต่ต้องประเมินและติดตาม [ยืนยันข้อความกับผู้รับผิดชอบด้านความปลอดภัยทางรังสี]",
  },
};

export const questionFor = (sceneId: string): Question | undefined => QUESTIONS[sceneId];
