import type { GoDeeperTerm, TermRange } from "./types";

export type ProseSpan =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "term"; termId: string; text: string; suggested?: boolean };

type Mark = {
  start: number;
  end: number;
  kind: "term" | "bold" | "italic";
  termId?: string;
  suggested?: boolean;
};

export function paragraphSpans(
  paragraph: string,
  paragraphStart: number,
  terms: GoDeeperTerm[],
  showSuggested: boolean,
): ProseSpan[] {
  const marks: Mark[] = [];

  for (const term of terms) {
    if (term.status === "rejected") continue;
    if (term.status === "suggested" && !showSuggested) continue;
    for (const range of term.ranges) {
      if (range.end <= paragraphStart || range.start >= paragraphStart + paragraph.length) continue;
      const localStart = Math.max(0, range.start - paragraphStart);
      const localEnd = Math.min(paragraph.length, range.end - paragraphStart);
      marks.push({
        start: localStart,
        end: localEnd,
        kind: "term",
        termId: term.id,
        suggested: term.status === "suggested",
      });
    }
  }

  const emphasisPattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let em: RegExpExecArray | null;
  while ((em = emphasisPattern.exec(paragraph)) !== null) {
    const raw = em[0];
    const inner = raw.startsWith("**") ? raw.slice(2, -2) : raw.slice(1, -1);
    marks.push({
      start: em.index,
      end: em.index + raw.length,
      kind: raw.startsWith("**") ? "bold" : "italic",
    });
    void inner;
  }

  marks.sort((a, b) => a.start - b.start || b.end - a.end);

  const filtered: Mark[] = [];
  for (const m of marks) {
    const overlaps = filtered.some((f) => !(m.end <= f.start || m.start >= f.end));
    if (!overlaps) filtered.push(m);
  }

  const spans: ProseSpan[] = [];
  let cursor = 0;
  for (const m of filtered) {
    if (m.start > cursor) spans.push({ kind: "text", text: paragraph.slice(cursor, m.start) });
    const slice = paragraph.slice(m.start, m.end);
    if (m.kind === "term") {
      const text = slice;
      spans.push({
        kind: "term",
        termId: m.termId ?? "",
        text,
        suggested: m.suggested,
      });
    } else if (m.kind === "bold") {
      spans.push({ kind: "bold", text: slice.slice(2, -2) });
    } else {
      spans.push({ kind: "italic", text: slice.slice(1, -1) });
    }
    cursor = m.end;
  }
  if (cursor < paragraph.length) spans.push({ kind: "text", text: paragraph.slice(cursor) });
  if (spans.length === 0) spans.push({ kind: "text", text: paragraph });
  return spans;
}

export function blockStartOffsets(body: string, paragraphIndex: number, blocksBefore: string[]): number {
  let offset = 0;
  for (let i = 0; i < paragraphIndex; i++) {
    offset += blocksBefore[i].length + 1;
  }
  return offset;
}

/** Walk parse order and assign each paragraph its start offset in `body`. */
export function paragraphOffsets(body: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = body.split("\n");
  let i = 0;
  let offset = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
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
    if (trimmed.startsWith("## ") || trimmed.startsWith("- ") || trimmed === "") {
      offset += lines[i].length + 1;
      i++;
      continue;
    }
    const start = offset;
    const paraLines: string[] = [trimmed];
    offset += lines[i].length + 1;
    i++;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (next === "" || next.startsWith("## ") || next.startsWith("- ") || next.startsWith("```")) break;
      paraLines.push(next);
      offset += lines[i].length + 1;
      i++;
    }
    map.set(paraLines.join(" "), start);
  }
  return map;
}

export function surroundingParagraph(body: string, range: TermRange): string {
  const start = body.lastIndexOf("\n\n", range.start);
  const end = body.indexOf("\n\n", range.end);
  return body.slice(start === -1 ? 0 : start + 2, end === -1 ? body.length : end);
}
