import type { BookState, ChapterId, GoDeeperTerm, TermRange } from "./types";

export function normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isValidMarkSelection(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/);
  return words.length <= 8 && trimmed.length <= 80;
}

const WORD_EDGE = /[\w'`]/;

/** Scan chapter body for term occurrences outside fenced code blocks. */
export function findTermRanges(body: string, term: string): TermRange[] {
  const search = normalizeTerm(term);
  if (!search) return [];

  const ranges: TermRange[] = [];
  let inFence = false;
  let offset = 0;

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      offset += line.length + 1;
      continue;
    }
    if (!inFence) {
      const lower = line.toLowerCase();
      let idx = 0;
      while ((idx = lower.indexOf(search, idx)) !== -1) {
        const before = idx > 0 ? line[idx - 1] : " ";
        const after = idx + search.length < line.length ? line[idx + search.length] : " ";
        if (!WORD_EDGE.test(before) && !WORD_EDGE.test(after)) {
          ranges.push({ start: offset + idx, end: offset + idx + search.length });
        }
        idx += search.length;
      }
    }
    offset += line.length + 1;
  }
  return ranges;
}

export function recomputeTermRanges(terms: GoDeeperTerm[], chapterId: ChapterId, body: string): GoDeeperTerm[] {
  return terms.map((t) => {
    if (t.chapterId !== chapterId || t.status === "rejected") return t;
    return { ...t, ranges: findTermRanges(body, t.term) };
  });
}

export function chapterTerms(book: BookState, chapterId: ChapterId): GoDeeperTerm[] {
  return book.terms.filter((t) => t.chapterId === chapterId && t.status !== "rejected");
}

export function acceptedChapterTerms(book: BookState, chapterId: ChapterId): GoDeeperTerm[] {
  return book.terms.filter((t) => t.chapterId === chapterId && t.status === "accepted");
}

export function suggestedChapterTerms(book: BookState, chapterId: ChapterId): GoDeeperTerm[] {
  return book.terms.filter((t) => t.chapterId === chapterId && t.status === "suggested");
}

export function isTermKnown(book: BookState, chapterId: ChapterId, normalized: string): boolean {
  return book.terms.some(
    (t) =>
      t.chapterId === chapterId &&
      t.normalized === normalized &&
      (t.status === "accepted" || t.status === "rejected" || t.status === "suggested"),
  );
}

export function createManualTerm(
  chapterId: ChapterId,
  term: string,
  body: string,
  explanation?: string,
): GoDeeperTerm {
  const normalized = normalizeTerm(term);
  return {
    id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    term: term.trim(),
    normalized,
    chapterId,
    ranges: findTermRanges(body, term),
    explanation,
    source: "manual",
    status: "accepted",
    createdAt: new Date().toISOString(),
  };
}

export function mergeBookTerms(book: BookState, chapterId: ChapterId, body: string): BookState {
  return {
    ...book,
    terms: recomputeTermRanges(book.terms, chapterId, body),
  };
}
