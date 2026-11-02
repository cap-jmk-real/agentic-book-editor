"use client";

type Props = {
  body: string;
};

/** Lightweight markdown-ish renderer for chapter read mode (headings, fences, paragraphs). */
export function ChapterReader({ body }: Props) {
  const blocks = parseBlocks(body);

  return (
    <article className="book-prose w-full px-8 py-10 sm:px-12 sm:py-12">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return <h2 key={i}>{block.text}</h2>;
        }
        if (block.type === "code") {
          return (
            <pre key={i}>
              <code>{block.text}</code>
            </pre>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block.text}</p>;
      })}
    </article>
  );
}

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "code"; text: string }
  | { type: "ul"; items: string[] };

function parseBlocks(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "code", text: codeLines.join("\n").replace(/\n$/, "") });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      i++;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (trimmed === "") {
      i++;
      continue;
    }

    const paraLines: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        next === "" ||
        next.startsWith("## ") ||
        next.startsWith("- ") ||
        next.startsWith("```")
      ) {
        break;
      }
      paraLines.push(next);
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" ") });
  }

  return blocks;
}
