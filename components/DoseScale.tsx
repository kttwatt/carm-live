// A ruler of doses in mGy where each step is ten times the one before, so a dose from one minute of fluoroscopy and
// the threshold for permanent sterility fit on one line: what people get per exposure (sky dots) above, the
// thresholds from the "ผลของรังสีต่อมนุษย์" table (coral) below. The gap between the two groups is the lesson.

const EXPOSED = "#5cc3e6";
const EFFECT = "#f08a5d";
const TICKS = [0.01, 0.1, 1, 10, 100, 1000, 10000];

/** where a dose sits along the ruler, in % (0.01 at the left end, 10,000 at the right) */
const at = (mGy: number) => ((Math.log10(mGy) + 2) / 6) * 100;

type Row = { who: string; what: string; from: number; to?: number; label: string };

const PER_EXPOSURE: Row[] = [
  { who: "เจ้าหน้าที่ ห่าง 1 เมตร", what: "ฉาย C-arm 1 นาที", from: 0.02, label: "0.02" },
  { who: "ผู้ป่วย", what: "เอกซเรย์ปอด 1 ครั้ง", from: 0.2, label: "0.2" },
  { who: "ผู้ป่วย", what: "ฉาย C-arm 1 นาที (ผิวหนัง)", from: 20, label: "10–30" },
];

const THRESHOLDS: Row[] = [
  { who: "อัณฑะ", what: "เป็นหมันชั่วคราว", from: 150, label: "150" },
  { who: "เลนส์ตา", what: "ต้อกระจก (สะสมได้)", from: 500, label: "500" },
  { who: "ทั่วร่างกาย", what: "ป่วยจากรังสีเฉียบพลัน", from: 1000, label: "1,000" },
  { who: "ผิวหนัง", what: "ผื่นแดง", from: 2000, label: "2,000" },
  { who: "รังไข่", what: "เป็นหมัน", from: 2500, to: 6000, label: "2,500–6,000" },
  { who: "อัณฑะ", what: "เป็นหมันถาวร", from: 3500, to: 6000, label: "3,500–6,000" },
];

function Rows({ rows, color }: { rows: Row[]; color: string }) {
  return rows.map((r) => {
    const end = at(r.to ?? r.from);
    // values near the right end sit to the left of their mark so they stay on the ruler
    const flip = end > 80;
    return (
      <div key={r.who + r.what} className="grid grid-cols-[27cqw_minmax(0,1fr)] items-center gap-[1.6cqw]">
        <p className="whitespace-nowrap leading-tight">
          <span className="font-display text-[1.6cqw] font-bold">{r.who}</span>
          <span className="ml-[0.7cqw] text-[1.4cqw] text-mist">{r.what}</span>
        </p>
        <div className="relative h-[4.6cqh] border-x border-line">
          <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
          {r.to ? (
            <span
              className="absolute top-1/2 h-[1.6cqh] -translate-y-1/2 rounded-full"
              style={{ left: `${at(r.from)}%`, width: `${end - at(r.from)}%`, background: color }}
            />
          ) : (
            <span
              className="absolute top-1/2 aspect-square w-[1.4cqw] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${end}%`, background: color }}
            />
          )}
          <span
            className="absolute top-1/2 whitespace-nowrap text-[1.4cqw] font-semibold tabular-nums"
            style={{
              left: `${flip ? at(r.from) : end}%`,
              transform: flip ? "translate(calc(-100% - 1cqw), -50%)" : "translate(1cqw, -50%)",
              color,
            }}
          >
            {r.label}
          </span>
        </div>
      </div>
    );
  });
}

export function DoseScale() {
  return (
    <div className="flex flex-col gap-[0.6cqh]" role="img" aria-label="ไม้บรรทัดปริมาณรังสี mGy แต่ละช่องมากกว่าช่องก่อนหน้า 10 เท่า: เจ้าหน้าที่ห่าง 1 เมตรโดนราว 0.02 ต่อการฉาย 1 นาที ผู้ป่วยเอกซเรย์ปอด 0.2 ผู้ป่วยฉาย C-arm 1 นาที 10–30 ส่วนขีดที่เริ่มเกิดผลอยู่ที่ 150 ขึ้นไป">
      {/* the scale along the top */}
      <div className="grid grid-cols-[27cqw_minmax(0,1fr)] gap-[1.6cqw]">
        <span />
        <div className="relative h-[2.8cqh] text-[1.3cqw] tabular-nums text-mist">
          {TICKS.map((t, i) => (
            <span
              key={t}
              className="absolute top-0"
              style={{ left: `${at(t)}%`, transform: i === 0 ? "none" : i === TICKS.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
            >
              {t.toLocaleString("en-US")}
            </span>
          ))}
        </div>
      </div>
      <p className="flex items-center gap-[0.8cqw] font-display text-[1.6cqw] font-bold">
        <span className="aspect-square w-[1cqw] rounded-full" style={{ background: EXPOSED }} />
        ที่โดนจริงต่อครั้ง (ค่าประมาณ)
      </p>
      <Rows rows={PER_EXPOSURE} color={EXPOSED} />
      <p className="mt-[2cqh] flex items-center gap-[0.8cqw] font-display text-[1.6cqw] font-bold">
        <span className="aspect-square w-[1cqw] rounded-full" style={{ background: EFFECT }} />
        ขีดที่เริ่มเกิดผลต่ออวัยวะ
      </p>
      <Rows rows={THRESHOLDS} color={EFFECT} />
      <div className="grid grid-cols-[27cqw_minmax(0,1fr)] gap-[1.6cqw]">
        <span />
        <p className="text-[1.2cqw] text-mist">mGy · แต่ละช่องมากกว่าช่องก่อนหน้า 10 เท่า</p>
      </div>
    </div>
  );
}
