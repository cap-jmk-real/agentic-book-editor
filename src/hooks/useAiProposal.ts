"use client";

import { useCallback, useRef, useState } from "react";
import type { AiProposal } from "@/lib/editor/aiProposal";
import type { LlmWriteRequest } from "@/lib/llm/types";

function newId() {
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAiProposal() {
  const [proposal, setProposal] = useState<AiProposal | null>(null);
  const [revertBody, setRevertBody] = useState<string | null>(null);
  const [revertVisible, setRevertVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const discard = useCallback(() => {
    cancel();
    setProposal(null);
  }, [cancel]);

  const start = useCallback(async (partial: Omit<AiProposal, "id" | "status" | "text"> & { payload: LlmWriteRequest }) => {
      cancel();
      const id = newId();
      setProposal({
        ...partial,
        id,
        status: "loading",
        text: "",
      });
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch("/api/llm/write", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(partial.payload),
          signal: ac.signal,
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        setProposal((p) =>
          p && p.id === id
            ? { ...p, status: "ready", text: data.text ?? "" }
            : p,
        );
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setProposal(null);
          return;
        }
        setProposal((p) =>
          p && p.id === id
            ? {
                ...p,
                status: "error",
                error: e instanceof Error ? e.message : "Request failed",
              }
            : p,
        );
      } finally {
        abortRef.current = null;
      }
    },
    [cancel],
  );

  const accept = useCallback(
    (
      chapterBody: string,
      apply: (nextBody: string) => void,
      options?: { insertBelow?: boolean },
    ): string | null => {
      void options;
      if (!proposal || proposal.status !== "ready") return null;
      const before = chapterBody;
      setRevertBody(before);

      let next = chapterBody;
      const text = proposal.text;
      if (proposal.sourceRange) {
        const { start, end } = proposal.sourceRange;
        next = chapterBody.slice(0, start) + text + chapterBody.slice(end);
      } else if (proposal.auditExcerpt && chapterBody.includes(proposal.auditExcerpt)) {
        next = chapterBody.replace(proposal.auditExcerpt, text);
      } else {
        const suffix = text.startsWith("\n") ? text : `\n\n${text}`;
        next = `${chapterBody}${suffix}`;
      }

      apply(next);
      setProposal(null);
      setRevertVisible(true);
      window.setTimeout(() => setRevertVisible(false), 4000);
      return next;
    },
    [proposal],
  );

  const revert = useCallback(
    (apply: (body: string) => void) => {
      if (revertBody == null) return;
      apply(revertBody);
      setRevertBody(null);
      setRevertVisible(false);
    },
    [revertBody],
  );

  return {
    proposal,
    setProposal,
    start,
    discard,
    cancel,
    accept,
    revert,
    revertVisible,
    revertBody,
  };
}
