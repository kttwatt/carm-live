// What the main screen shows for a lecture slide, one page at a time (the presenter's "next" steps
// through them before moving on). Text comes from the seminar's Canva deck and speaker 2's script, with
// typing and PDF-copy errors fixed.

/** label replaces the card's running number, e.g. "(ก)" for a lettered clause */
export type Point = { th: string; en?: string; desc?: string; label?: string };
export type Page = {
  /** the page's title, in amber 15% down the screen (the slide's title is not shown on lecture pages);
   * empty when a picture on the page carries its own */
  heading: string;
  /** the heading centred above a picture that is centred under it */
  centerHeading?: boolean;
  /** a smaller heading, for a long one that would otherwise take two lines over a picture */
  smallHeading?: boolean;
  lead?: string;
  points?: Point[];
  /** a paragraph under the points, smaller than the lead */
  after?: string;
  table?: { head: string[]; rows: string[][] };
  /** one line under everything: a key message or the source */
  note?: string;
  /** what the units mean, under the table: [unit, what it measures, where it is used] */
  units?: [string, string, string][];
  /** the page's take-home message, set large and highlighted under everything ("
" starts a new line) */
  key?: string;
  /** each line of the key message in its own smaller box, for a page where one big box would outweigh the table */
  keyApart?: boolean;
  /** an animated diagram beside the points, which light up step by step with it */
  figure?: "radiation-journey" | "radiation-ap" | "carm-3d" | "team-step" | "alara-icons" | "dose-scale";
  /** a picture from the source document, shown as is (file in public/) */
  image?: { src: string; alt: string };
  /** cards per row; the default is one card per row, across the screen, with a round number */
  cols?: number;
  /** with cols above 1: cards with a round number, text centred, all the same height */
  round?: boolean;
  /** the picture goes under the cards instead of above them */
  imageBelow?: boolean;
  /** the picture's height limit, in % of the screen height, when the page has room for a larger one */
  imageMax?: number;
  /** document covers in one row, each with its title and source under it (a references page) */
  covers?: { src: string; title: string; source: string }[];
  /** a picture to the right of the cards, with the key message under it */
  side?: { src: string; alt: string };
  /** an acronym set large with its words under it; the heading then sits beside the lead instead of above */
  acronym?: { word: string; full: string };
  /** the most the page may grow into spare room (default 1.4); it shrinks below 1 by itself when it would not fit */
  scale?: number;
};

export const PAGES: Record<string, Page[]> = {
  s01: [
    {
      heading: "รังสีทางการแพทย์",
      lead:
        "ปัจจุบันมีการนำรังสีหรือสารกัมมันตรังสีมาใช้ประโยชน์ในหลาย ๆ ด้าน โดยเฉพาะในด้านการแพทย์ เพื่อช่วยให้แพทย์สามารถดำเนินการตรวจวินิจฉัยและรักษาโรคได้อย่างถูกต้อง รวดเร็ว และแม่นยำมากยิ่งขึ้น โดยสามารถแบ่งออกได้เป็น 3 กลุ่มใหญ่ ๆ คือ",
      points: [
        { th: "รังสีวินิจฉัย", en: "Diagnostic radiology" },
        { th: "รังสีรักษา", en: "Radiotherapy" },
        { th: "เวชศาสตร์นิวเคลียร์", en: "Nuclear medicine" },
      ],
    },
    {
      heading: "รังสีวินิจฉัย (Diagnostic radiology)",
      lead: "การนำรังสีเอกซ์มาช่วยสร้างภาพอวัยวะ เพื่อการตรวจรักษาและวินิจฉัย รวมถึงการตรวจคัดกรองโรค เช่น",
      points: [
        { th: "เครื่องเอกซเรย์ทั่วไป", en: "General X-ray" },
        { th: "Fluoroscopy", en: "ภาพเอกซเรย์ต่อเนื่อง เช่น C-arm / O-arm" },
        { th: "เครื่องเอกซเรย์คอมพิวเตอร์", en: "CT scan" },
        { th: "เครื่องเอกซเรย์เต้านม", en: "Mammography" },
        { th: "เครื่องเอกซเรย์ฟัน", en: "Dental X-ray" },
      ],
    },
  ],

  s02c: [
    {
      // AORN Journal, May 2021 (doi 10.1002/aorn.13402), with the user's highlights
      heading: "แนวทางของ AORN (2021)",
      centerHeading: true,
      image: {
        src: "/pages/s02c-aorn-highlights.webp",
        alt: "AORN Journal พฤษภาคม 2021: ให้เฉพาะบุคลากรที่มีคุณสมบัติใช้งานเครื่องเอกซเรย์ สถานพยาบาลต้องมีโครงการความปลอดภัยทางรังสีเมื่อมีโอกาสได้รับรังสีจากการทำงาน และโครงการนั้นต้องมีรายชื่อผู้ได้รับอนุญาตให้ใช้งานเครื่อง",
      },
      // the highlighted lines are small in the scan: let it fill the page
      imageMax: 85,
    },
    {
      heading: "ใครเป็นผู้ควบคุมการใช้งานเครื่องกำเนิดรังสีได้",
      lead:
        "จากร่างกฎกระทรวง มาตรฐานความปลอดภัยของเครื่องกำเนิดรังสีเพื่อการวินิจฉัยทางการแพทย์ที่ต้องแจ้งการมีไว้ในครอบครองหรือใช้ พ.ศ. 2562 ข้อ 9 ระบุว่า ผู้มีไว้ในครอบครองหรือใช้เครื่องกำเนิดรังสีต้องจัดให้มีผู้ควบคุมการใช้งานเครื่องกำเนิดรังสีที่มีคุณสมบัติอย่างใดอย่างหนึ่ง ดังต่อไปนี้",
      // two per row so each clause's name stays on one line
      cols: 2,
      points: [
        { label: "(ก)", th: "ผู้ประกอบวิชาชีพเวชกรรม", en: "ตามกฎหมายว่าด้วยวิชาชีพเวชกรรม" },
        { label: "(ข)", th: "ผู้ประกอบวิชาชีพทันตกรรม", en: "ตามกฎหมายว่าด้วยวิชาชีพทันตกรรม" },
        { label: "(ค)", th: "ผู้ประกอบวิชาชีพการสัตวแพทย์", en: "ตามกฎหมายว่าด้วยวิชาชีพการสัตวแพทย์" },
        { label: "(ง)", th: "ผู้ประกอบโรคศิลปะสาขารังสีเทคนิค", en: "ตามกฎหมายว่าด้วยการประกอบโรคศิลปะ" },
        { label: "(จ)", th: "เป็นผู้ปฏิบัติหน้าที่นักฟิสิกส์การแพทย์" },
        { label: "(ฉ)", th: "เป็นผู้ปฏิบัติหน้าที่เจ้าพนักงานรังสี" },
      ],
      after:
        "สำหรับบุคคลที่เป็นผู้ปฏิบัติหน้าที่เจ้าพนักงานรังสี (ฉ) ต้องปฏิบัติงานตามคู่มือที่สภาวิชาชีพของผู้ประกอบวิชาชีพอย่างใดอย่างหนึ่งกำหนด หรือเป็นผู้ที่ผ่านการอบรมการป้องกันอันตรายจากรังสีตามหลักสูตรที่กรมวิทยาศาสตร์การแพทย์หรือสภาวิชาชีพดังกล่าวรับรอง และต้องมีการกำกับดูแลการปฏิบัติงานโดยบุคคลที่มีคุณสมบัติตาม (ก) - (จ)",
    },
    {
      heading: "ใครเป็นผู้ควบคุมการใช้งานเครื่องกำเนิดรังสีได้",
      image: {
        src: "/pages/s02c-controllers.webp",
        alt: "ผู้ควบคุมการใช้งานเครื่องกำเนิดรังสี: 1 ผู้ประกอบวิชาชีพเวชกรรม ทันตกรรม การสัตวแพทย์ หรือโรคศิลปะสาขารังสีเทคนิค ตามกฎหมายว่าด้วยวิชาชีพนั้น 2 ผู้ปฏิบัติหน้าที่นักฟิสิกส์การแพทย์",
      },
    },
  ],

  s03: [
    // Topic pages (a heading alone): shown as a section title in the middle of the screen.
    { heading: "หลักการทำงานของ Fluoroscopy" },
    // the 3D C-arm turning under the heading
    { heading: "ส่วนประกอบของ Fluoroscopy", figure: "carm-3d" },
    {
      heading: "การเดินทางของรังสี",
      figure: "radiation-journey",
      lead: "X-ray tube → ผู้ป่วย → ตัวรับภาพ → จอภาพ",
      points: [
        { th: "ปล่อยรังสี", desc: "ไส้หลอดที่ร้อนปล่อยอิเล็กตรอน วิ่งไปชนเป้าโลหะ (ทังสเตน) เกิดรังสีเอกซ์ พลังงานส่วนใหญ่กลายเป็นความร้อน" },
        { th: "เข้าสู่ผู้ป่วย", desc: "ผิวด้านที่รังสีเข้าได้รับรังสีมากที่สุด" },
        { th: "ในตัวผู้ป่วย", desc: "ถูกดูดกลืน กระเจิงออกนอกตัว หรือทะลุผ่าน มีเพียงส่วนน้อยที่ทะลุถึงตัวรับภาพ" },
        { th: "สร้างภาพ", desc: "รังสีที่ทะลุผ่านถึงตัวรับภาพ แปลงเป็นภาพบนจอ" },
      ],
    },
    {
      heading: "รังสีกระเจิง (Scatter)",
      // the AP diagram, held still, sits centred under the three cards
      figure: "radiation-ap",
      cols: 3,
      points: [
        { th: "รังสีที่เกิดจาก Primary beam กระทบตัวผู้ป่วย แล้วกระเจิงออกสู่ห้องผ่าตัด" },
        { th: "ฝั่ง X-ray tube มีรังสีกระเจิงมากกว่าฝั่งตัวรับภาพ" },
        { th: "ผู้ป่วยที่มีตัวหนา ขนาดตัว⁠ใหญ่ เครื่องต้องเพิ่มกำลังรังสีอัตโนมัติ ทำให้ผู้ป่วยและทีมได้รับรังสีมากขึ้น" },
      ],
    },
    {
      heading: "โหมดการฉายรังสี",
      table: {
        head: ["", "Continuous", "Pulsed"],
        rows: [
          ["การปล่อยรังสี", "ต่อเนื่องตลอดเวลาที่เหยียบสวิตช์", "เป็นช่วงสั้น เช่น 15 หรือ 7.5 ครั้งต่อวินาที"],
          ["ปริมาณรังสี", "สูงกว่า", "ต่ำกว่า"],
          ["ภาพ", "ลื่นไหล", "อาจกระตุกเมื่อตั้งจำนวนครั้งต่ำ"],
        ],
      },
      keyApart: true,
      key: "Pulsed mode เป็นค่าเริ่มต้นที่ควรใช้\nContinuous mode ใช้เมื่อต้องเห็นการเคลื่อนไหวเร็วและต่อเนื่อง",
    },
    {
      heading: "ผลของรังสีต่อมนุษย์",
      table: {
        head: ["อวัยวะ", "ผลของรังสี", "Threshold (mGy)"],
        rows: [
          ["ผิวหนัง", "ผื่นแดง", "2,000"],
          ["อัณฑะ", "เป็นหมันชั่วคราว", "150"],
          ["อัณฑะ", "เป็นหมันถาวร", "3,500–6,000"],
          ["รังไข่", "เป็นหมัน", "2,500–6,000"],
          ["เลนส์ตา", "ต้อกระจก", "500"],
          ["ทั่วร่างกาย", "Acute radiation sickness", "1,000"],
        ],
      },
      units: [
        ["mGy", "รังสีที่อวัยวะหรือเนื้อเยื่อตรงนั้นได้รับจริง", "ผลที่เกิดเมื่อได้รับเกินค่าหนึ่ง เช่น ผิวหนังแดง ต้อกระจก เป็นหมัน"],
        ["mSv", "ความเสี่ยงต่อร่างกาย คิดจากชนิดรังสีและความไวของแต่ละอวัยวะ", "ค่ากำหนดปริมาณรังสี (Dose Limits) ผลวัดจากแผ่น OSL และความเสี่ยงมะเร็งระยะยาว"],
      ],
      note: "ที่มา: ICRP, Radiation and your patient: A guide for medical practitioners (icrp.org/docs/rad_for_gp_for_web.pdf) · เลนส์ตา: ICRP Publication 118 (2012)",
    },
    {
      // per-exposure doses against the thresholds from the table before, on a ruler where each step is ten times the last
      heading: "ปริมาณรังสีต่อครั้ง ห่างจากขีดอันตรายแค่ไหน",
      smallHeading: true,
      figure: "dose-scale",
      note: "ค่าที่ได้รับต่อครั้งเป็นค่าประมาณ ขึ้นกับเครื่อง ขนาดตัวผู้ป่วย และระยะที่ยืน\nที่มา: ICRP หรือ คณะกรรมาธิการระหว่างประเทศว่าด้วยการป้องกันรังสี",
    },
  ],

  s05: [
    {
      heading: "เป้าหมาย",
      acronym: { word: "ALARA", full: "As Low As Reasonably Achievable" },
      lead: "การป้องกันและลดปริมาณรังสีที่ผู้ปฏิบัติงาน ผู้⁠ป่วย และบุคคลทั่วไปจะได้รับให้น้อยที่สุดเท่าที่จะทำได้ โดยยังคงได้รับประโยชน์จากรังสีนั้นอยู่",
    },
    {
      heading: "หลัก ALARA",
      // a moving icon for each principle under the cards
      figure: "alara-icons",
      points: [
        { th: "Time", en: "เวลา", desc: "ใช้เวลาในการปฏิบัติงานให้น้อยที่สุด ยิ่งใช้เวลาน้อย รังสีจะยิ่งน้อย" },
        { th: "Distance", en: "ระยะห่าง", desc: "อยู่ห่างจากแหล่งกำเนิดรังสีให้มากที่สุดเท่าที่จะทำได้" },
        { th: "Shielding", en: "การกำบัง", desc: "ใช้วัสดุกำบังที่เหมาะสมคั่นระหว่างบุคคลกับแหล่งกำเนิดรังสี" },
      ],
    },
  ],

  s07: [
    {
      heading: "ตำแหน่งที่ควรยืน: ทีมเข้าเคส",
      lead: "Surgeon Assistant Scrub",
      // the team steps back while the beam fires, beside the three cards
      figure: "team-step",
      points: [
        { th: "ยืนฝั่งเดียวกับตัวรับภาพ", en: "Detector" },
        { th: "ถอยหลัง 1–2 ก้าว" },
        { th: "หันหน้าเข้าหาแหล่งกำเนิดรังสี" },
      ],
    },
    {
      heading: "ตำแหน่งที่ควรยืน: ทีมรอบนอก",
      lead: "ทีมส่งของ และทีมดูแลนอกเขตปลอดเชื้อ",
      points: [
        { th: "รักษาระยะห่างอย่างน้อย 2 เมตร หรือ 6 ฟุต" },
        { th: "หลบหลังฉากกั้นตะกั่ว" },
        { th: "ใช้ผู้สวมชุดตะกั่วเป็นโล่บัง" },
      ],
    },
    {
      heading: "แผนภาพความปลอดภัย: ท่าถ่ายภาพหน้า-หลัง (AP view)",
      centerHeading: true,
      smallHeading: true,
      image: {
        src: "/pages/ap-view-safety.webp",
        alt: "C-arm ท่า AP: ตัวรับภาพอยู่ด้านบน หลอดกำเนิดรังสีอยู่ใต้เตียง รังสีกระเจิงออกจากตัวผู้ป่วยและใต้เตียงเป็นบริเวณอันตราย พยาบาลหมุนเวียนยืนห่างเกิน 2 เมตรหลังแผ่นกั้นตะกั่วเคลื่อนที่ ในระยะปลอดภัย",
      },
      imageMax: 78,
    },
    {
      heading: "แผนภาพความปลอดภัย: ท่าถ่ายภาพด้านข้าง (Lateral view)",
      centerHeading: true,
      smallHeading: true,
      imageMax: 78,
      image: {
        src: "/pages/lateral-view-safety.webp",
        alt: "C-arm ท่า Lateral มองจากด้านบน: ฝั่งหลอดเอกซเรย์เป็นเขตอันตราย รังสีกระเจิงสูง รังสีกระเจิงออกจากตัวผู้ป่วยไปรอบเตียง พยาบาลหมุนเวียนอยู่ห่างเกิน 2 เมตรหลังฉากกั้นรังสีแบบเคลื่อนที่ ซึ่งปลอดภัยที่สุด หรือหลบหลังฉากกั้นข้างเตียง",
      },
    },
    {
      // five cards across the top, the picture centred under them
      heading: "อุปกรณ์ป้องกันรังสีส่วนบุคคล",
      centerHeading: true,
      round: true,
      cols: 5,
      image: {
        src: "/pages/ppe.webp",
        alt: "ผู้สวมอุปกรณ์ป้องกันรังสี: หมวก แว่นตา ปลอกคอ เสื้อ กระโปรง และถุงมือกันรังสี และฉากกั้นรังสีแบบตั้งพื้นมีช่องมอง",
      },
      imageBelow: true,
      points: [
        { th: "หมวกป้องกันรังสี", en: "Lead caps" },
        { th: "แว่นตากันรังสี", en: "Lead glasses" },
        { th: "ถุงมือกันรังสี", en: "Lead gloves" },
        { th: "ชุดป้องกันรังสี", en: "Lead apron" },
        { th: "ฉากป้องกันรังสี", en: "Lead shield" },
      ],
    },
    {
      heading: "ชุดป้องกันรังสี",
      // two set lines; the word joiner keeps "97–99%" from breaking at the dash
      key: "ความหนาของชุดตะกั่ว 0.50 mm Pb\nมาตรฐานความปลอดภัยสูง ป้องกันรังสีได้ > 97–⁠99%",
      points: [
        {
          th: "Standard lead",
          en: "เกรดตะกั่วบริสุทธิ์ดั้งเดิม",
          desc: "ป้องกันรังสีได้สูงสุดในราคาประหยัดที่สุด แต่น้ำหนักมากที่สุด (ประมาณ 5–7 กก. ต่อชุด)",
        },
        { th: "Lightweight lead", en: "เกรดตะกั่วผสมโลหะหนักชนิดอื่น เช่น Bismuth", desc: "เบากว่าเกรด Standard ประมาณ 10–15% โดยยังคงค่า Lead equivalent เท่าเดิม" },
        {
          th: "Lead-free",
          en: "เกรดไร้ตะกั่ว / Eco-friendly",
          desc: "ไม่มีตะกั่วเลย แต่จะใช้โลหะหนักอื่นๆ แทน เช่น Bismuth Antimony Tungsten เป็นต้น น้ำหนักเบาที่สุด ลดน้ำหนักได้ถึง 20–⁠30% เป็นมิตรต่อสิ่งแวดล้อม และกำจัดได้ง่ายกว่าเมื่อหมดอายุใช้งาน",
        },
      ],
    },
    {
      heading: "Dosimeter",
      lead: "เครื่องวัดรังสีส่วนบุคคลที่ทุกคนในหน่วยงาน เพื่อวัดค่าปริมาณรังสีที่ได้รับในแต่ละปี",
      points: [
        {
          th: "Electronic dosimeter",
          en: "Personal digital / electronic dosimeter (EPD)",
          desc: "แสดงผลปริมาณรังสีแบบเรียลไทม์ผ่านหน้าจอดิจิทัล มีเสียงเตือนทันทีเมื่อได้รับรังสีเกินค่าที่กำหนด",
        },
        {
          th: "TLD",
          en: "Thermoluminescent dosimeter",
          desc: "อุปกรณ์ขนาดเล็ก ติดบริเวณหน้าอกหรือข้อมือ บันทึกค่ารังสีสะสมแล้วส่งห้องปฏิบัติการอ่านค่า อ่านค่าซ้ำไม่ได้",
        },
        {
          th: "Film badge / OSL",
          en: "Optically stimulated luminescence",
          desc: "แผ่นติดเสื้อ ประเมินปริมาณรังสีสะสมระยะยาว เครื่องอ่านใช้แสงสีเขียวหรือเลเซอร์กระตุ้นผลึก ให้ปล่อยแสงสีน้ำเงินตามปริมาณรังสีที่ได้รับ อ่านค่าซ้ำได้",
        },
      ],
      key: "หน่วยงานส่วนใหญ่ใช้\nOSL เป็นหลัก",
      side: {
        src: "/pages/dosimeters.webp",
        alt: "ตัวอย่างเครื่องวัดรังสีส่วนบุคคล: TLD แผ่นวัดรังสีแบบติดเสื้อ และเครื่องวัดรังสีแบบอิเล็กทรอนิกส์สีฟ้าและสีชมพู",
      },
    },
    {
      heading: "ตำแหน่งการติด OSL dosimeter",
      centerHeading: true,
      image: {
        src: "/pages/osl-placement.webp",
        alt: "สำหรับเจ้าหน้าที่ที่ใช้แผ่นวัดรังสี 2 แผ่น แผ่นที่ 1 ควรติดด้านนอกปลอกคอกำบังรังสี แผ่นที่ 2 ติดด้านในเสื้อกำบังรังสี",
      },
      imageMax: 70,
    },
  ],

  // the limits, just before the question on a pregnant colleague
  s09a: [
    {
      heading: "ค่ากำหนดปริมาณรังสี (Dose Limits)",
      scale: 1.5,
      table: {
        head: ["ประเภทของขีดจำกัด", "ผู้ปฏิบัติงานทางรังสี", "ประชาชนทั่วไป"],
        rows: [
          ["ปริมาณรังสียังผล (Effective dose)", "20 mSv/ปี เฉลี่ยในระยะเวลาต่อเนื่อง 5 ปี และในปีใดปีหนึ่งต้องไม่เกิน 50 mSv", "1 mSv/ปี"],
          ["ปริมาณรังสีสมมูลต่อปี: เลนส์ตา", "20 mSv/ปี", "15 mSv/ปี"],
          ["ปริมาณรังสีสมมูลต่อปี: ผิวหนัง มือ และเท้า", "500 mSv/ปี", "50 mSv/ปี"],
          ["หญิงตั้งครรภ์ (ต่อทารกในครรภ์ ตลอดช่วงที่เหลือของการตั้งครรภ์)", "1 mSv", "–"],
        ],
      },
      note: "ที่มา: ICRP, Radiation and your patient: A guide for medical practitioners (icrp.org/docs/rad_for_gp_for_web.pdf)",
    },
  ],

  s10: [
    {
      heading: "แนวทางปฏิบัติเมื่อผู้ปฏิบัติงานทางรังสีตั้งครรภ์",
      scale: 1.4,
      points: [
        { th: "แจ้งผู้บังคับบัญชารับทราบ" },
        { th: "ประเมินความเสี่ยงการได้รับรังสี และปรับเปลี่ยนการปฏิบัติงาน" },
        { th: "ติดเครื่องตรวจวัดปริมาณรังสีบริเวณท้อง" },
      ],
    },
    {
      heading: "มาตรฐานของห้องปฏิบัติการทางรังสี",
      // four cards across the top, the cut-away room centred under them
      cols: 4,
      round: true,
      points: [{ th: "ประตูห้อง" }, { th: "เพดานห้อง" }, { th: "ฉากกำบังรังสี" }, { th: "สัญญาณไฟสีแดง และป้ายเตือน" }],
      image: {
        src: "/pages/xray-room.webp",
        alt: "ภาพตัดห้องเอกซเรย์: ผนัง ประตู และเพดานบุแผ่นตะกั่วหนา 1.5–2.0 มม. รอยต่อซ้อนกันอย่างน้อย 1.5 ซม. ห้องควบคุมมีกระจกตะกั่วดูภายในห้อง หน้าห้องมีไฟสีแดงและป้ายเตือนรังสีและหญิงตั้งครรภ์"
      },
      imageBelow: true,
    },
  ],

  s11: [
    {
      heading: "Fluoroscopy time",
      points: [
        {
          th: "การบันทึกข้อมูล",
          en: "Documentation",
          desc: "พยาบาล Circulating บันทึกค่าที่เครื่องแสดง ได้แก่ เวลาที่ใช้ฉายรังสี (Fluoroscopy time)",
        },
        {
          th: "การเตือนแพทย์",
          en: "Notification",
          desc: "เมื่อ Fluoroscopy time ถึง 30 นาที และทุก 15 นาทีหลังจากนั้นหรือถี่กว่า เพื่อลดความเสี่ยงผิวหนังไหม้จากรังสี (Radiation dermatitis)",
        },
        {
          th: "ใช้ข้อมูลเพื่อความปลอดภัย",
          en: "Safety culture",
          desc: "ช่วยวางแผนจัดคนเข้าเคสที่ใช้รังสีมาก และช่วยอธิบายผล Dosimeter รายบุคคล",
        },
      ],
    },
    {
      heading: "การจัดเก็บอุปกรณ์ป้องกันรังสีอย่างถูกวิธี",
      points: [
        { th: "ใช้ที่แขวนเฉพาะ", desc: "แขวนเสื้อตะกั่วและฉากป้องกันบนที่แขวนที่ออกแบบมาโดยเฉพาะซึ่งมีความแข็งแรง" },
        {
          th: "ห้ามพับหรือพับทบ",
          desc: "ห้ามพับ หักงอ หรือกองไว้กับพื้นหรือโต๊ะ แผ่นตะกั่วด้านในจะแตกร้าว (Cracking) หรือปริขาด ทำให้รังสีรั่วผ่านรอยแตกได้",
        },
        { th: "จัดเก็บในสถานที่เหมาะสม", desc: "แขวนในบริเวณที่อากาศถ่ายเทสะดวก แห้ง หลีกเลี่ยงความร้อนสูงหรือแสงแดดจัดโดยตรง" },
      ],
    },
    {
      heading: "การทำความสะอาดและฆ่าเชื้อ",
      points: [
        { th: "น้ำสบู่เจือจาง หรือสารทำความสะอาดชนิดอ่อน", en: "Mild detergent", desc: "เช็ดคราบสกปรก คราบเหงื่อ หรือฝุ่นทั่วไปประจำวัน" },
        {
          th: "น้ำยาฆ่าเชื้อระดับกลางทางการแพทย์",
          en: "Medical-grade disinfectants",
        },
        { th: "ห้ามแช่น้ำ ซักเครื่อง หรือเข้าเครื่องอบความร้อน", en: "Autoclave", desc: "ความร้อนและความชื้นสะสมทำให้เนื้อตะกั่วภายในแตกร้าวหรือเสื่อมสภาพ" },
        { th: "หลังทำความสะอาด", desc: "พื้นผิวต้องแห้ง สะอาด ไม่มีคราบน้ำยาตกค้าง และไม่มีรอยแตกร้าวบนผิวไวนิลด้านนอก" },
      ],
    },
    {
      heading: "การดูแลรักษาเครื่อง C-arm",
      points: [
        {
          th: "บำรุงรักษาตามกำหนด",
          desc: "บำรุงรักษาตามกำหนดการโดยวิศวกรผู้เชี่ยวชาญ\nผู้ที่ได้รับอนุญาตจาก Philips Healthcare หรือผู้ผลิต",
        },
        {
          th: "งดใช้งานเมื่อพบความผิดปกติ",
          desc: "หากเครื่องหรือระบบชำรุด เสียหาย หรือสงสัยว่ามีความผิดปกติ ห้ามใช้งานจนกว่าจะซ่อมแซมเรียบร้อย",
        },
      ],
    },
    {
      heading: "ข้อมูลอ้างอิง",
      centerHeading: true,
      covers: [
        { src: "/pages/refs/aorn-guideline-first-look.webp", title: "Guideline for radiation safety", source: "AORN · Periop Briefing 2021 · doi 10.1002/aorn.13334" },
        { src: "/pages/refs/aorn-quick-view.webp", title: "Guideline Quick View: Radiation Safety", source: "AORN Journal 2021;113(5) · doi 10.1002/aorn.13402" },
        { src: "/pages/refs/dmsc-lab-safety-2567.webp", title: "คู่มือความปลอดภัยทางห้องปฏิบัติการด้านรังสี", source: "กรมวิทยาศาสตร์การแพทย์ กระทรวงสาธารณสุข · พ.ศ. 2567" },
        { src: "/pages/refs/dmsc-xray-protection-2566.webp", title: "การป้องกันอันตรายจากเครื่องกำเนิดรังสีเอกซ์ทางการแพทย์", source: "สำนักรังสีและเครื่องมือแพทย์ กรมวิทยาศาสตร์การแพทย์ · พ.ศ. 2566" },
        { src: "/pages/refs/mahidol-radiation-safety.webp", title: "แนวปฏิบัติเพื่อความปลอดภัยทางรังสี", source: "ศูนย์บริหารความปลอดภัย อาชีวอนามัยและสิ่งแวดล้อม (COSHEM) มหาวิทยาลัยมหิดล" },
      ],
    },
  ],
};

export const pagesFor = (sceneId: string): Page[] => PAGES[sceneId] ?? [];

/** A heading alone is a topic page: it shows as a section title, without the slide's title above it. */
export const isTopic = (page: Page | undefined): boolean =>
  !!page && !page.lead && !page.points && !page.table && !page.note && !page.figure && !page.image && !page.after && !page.key && !page.covers;

/** How many rows each row's first cell spans, so a label repeated on consecutive rows shows once, as on the deck (0 = covered by the row above). */
export const firstCellSpans = (rows: string[][]): number[] =>
  rows.map((row, r) => {
    if (r > 0 && rows[r - 1][0] === row[0]) return 0;
    let n = 1;
    while (rows[r + n]?.[0] === row[0]) n++;
    return n;
  });
