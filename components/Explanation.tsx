/**
 * An answer's explanation. Lines starting with "* " become a bulleted list;
 * text between ==…== sits on its own line in a yellow box (the key line of the answer).
 */
export function Explanation({ text }: { text: string }) {
  // Group consecutive "* " lines into one list.
  const blocks: (string | string[])[] = [];
  for (const line of text.split("\n")) {
    const item = line.match(/^\*\s+(.*)$/)?.[1];
    if (item == null) blocks.push(line);
    else if (Array.isArray(blocks.at(-1))) (blocks.at(-1) as string[]).push(item);
    else blocks.push([item]);
  }
  return (
    <>
      {blocks.map((b, i) =>
        Array.isArray(b) ? (
          <ul key={i} className="my-[0.3em] list-disc pl-[1.2em]">
            {b.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          // each line of plain text is its own line on screen
          <span key={i} className="block">
            {b.split(/==(.+?)==/g).map((part, j) =>
              j % 2 ? (
                <mark key={j} className="mt-[0.5em] block w-fit rounded-xl bg-amber px-[0.6em] py-[0.15em] font-semibold text-ink">
                  {part}
                </mark>
              ) : (
                part
              ),
            )}
          </span>
        ),
      )}
    </>
  );
}
