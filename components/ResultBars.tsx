import type { Question } from "@/lib/questions";
import type { Summary } from "@/lib/transport";

/** Answer distribution; the correct choice is marked in words as well as color. */
export function ResultBars({
  question,
  summary,
  showCorrect,
  size = "md",
}: {
  question: Question;
  summary: Summary | null;
  showCorrect: boolean;
  size?: "md" | "xl";
}) {
  const counts = summary?.counts ?? {};
  const total = summary?.respondents ?? 0;
  const text = size === "xl" ? "text-[1.6vw]" : "text-sm";
  const bar = size === "xl" ? "h-[2.4vh]" : "h-2.5";
  return (
    <ul className={`flex flex-col ${size === "xl" ? "gap-[1.4vh]" : "gap-2"}`}>
      {question.choices.map((c) => {
        const n = counts[c.id] ?? 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        const correct = showCorrect && question.correct.includes(c.id);
        return (
          <li key={c.id} className={`flex flex-col gap-1 ${text}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={correct ? "font-semibold text-ok" : ""}>
                {c.label}
                {correct && " · ถูกต้อง"}
              </span>
              <span className="tabular-nums text-mist">
                {n} คน · {pct}%
              </span>
            </div>
            <div className={`${bar} overflow-hidden rounded-full bg-line`}>
              <div className={`h-full rounded-full ${correct ? "bg-ok" : "bg-sky"}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
