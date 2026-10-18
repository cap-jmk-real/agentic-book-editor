export type LlmWriteMode = "continue" | "audit-fix";

export type LlmWriteRequest = {
  mode: LlmWriteMode;
  instruction?: string;
  chapterTitle: string;
  body: string;
  auditIssue?: string;
  auditExcerpt?: string;
};

export type LlmStatus = {
  ok: boolean;
  baseUrl: string;
  model: string;
  models?: string[];
  error?: string;
  latencyMs?: number;
};
