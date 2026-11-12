"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { paragraphSpans } from "@/lib/book/proseSegments";
import type { GoDeeperTerm } from "@/lib/book/types";
import { TermExplainer } from "./TermExplainer";

type Props = {
  body: string;
  terms?: GoDeeperTerm[];
  chapterTitle?: string;
  showSuggested?: boolean;
  munenoriOnline?: boolean;
  onRemoveTerm?: (termId: string) => void;
  isAuthor?: boolean;
};

export function ChapterReader({
  body,
  terms = [],
  chapterTitle = "",
  showSuggested = false,
  munenoriOnline = true,
  onRemoveTerm,
  isAuthor,
}: Props) {
  const blocks = parseBlocks(body);
  const [activeTerm, setActiveTerm] = useState<GoDeeperTerm | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!activeTerm || isMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTerm(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeTerm, isMobile]);

  return (
    <>
      <article className="book-prose book-font w-full px-8 py-10 sm:px-12 sm:py-12">
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
                  <li key={j}>
                    <InlineParagraph
                      text={item.text}
                      start={item.start}
                      terms={terms}
                      showSuggested={showSuggested}
                      onTerm={(t) => setActiveTerm(t)}
                    />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={i}>
              <InlineParagraph
                text={block.text}
                start={block.start}
                terms={terms}
                showSuggested={showSuggested}
                onTerm={(t) => setActiveTerm(t)}
              />
            </p>
          );
        })}
      </article>

      {activeTerm && !isMobile && (
        <div
          className="book-term-popover fixed z-50 w-80 rounded-lg shadow-lg"
          style={{
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--book-page)",
            border: "1px solid var(--book-border)",
          }}
          data-testid="term-popover"
        >
          <TermExplainer
            term={activeTerm}
            chapterTitle={chapterTitle}
            chapterBody={body}
            munenoriOnline={munenoriOnline}
            onClose={() => setActiveTerm(null)}
            onRemove={onRemoveTerm ? () => onRemoveTerm(activeTerm.id) : undefined}
            isAuthor={isAuthor}
          />
        </div>
      )}

      {activeTerm && isMobile && (
        <Sheet open onClose={() => setActiveTerm(null)} title={activeTerm.term}>
          <TermExplainer
            term={activeTerm}
            chapterTitle={chapterTitle}
            chapterBody={body}
            munenoriOnline={munenoriOnline}
            onClose={() => setActiveTerm(null)}
            onRemove={onRemoveTerm ? () => onRemoveTerm(activeTerm.id) : undefined}
            isAuthor={isAuthor}
          />
        </Sheet>
      )}
    </>
  );
}

function InlineParagraph({
  text,
  start,
  terms,
  showSuggested,
  onTerm,
}: {
  text: string;
  start: number;
  terms: GoDeeperTerm[];
  showSuggested: boolean;
  onTerm: (t: GoDeeperTerm) => void;
}) {
  const spans = paragraphSpans(text, start, terms, showSuggested);
  return (
    <>
      {spans.map((span, i) => {
        if (span.kind === "text") return <span key={i}>{span.text}</span>;
        if (span.kind === "bold") return <strong key={i}>{span.text}</strong>;
        if (span.kind === "italic") return <em key={i}>{span.text}</em>;
        const term = terms.find((t) => t.id === span.termId);
        if (!term) return <span key={i}>{span.text}</span>;
        return (
          <button
            key={i}
            type="button"
            className={`book-term${span.suggested ? " book-term--suggested" : ""}`}
            onClick={() => onTerm(term)}
          >
            {span.text}
          </button>
        );
      })}
    </>
  );
}

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string; start: number }
  | { type: "code"; text: string }
  | { type: "ul"; items: { text: string; start: number }[] };

function parseBlocks(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let offset = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineStart = offset;

    if (trimmed.startsWith("```")) {
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        offset += lines[i].length + 1;
        i++;
      }
      if (i < lines.length) {
        offset += lines[i].length + 1;
        i++;
      }
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      offset += line.length + 1;
      i++;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: { text: string; start: number }[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        const itemText = lines[i].trim().slice(2);
        items.push({ text: itemText, start: offset + lines[i].indexOf(itemText) });
        offset += lines[i].length + 1;
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (trimmed === "") {
      offset += line.length + 1;
      i++;
      continue;
    }

    const paraStart = lineStart + line.indexOf(trimmed);
    const paraLines: string[] = [trimmed];
    offset += line.length + 1;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (next === "" || next.startsWith("## ") || next.startsWith("- ") || next.startsWith("```")) break;
      paraLines.push(next);
      offset += lines[i].length + 1;
      i++;
    }
    blocks.push({ type: "p", text: paraLines.join(" "), start: paraStart });
  }

  return blocks;
}
