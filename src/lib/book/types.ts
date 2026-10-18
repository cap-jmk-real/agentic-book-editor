export type ChapterId = string;

export type Chapter = {
  id: ChapterId;
  title: string;
  body: string;
};

export type BookState = {
  title: string;
  chapters: Chapter[];
  activeChapterId: ChapterId;
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
