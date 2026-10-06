import { Fragment } from "react";
import { firstCellSpans, isTopic, type Page } from "@/lib/pages";
import { JOURNEY_SHOT, JourneyCaption, RadiationJourney } from "@/components/RadiationJourney";
import { SpinningModel } from "@/components/SpinningModel";
import { JourneyBeep } from "@/components/JourneyBeep";
import { FitBox } from "@/components/FitBox";

/** How much larger a page may draw when it has room to spare, unless it sets its own `scale`. */
const GROW = 1.4;

/** The page's heading: the title of the screen, in amber at the top. */
const Heading = ({ text }: { text: string }) => <p className="font-display text-[4.2cqw] font-bold leading-tight text-amber">{text}</p>;

/** One lecture page on the projector. Sized in cqw/cqh: on the main screen there is no size container, so they
 * mean the screen (same as vw/vh); the phone slides view puts each page in a 16:9 frame that is one. */
export function LecturePage({ page, lite }: { page: Page; lite?: boolean }) {
  if (page.figure === "radiation-journey") return <JourneyPage page={page} lite={lite} />;
  if (page.figure === "carm-3d") return <ModelPage page={page} lite={lite} />;
  if (page.acronym) return <AcronymPage page={page} />;
  if (isTopic(page)) return <TopicPage page={page} />;
  const pts = page.points ?? [];
  // One card per row unless the page asks for more.
  const cols = page.cols ?? 1;
  const detailed = pts.some((p) => p.desc);
  const named = pts.some((p) => p.en);
  // round cards whose items carry a paragraph (not a one-line note) read from the top
  const long = pts.some((p) => (p.desc?.length ?? 0) > 60);
  // one card per row: room for larger text
  const wide = cols === 1;
  // Each card spans one row of the list per line it has (title, English name, description), shared across the
  // cards, so cards side by side line up line by line even when one wraps more than another.
  const lines = 1 + (named ? 1 : 0) + (detailed ? 1 : 0);
  const spans = firstCellSpans(page.table?.rows ?? []);
  // which label group each row belongs to (a row whose label is merged into the one above joins its group)
  const groups = spans.reduce<number[]>((g, s, r) => [...g, r === 0 ? 0 : g[r - 1] + (s === 0 ? 0 : 1)], []);
  // short row labels stay on one line, so the other columns take the wrapping
  const image = page.image && (
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
    <img
      src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${page.image.src}`}
      alt={page.image.alt}
      className={`mx-auto w-auto max-w-full rounded-2xl bg-white object-contain ${page.imageBelow ? "max-h-[52cqh]" : "max-h-[62cqh]"}`}
      style={page.imageMax ? { maxHeight: `${page.imageMax}cqh` } : undefined}
    />
  );
  const cards = pts.length === 0 ? null : page.round || wide || page.figure === "radiation-ap" ? (
    // items beside a round number in equal-height cards: short ones centred, ones with a paragraph read from the top
    <ol className="grid gap-[1.4cqw]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {pts.map((pt, i) => (
        <li
          key={pt.th}
          className={`flex gap-[1.2cqw] rounded-2xl border border-line bg-night-2 px-[1.6cqw] ${wide ? "py-[1.4cqh]" : "py-[2cqh]"} ${long ? "items-start" : "items-center"}`}
        >
          <span className="grid aspect-square w-[3.2cqw] shrink-0 place-items-center rounded-full bg-amber font-display text-[1.7cqw] font-bold text-ink">
            {i + 1}
          </span>
          <span className="flex min-w-0 flex-col gap-[0.5cqh]">
            {/* a card across the screen has room for the English name beside the title, which saves it a line */}
            <span className={wide ? "flex flex-wrap items-baseline gap-x-[1cqw]" : "contents"}>
              <span className={`font-display font-bold leading-snug [text-wrap:balance] ${cols >= 4 ? "text-[1.6cqw]" : wide ? "text-[2cqw]" : "text-[1.8cqw]"}`}>{pt.th}</span>
              {pt.en && <span className={`leading-snug text-sky ${wide ? "text-[1.5cqw]" : "text-[1.3cqw]"}`}>{pt.en}</span>}
            </span>
            {pt.desc && (
              <span className={`whitespace-pre-line leading-snug ${wide ? "text-[1.7cqw]" : "text-[1.4cqw]"} ${long ? "mt-[0.6cqh] text-paper" : "text-mist"}`}>{pt.desc}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  ) : (
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
  );
  const keyMessage =
    page.key &&
    (page.keyApart ? (
      // each line its own smaller box, one under the other
      <div className="flex flex-col items-start gap-[1.2cqh]">
        {page.key.split("\n").map((line) => (
          <p key={line} className="rounded-2xl bg-amber px-[1.6cqw] py-[1cqh] font-display text-[1.6cqw] font-bold text-ink">
            {line}
          </p>
        ))}
      </div>
    ) : (
      <p className="w-fit rounded-2xl bg-amber px-[2cqw] py-[1.4cqh] font-display text-[2.2cqw] font-bold whitespace-pre-line text-ink">{page.key}</p>
    ));
  const shortLabels = (page.table?.rows ?? []).every((row) => row[0].length <= 15);
  return (
    <>
      {page.heading && <Heading text={page.heading} />}
      {/* everything under the heading grows into the room left, or shrinks until it fits */}
      <FitBox of={page} cap={page.scale ?? GROW} className="flex flex-col gap-[2.4cqh]">
        {page.lead && <p className="text-[1.7cqw] leading-relaxed">{page.lead}</p>}
        {!page.imageBelow && image}
        {page.side ? (
          // the cards on the left; the picture beside them on the right, the key message under it
          <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center gap-[2.4cqw]">
            {cards}
            <div className="flex flex-col items-start gap-[3cqh]">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${page.side.src}`} alt={page.side.alt} className="w-full rounded-2xl" />
              {keyMessage}
            </div>
          </div>
        ) : (
          cards
        )}
        {page.imageBelow && image}
        {page.figure === "radiation-ap" && (
          <div className="flex justify-center">
            <RadiationJourney still style={{ height: "54cqh" }} />
          </div>
        )}
        {page.after && <p className="text-[1.35cqw] leading-relaxed text-mist">{page.after}</p>}
        {page.table && (
          // framed, with an amber header row; rows sharing a label are shaded as one group, alternate groups darker
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full border-collapse text-[1.4cqw] leading-snug">
              <thead>
                <tr className="bg-amber text-ink">
                  {page.table.head.map((h, i) => (
                    <th key={i} className="px-[1.2cqw] py-[1.2cqh] text-left font-display font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.table.rows.map((row, r) => (
                  <tr key={r} className={`border-t border-line ${groups[r] % 2 ? "bg-night-2" : "bg-night-2/40"}`}>
                    {row.map((cell, c) =>
                      c === 0 && spans[r] === 0 ? null : (
                        <td
                          key={c}
                          rowSpan={c === 0 && spans[r] > 1 ? spans[r] : undefined}
                          className={`px-[1.2cqw] py-[1.2cqh] align-top ${c === 0 ? `font-semibold text-amber ${shortLabels ? "whitespace-nowrap" : ""}` : ""}`}
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {page.units && (
          // what the units in the table mean: the unit, what it measures, where it is used
          <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1.3fr)] gap-x-[1.6cqw] gap-y-[1cqh] rounded-2xl border border-line bg-night-2 px-[1.6cqw] py-[1.6cqh] text-[1.3cqw] leading-snug">
            {page.units.map(([unit, measures, use]) => (
              <Fragment key={unit}>
                <span className="font-display font-bold text-amber">{unit}</span>
                <span>{measures}</span>
                <span className="text-mist">{use}</span>
              </Fragment>
            ))}
          </div>
        )}
        {page.note && <p className="text-[1.4cqw] font-semibold text-sky">{page.note}</p>}
        {!page.side && keyMessage && <div className="mt-[3cqh]">{keyMessage}</div>}
      </FitBox>
    </>
  );
}

/** A heading alone: a section title, large in the middle of the screen. */
function TopicPage({ page }: { page: Page }) {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <p className="text-center font-display text-[4.5cqw] font-bold leading-tight text-amber">{page.heading}</p>
    </div>
  );
}

/** An acronym set large in a frame with its words spelled out under it; below, the heading beside the lead in a box. */
function AcronymPage({ page }: { page: Page }) {
  const { word, full } = page.acronym!;
  return (
    <FitBox of={page} cap={GROW} className="flex flex-col items-center gap-[2cqh]">
      <p className="rounded-2xl border-2 border-amber/70 px-[5cqw] py-[0.6cqh] font-display text-[7cqw] font-bold leading-tight tracking-[0.08em] text-amber">{word}</p>
      <p className="font-display text-[1.7cqw] font-bold uppercase tracking-[0.12em] text-mist">{full}</p>
      <div className="mt-[3cqh] flex w-full items-center gap-[3cqw]">
        {page.heading && <p className="shrink-0 font-display text-[4.2cqw] font-bold leading-tight">{page.heading}</p>}
        {page.lead && <p className="min-w-0 flex-1 rounded-2xl border border-line bg-night-2 px-[2.4cqw] py-[2.4cqh] text-[1.9cqw] leading-relaxed">{page.lead}</p>}
      </div>
    </FitBox>
  );
}

/** A heading at the top and the 3D C-arm turning by itself in the space under it. */
function ModelPage({ page, lite }: { page: Page; lite?: boolean }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-[2.5cqh]">
      <Heading text={page.heading} />
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-line">
        <SpinningModel lite={lite} />
      </div>
    </div>
  );
}

/** The diagram on the left plays the loop; the point of the step it is on lights up on the right. */
function JourneyPage({ page, lite }: { page: Page; lite?: boolean }) {
  const pts = page.points ?? [];
  // Steps start 12.5% into each exposure (after the C-arm turns) and last 19.5% of it.
  const start = (i: number) => JOURNEY_SHOT * (0.125 + i * 0.195) - JOURNEY_SHOT;
  return (
    // On the projector the loop is the lesson, so it plays even under reduced motion; phones keep the viewer's setting.
    <>
      <Heading text={page.heading} />
      <FitBox of={page} cap={1} className={`flex flex-col gap-[2cqh] ${lite ? "" : "motion-demo"}`}>
        {/* the exposure beep, on the projector only */}
        {!lite && <JourneyBeep />}
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
      </FitBox>
    </>
  );
}
