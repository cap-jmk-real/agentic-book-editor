import type { LlmWriteMode } from "@/lib/llm/types";

export type AiProposal = {
  id: string;
  mode: LlmWriteMode;
  chapterId: string;
  sourceRange?: { start: number; end: number };
  instruction?: string;
  status: "loading" | "ready" | "error" | "accepted";
  text: string;
  error?: string;
  auditFindingId?: string;
  auditIssue?: string;
  auditExcerpt?: string;
};
