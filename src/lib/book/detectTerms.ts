import type { GoDeeperTerm } from "./types";
import { findTermRanges, normalizeTerm } from "./terms";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "as",
  "by",
  "with",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "this",
  "that",
  "it",
  "you",
  "your",
  "we",
  "they",
  "their",
  "most",
  "not",
  "whether",
  "over",
  "into",
  "when",
  "which",
  "who",
  "how",
  "what",
  "all",
  "one",
  "two",
  "same",
  "use",
  "used",
  "using",
  "keep",
  "report",
]);

export type TermSuggestion = {
  term: string;
  normalized: string;
  reason: string;
  source: "heuristic";
};

export function detectTermsHeuristic(
  body: string,
  chapterId: string,
  existing: GoDeeperTerm[],
  acceptedElsewhere: string[],
): TermSuggestion[] {
  const suggestions: TermSuggestion[] = [];
  const seen = new Set<string>();

  const add = (term: string, reason: string) => {
    const normalized = normalizeTerm(term);
    if (!normalized || seen.has(normalized)) return;
    if (existing.some((t) => t.chapterId === chapterId && t.normalized === normalized)) {
      return;
    }
    const words = normalized.split(/\s+/);
    if (words.length === 1 && STOPWORDS.has(normalized)) return;
    if (words.length === 1 && normalized.length < 4 && !body.includes("`" + term)) return;
    seen.add(normalized);
    suggestions.push({ term: term.trim(), normalized, reason, source: "heuristic" });
  };

  const backtick = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  while ((m = backtick.exec(body)) !== null) {
    const inner = m[1].trim();
    if (inner && inner.length <= 60) add(inner, "Appears in backticks");
  }

  const bold = /\*\*([^*]{1,80})\*\*/g;
  while ((m = bold.exec(body)) !== null) {
    const inner = m[1].trim();
    const wc = inner.split(/\s+/).length;
    if (wc >= 1 && wc <= 5) add(inner, "Bold phrase in manuscript");
  }

  const titleCase = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  while ((m = titleCase.exec(body)) !== null) {
    add(m[1], "Title Case technical phrase");
  }

  for (const norm of acceptedElsewhere) {
    if (body.toLowerCase().includes(norm)) {
      const display = norm
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      add(display, "Also used in another chapter");
    }
  }

  suggestions.sort((a, b) => b.term.length - a.term.length);
  return suggestions.slice(0, 8);
}

export function suggestionsToTerms(
  items: TermSuggestion[],
  chapterId: string,
  body: string,
): GoDeeperTerm[] {
  const now = new Date().toISOString();
  return items.map((s) => ({
    id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    term: s.term,
    normalized: s.normalized,
    chapterId,
    ranges: findTermRanges(body, s.term),
    source: s.source,
    status: "suggested" as const,
    createdAt: now,
  }));
}

export function parseDetectTermsJson(raw: string): {
  items: { term: string; excerpt: string; reason: string; draftExplanation?: string }[];
  error?: string;
} {
  try {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("no array");
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) throw new Error("not array");
    const items = parsed.map((row) => {
      const o = row as Record<string, unknown>;
      return {
        term: String(o.term ?? ""),
        excerpt: String(o.excerpt ?? ""),
        reason: String(o.reason ?? "Suggested by Munenori"),
        draftExplanation: o.draftExplanation ? String(o.draftExplanation) : undefined,
      };
    });
    return { items: items.filter((i) => i.term.trim()) };
  } catch {
    return { items: [], error: "Could not parse suggestions" };
  }
}
