import { firstCellSpans, isTopic, type Page } from "@/lib/pages";
import { JOURNEY_SHOT, JourneyCaption, RadiationJourney } from "@/components/RadiationJourney";
import { SpinningModel } from "@/components/SpinningModel";
import { JourneyBeep } from "@/components/JourneyBeep";

/** One lecture page on the projector. Sized in cqw/cqh: on the main screen there is no size container, so they
 * mean the screen (same as vw/vh); the phone slides view puts each page in a 16:9 frame that is one. */
export function LecturePage({ page, index, total, lite }: { page: Page; index: number; total: number; lite?: boolean }) {
  if (page.figure === "radiation-journey") return <JourneyPage page={page} index={index} total={total} lite={lite} />;
  if (page.figure === "carm-3d") return <ModelPage page={page} index={index} total={total} lite={lite} />;
  if (isTopic(page)) return <TopicPage page={page} index={index} total={total} />;
  const pts = page.points ?? [];
  // Cards with a description need room: 4 sit 2×2, otherwise up to 3 per row.
  const cols = page.cols ?? (pts.length === 4 ? 2 : Math.min(pts.length, 3));
  const detailed = pts.some((p) => p.desc);
  const named = pts.some((p) => p.en);
  // Each card spans one row of the list per line it has (title, English name, description), shared across the
  // cards, so cards side by side line up line by line even when one wraps more than another.
  const lines = 1 + (named ? 1 : 0) + (detailed ? 1 : 0);
  const spans = firstCellSpans(page.table?.rows ?? []);
  return (
    // A scaled page zooms as a whole; its width limit shrinks to match so it still fits across.
    <div className="flex max-w-[86cqw] flex-col gap-[2.4cqh]" style={page.scale ? { zoom: page.scale, maxWidth: `${86 / page.scale}cqw` } : undefined}>
      {page.heading && (
        // Without the slide's title above, the heading stands in for it and looks like it.
        <p className={`font-display font-bold leading-tight ${page.noTitle ? "text-[3cqw]" : "text-[2.4cqw] text-amber"}`}>{page.heading}</p>
      )}
      {page.lead && <p className="text-[1.7cqw] leading-relaxed">{page.lead}</p>}
      {page.image && (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${page.image.src}`}
          alt={page.image.alt}
          className="mx-auto max-h-[62cqh] w-auto max-w-full rounded-2xl bg-white object-contain"
        />
      )}
      {pts.length > 0 && (
        <ol className="grid gap-[1.4cqw]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {pts.map((pt, i) => (
            <li
              key={pt.th}
              // the number sits in its own column, so the lines under the title start where the title does
              className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-subgrid content-start items-baseline gap-x-[0.8cqw] gap-y-[0.6cqh] rounded-2xl border border-line bg-night-2 px-[1.5cqw] py-[1.8cqh]"
              style={{ gridRow: `span ${lines}` }}
            >
              <span className="row-span-full font-display text-[1.5cqw] font-bold tabular-nums text-amber">{pt.label ?? i + 1}</span>
              <span className={`col-start-2 font-display font-bold leading-tight ${detailed ? "text-[1.8cqw]" : "text-[2cqw]"}`}>{pt.th}</span>
              {named && <span className="col-start-2 text-[1.25cqw] text-mist">{pt.en}</span>}
              {detailed && <span className="col-start-2 whitespace-pre-line text-[1.4cqw] leading-snug">{pt.desc}</span>}
            </li>
          ))}
        </ol>
      )}
      {page.figure === "radiation-ap" && (
        <div className="flex justify-center">
          <RadiationJourney still style={{ height: "54cqh" }} />
        </div>
      )}
      {page.after && <p className="text-[1.35cqw] leading-relaxed text-mist">{page.after}</p>}
      {page.table && (
        <table className="w-full border-collapse text-[1.4cqw] leading-snug">
          <thead>
            <tr>
              {page.table.head.map((h, i) => (
                <th key={i} className="border-b-2 border-amber px-[1cqw] py-[1cqh] text-left font-display font-bold text-amber">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.table.rows.map((row, r) => (
              <tr key={r} className="border-b border-line">
                {row.map((cell, c) =>
                  c === 0 && spans[r] === 0 ? null : (
                    <td
                      key={c}
                      rowSpan={c === 0 && spans[r] > 1 ? spans[r] : undefined}
                      className={`px-[1cqw] py-[1.2cqh] align-top ${c === 0 ? "border-b border-line font-semibold" : ""}`}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {page.note && <p className="text-[1.4cqw] font-semibold text-sky">{page.note}</p>}
      {page.key && (
        <p className="mt-[3cqh] w-fit rounded-2xl bg-amber px-[2cqw] py-[1.4cqh] font-display text-[2.2cqw] font-bold text-ink">{page.key}</p>
      )}
      {total > 1 && <p className="absolute bottom-[3cqh] right-[3cqw] font-display text-[1.2cqw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}

/** A heading alone: a section title, large in the middle of the screen. */
function TopicPage({ page, index, total }: { page: Page; index: number; total: number }) {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <p className="text-center font-display text-[4.5cqw] font-bold leading-tight text-amber">{page.heading}</p>
      {total > 1 && <p className="absolute bottom-[3cqh] right-[3cqw] font-display text-[1.2cqw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}

/** A heading at the top and the 3D C-arm turning by itself in the space under it. */
function ModelPage({ page, index, total, lite }: { page: Page; index: number; total: number; lite?: boolean }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-[2.5cqh]">
      <p className="text-center font-display text-[3.6cqw] font-bold leading-tight text-amber">{page.heading}</p>
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-line">
        <SpinningModel lite={lite} />
      </div>
      {total > 1 && <p className="absolute bottom-[3cqh] right-[3cqw] font-display text-[1.2cqw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}

/** The diagram on the left plays the loop; the point of the step it is on lights up on the right. */
function JourneyPage({ page, index, total, lite }: { page: Page; index: number; total: number; lite?: boolean }) {
  const pts = page.points ?? [];
  // Steps start 12.5% into each exposure (after the C-arm turns) and last 19.5% of it.
  const start = (i: number) => JOURNEY_SHOT * (0.125 + i * 0.195) - JOURNEY_SHOT;
  return (
    // On the projector the loop is the lesson, so it plays even under reduced motion; phones keep the viewer's setting.
    <div className={`flex max-w-[86cqw] flex-col gap-[2cqh] ${lite ? "" : "motion-demo"}`}>
      {/* the exposure beep, on the projector only */}
      {!lite && <JourneyBeep />}
      <p className={`font-display font-bold leading-tight text-amber ${page.noTitle ? "text-[3cqw]" : "text-[2.4cqw]"}`}>{page.heading}</p>
      {page.lead && <p className="text-[1.4cqw] leading-relaxed text-mist">{page.lead}</p>}
      <div className="flex items-center gap-[3cqw]">
        <RadiationJourney className="shrink-0" style={{ width: "min(70cqh, 42cqw)" }} />
        <ol className="flex min-w-0 flex-1 flex-col gap-[1.2cqh]">
          {pts.map((pt, i) => (
            <li
              key={pt.th}
              className="flex items-baseline gap-[1cqw] rounded-2xl border border-line bg-night-2 px-[1.3cqw] py-[1.2cqh]"
              style={{ animation: `rj-step ${JOURNEY_SHOT}s linear infinite`, animationDelay: `${start(i)}s` }}
            >
              <span className="font-display text-[1.5cqw] font-bold tabular-nums text-amber">{i + 1}</span>
              <span className="flex flex-col gap-[0.3cqh]">
                <span className="font-display text-[1.6cqw] font-bold leading-tight">{pt.th}</span>
                {pt.desc && <span className="text-[1.25cqw] leading-snug">{pt.desc}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
      {/* the position playing, large and centred under everything */}
      <JourneyCaption />
      {total > 1 && <p className="absolute bottom-[3cqh] right-[3cqw] font-display text-[1.2cqw] tabular-nums text-mist">{index + 1} / {total}</p>}
    </div>
  );
}
