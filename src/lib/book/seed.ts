import type { AuditFinding, BookState } from "./types";

export const BOOK_STORAGE_KEY = "agentic-book-editor:book";
export const AUDIT_STORAGE_KEY = "agentic-book-editor:audit";

export function seedBook(): BookState {
  return {
    title: "The Agentic Book",
    activeChapterId: "ch-01",
    chapters: [
      {
        id: "ch-01",
        title: "Math essentials",
        body: `## Why math matters

Agents reason over vectors, probabilities, and gradients whether or not you print equations on the page. This chapter collects the minimum toolkit.

## Linear algebra

A vector is an ordered list of numbers. The dot product measures alignment; cosine similarity normalizes it.

\`\`\`
cos(θ) = (a · b) / (||a|| ||b||)
\`\`\`

Keep notation consistent: bold for vectors in prose, plain for scalars.

`,
      },
      {
        id: "ch-02",
        title: "Statistics",
        body: `## Distributions

Most agent metrics are samples from noisy processes. Report confidence intervals, not single numbers.

## Estimation

When you compare two prompts, use paired tests on the same task set.
`,
      },
    ],
  };
}

export function seedAudit(): AuditFinding[] {
  return [
    {
      id: "audit-1",
      chapterId: "ch-01",
      excerpt: "Keep notation consistent: bold for vectors in prose",
      issue: "Define how bold vectors render in Markdown (no native bold vectors).",
      severity: "warn",
      resolver: "munenori",
      status: "open",
    },
    {
      id: "audit-2",
      chapterId: "ch-01",
      excerpt: "cos(θ) = (a · b)",
      issue: "Add one sentence linking cosine similarity to retrieval and embeddings.",
      severity: "info",
      resolver: "munenori",
      status: "open",
    },
    {
      id: "audit-3",
      chapterId: "ch-02",
      excerpt: "paired tests on the same task set",
      issue: "Name a concrete test (e.g. McNemar or paired bootstrap) for prompt A/B.",
      severity: "warn",
      resolver: "munenori",
      status: "open",
    },
  ];
}
