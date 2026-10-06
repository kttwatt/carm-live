import type { Page } from "@/lib/pages";
import { JOURNEY_LOOP, RadiationJourney } from "@/components/RadiationJourney";

/** One lecture page on the projector, sized in vw like the rest of the main screen. */
export function LecturePage({ page, index, total }: { page: Page; index: number; total: number }) {
  if (page.figure === "radiation-journey") return <JourneyPage page={page} index={index} total={total} />;
  const pts = page.points ?? [];
  // Cards with a description need room: 4 sit 2×2, otherwise up to 3 per row.
  const cols = pts.length === 4 ? 2 : Math.min(pts.length, 3);
  const detailed = pts.some((p) => p.desc);
  return (
    <div className="flex max-w-[86vw] flex-col gap-[2.4vh]">
      <p className="font-display text-[2.4vw] font-bold leading-tight text-amber">{page.heading}</p>
      {page.lead && <p className="text-[1.7vw] leading-relaxed">{page.lead}</p>}
      {pts.length > 0 && (
        <ol className="grid gap-[1.4vw]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {pts.map((pt, i) => (
            <li key={pt.th} className="flex flex-col gap-[0.6vh] rounded-2xl border border-line bg-night-2 px-[1.5vw] py-[1.8vh]">
              <span className="flex items-baseline gap-[0.8vw]">
                <span className="font-display text-[1.5vw] font-bold tabular-nums text-amber">{i + 1}</span>
                <span className={`font-display font-bold leading-tight ${detailed ? "text-[1.8vw]" : "text-[2vw]"}`}>{pt.th}</span>
              </span>
              {pt.en && <span className="text-[1.25vw] text-mist">{pt.en}</span>}
              {pt.desc && <span className="text-[1.4vw] leading-snug">{pt.desc}</span>}
            </li>
          ))}
        </ol>
      )}
      {page.table && (
        <table className="w-full border-collapse text-[1.4vw] leading-snug">
          <thead>
            <tr>
              {page.table.head.map((h, i) => (
                <th key={i} className="border-b-2 border-amber px-[1vw] py-[1vh] text-left font-display font-bold text-amber">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.table.rows.map((row, r) => (
              <tr key={r} className="border-b border-line">
                {row.map((cell, c) => (
                  <td key={c} className={`px-[1vw] py-[1.2vh] align-top ${c === 0 ? "font-semibold" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {page.note && <p className="text-[1.4vw] font-semibold text-sky">{page.note}</p>}
      {total > 1 && <p className="absolute bottom-[3vh] right-[3vw] font-display text-[1.2vw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}

/** The diagram on the left plays the loop; the point of the step it is on lights up on the right. */
function JourneyPage({ page, index, total }: { page: Page; index: number; total: number }) {
  const pts = page.points ?? [];
  const step = JOURNEY_LOOP * 0.22;
  return (
    <div className="flex max-w-[86vw] flex-col gap-[2vh]">
      <p className="font-display text-[2.4vw] font-bold leading-tight text-amber">{page.heading}</p>
      {page.lead && <p className="text-[1.4vw] leading-relaxed text-mist">{page.lead}</p>}
      <div className="flex items-center gap-[3vw]">
        <RadiationJourney className="shrink-0" style={{ width: "min(58vh, 36vw)" }} />
        <ol className="flex min-w-0 flex-1 flex-col gap-[1.2vh]">
          {pts.map((pt, i) => (
            <li
              key={pt.th}
              className="flex items-baseline gap-[1vw] rounded-2xl border border-line bg-night-2 px-[1.3vw] py-[1.2vh]"
              style={{ animation: `rj-step ${JOURNEY_LOOP}s linear infinite`, animationDelay: `${i * step - JOURNEY_LOOP}s` }}
            >
              <span className="font-display text-[1.5vw] font-bold tabular-nums text-amber">{i + 1}</span>
              <span className="flex flex-col gap-[0.3vh]">
                <span className="font-display text-[1.6vw] font-bold leading-tight">{pt.th}</span>
                {pt.desc && <span className="text-[1.25vw] leading-snug">{pt.desc}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {total > 1 && <p className="absolute bottom-[3vh] right-[3vw] font-display text-[1.2vw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}
