import { MUNENORI_BASE_URL, MUNENORI_MODEL } from "./config";
import type { LlmWriteRequest } from "./types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function buildMessages(req: LlmWriteRequest): ChatMessage[] {
  const system =
    "You are Munenori, a careful book editor. Write clear technical prose in Markdown. " +
    "Preserve existing headings and voice. Output only the text to insert or replace—no preamble.";

  if (req.mode === "continue") {
    return [
      { role: "system", content: system },
      {
        role: "user",
        content:
          `Chapter: ${req.chapterTitle}\n\n` +
          (req.instruction
            ? `Instruction: ${req.instruction}\n\n`
            : "Continue the chapter naturally for 2–4 paragraphs.\n\n") +
          `Manuscript so far:\n\n${req.body}\n\n---\nContinue from here:`,
      },
    ];
  }

  return [
    { role: "system", content: system },
    {
      role: "user",
      content:
        `Chapter: ${req.chapterTitle}\n\n` +
        `Audit issue: ${req.auditIssue ?? "Improve clarity"}\n` +
        (req.auditExcerpt ? `Excerpt: ${req.auditExcerpt}\n\n` : "\n") +
        `Full chapter:\n\n${req.body}\n\n---\nRewrite only the affected passage and return the fixed excerpt.`,
    },
  ];
}

export async function probeMunenori(): Promise<{
  ok: boolean;
  models: string[];
  error?: string;
  latencyMs: number;
}> {
  const started = Date.now();
  const url = `${MUNENORI_BASE_URL}/models`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return {
        ok: false,
        models: [],
        error: `HTTP ${res.status}`,
        latencyMs,
      };
    }
    const data = (await res.json()) as { data?: { id: string }[] };
    const models = (data.data ?? []).map((m) => m.id);
    return { ok: true, models, latencyMs };
  } catch (e) {
    return {
      ok: false,
      models: [],
      error: e instanceof Error ? e.message : "unreachable",
      latencyMs: Date.now() - started,
    };
  }
}

export async function munenoriComplete(req: LlmWriteRequest): Promise<string> {
  const url = `${MUNENORI_BASE_URL}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MUNENORI_MODEL,
      messages: buildMessages(req),
      temperature: 0.4,
      max_tokens: 1200,
      stream: false,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Munenori HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Munenori returned empty completion");
  return content;
}
