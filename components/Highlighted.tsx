/** Renders text with ==…== parts on their own line in a yellow box (the key line of an answer). */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/==(.+?)==/g).map((part, i) =>
        i % 2 ? (
          <mark key={i} className="mt-[0.5em] block w-fit rounded-xl bg-amber px-[0.6em] py-[0.15em] font-semibold text-ink">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
