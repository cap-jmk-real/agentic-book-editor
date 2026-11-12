export type ChapterId = string;

export type Chapter = {
  id: ChapterId;
  title: string;
  body: string;
};

export type TermSource = "manual" | "heuristic" | "llm";
export type TermStatus = "accepted" | "suggested" | "rejected";

export type TermRange = { start: number; end: number };

export type GoDeeperTerm = {
  id: string;
  term: string;
  normalized: string;
  chapterId: ChapterId;
  ranges: TermRange[];
  explanation?: string;
  source: TermSource;
  status: TermStatus;
  createdAt: string;
};

export type BookState = {
  title: string;
  chapters: Chapter[];
  activeChapterId: ChapterId;
  terms: GoDeeperTerm[];
};

export type AuditSeverity = "info" | "warn" | "error";

export type AuditFinding = {
  id: string;
  chapterId: ChapterId;
  excerpt: string;
  issue: string;
  severity: AuditSeverity;
  resolver: "munenori" | "human";
  status: "open" | "resolved";
};

export type AuditState = {
  findings: AuditFinding[];
  lastRunAt: string | null;
};
