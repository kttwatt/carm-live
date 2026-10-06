import type { Metadata } from "next";
import { firstCellSpans, pagesFor, type Page } from "@/lib/pages";
import { SCENES, isInteractive } from "@/lib/scenes";
import { RadiationJourney } from "@/components/RadiationJourney";

// Read-only copy of the lecture for phones: every slide's content in deck order, no room code needed.
export const metadata: Metadata = { title: "เนื้อหาสไลด์ · C-Arm Radiation Safety" };

const OUTLINE = SCENES.find((s) => s.kind === "outline");
const SLIDES = SCENES.filter((s) => s.slide != null);

function Section({ page }: { page: Page }) {
  const spans = firstCellSpans(page.table?.rows ?? []);
  return (
    <section className="flex flex-col gap-3">
      {page.heading && <h3 className="font-display text-xl font-bold leading-snug text-amber">{page.heading}</h3>}
      {page.lead && <p className="leading-relaxed">{page.lead}</p>}
      {page.figure === "radiation-journey" && <RadiationJourney className="mx-auto w-full max-w-sm" />}
      {page.image && (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${page.image.src}`}
          alt={page.image.alt}
          className="w-full rounded-xl bg-white"
        />
      )}
      {page.points && page.points.length > 0 && (
        <ol className="flex flex-col gap-2">
          {page.points.map((pt, i) => (
            <li key={pt.th} className="flex gap-3 rounded-xl border border-line bg-night-2 px-4 py-3">
              <span className="font-display font-bold tabular-nums text-amber">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="font-semibold">{pt.th}</span>
                {pt.en && <span className="text-sm text-mist">{pt.en}</span>}
                {pt.desc && <span className="leading-snug">{pt.desc}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {page.table && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm leading-snug">
            <thead>
              <tr>
                {page.table.head.map((h, i) => (
                  <th key={i} className="border-b-2 border-amber px-2 py-2 text-left font-display font-bold text-amber">
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
                        className={`px-2 py-2 align-top ${c === 0 ? "border-b border-line font-semibold" : ""}`}
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
      {page.note && <p className="text-sm font-semibold text-sky">{page.note}</p>}
    </section>
  );
}

export default function Slides() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-widest text-amber">C-ARM RADIATION SAFETY</p>
        <h1 className="font-display text-3xl font-bold leading-tight">{SCENES[0].title}</h1>
      </header>

      {OUTLINE?.items && (
        <nav className="flex flex-col gap-3 rounded-2xl border border-line p-5">
          <h2 className="font-display text-xl font-bold">{OUTLINE.title}</h2>
          <ol className="list-decimal space-y-1 pl-6">
            {OUTLINE.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <h2 className="mt-3 font-display text-lg font-bold">สไลด์</h2>
          <ol className="space-y-1">
            {SLIDES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sky underline-offset-4 hover:underline">
                  {s.slide}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {SLIDES.map((s) => {
        const pages = pagesFor(s.id);
        return (
          <article key={s.id} id={s.id} className="flex scroll-mt-4 flex-col gap-6 border-t border-line pt-8">
            <header className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-mist">สไลด์ {s.slide}</p>
              <h2 className="font-display text-2xl font-bold leading-snug">{s.title}</h2>
            </header>
            {pages.map((p, i) => (
              <Section key={i} page={p} />
            ))}
            {isInteractive(s.kind) && s.activity && (
              <p className="rounded-xl border border-dashed border-line px-4 py-3 text-mist">กิจกรรม: {s.activity}</p>
            )}
          </article>
        );
      })}
    </main>
  );
}
