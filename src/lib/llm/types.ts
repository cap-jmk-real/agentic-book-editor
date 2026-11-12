export type LlmWriteMode =
  | "continue"
  | "audit-fix"
  | "rewrite-selection"
  | "explain-deeper"
  | "detect-terms";

export type LlmWriteRequest = {
  mode: LlmWriteMode;
  instruction?: string;
  chapterTitle: string;
  body: string;
  auditIssue?: string;
  auditExcerpt?: string;
  selectionText?: string;
  term?: string;
  explanation?: string;
  surrounding?: string;
  knownTerms?: string[];
};

export type LlmStatus = {
  ok: boolean;
  baseUrl: string;
  model: string;
  models?: string[];
  error?: string;
  latencyMs?: number;
};

export type DetectTermsItem = {
  term: string;
  excerpt: string;
  reason: string;
  draftExplanation?: string;
};
