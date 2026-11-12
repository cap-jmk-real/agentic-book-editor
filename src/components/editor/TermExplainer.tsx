"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { GoDeeperTerm } from "@/lib/book/types";

type Props = {
  term: GoDeeperTerm;
  chapterTitle: string;
  chapterBody: string;
  munenoriOnline: boolean;
  onClose: () => void;
  onRemove?: () => void;
  isAuthor?: boolean;
};

export function TermExplainer({
  term,
  chapterTitle,
  chapterBody,
  munenoriOnline,
  onClose,
  onRemove,
  isAuthor,
}: Props) {
  const [deeper, setDeeper] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explainDeeper() {
    if (!munenoriOnline) return;
    setLoading(true);
    setError(null);
    try {
      const range = term.ranges[0];
      const surrounding = range
        ? chapterBody.slice(
            Math.max(0, range.start - 120),
            Math.min(chapterBody.length, range.end + 120),
          )
        : "";
      const res = await fetch("/api/llm/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "explain-deeper",
          chapterTitle,
          body: chapterBody,
          term: term.term,
          explanation: term.explanation,
          surrounding,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Explain failed");
      setDeeper(data.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Explain failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 p-4 text-sm">
      <p className="text-base font-semibold tracking-tight" style={{ color: "var(--book-text)" }}>
        {term.term}
      </p>
      <p className="leading-relaxed" style={{ color: "var(--book-text-secondary)" }}>
        {term.explanation?.trim() || "No explanation yet."}
      </p>
      <button
        type="button"
        className="rounded-md px-3 py-2 text-xs font-medium disabled:opacity-40"
        style={{
          color: "var(--book-accent-text)",
          background: "var(--book-accent-subtle)",
        }}
        disabled={!munenoriOnline || loading}
        title={!munenoriOnline ? "Munenori is offline" : undefined}
        onClick={() => void explainDeeper()}
      >
        Explain deeper
      </button>
      {loading && (
        <p className="flex items-center gap-2 text-xs" style={{ color: "var(--book-text-muted)" }}>
          <LoaderCircle size={14} className="animate-spin" aria-hidden />
          Munenori
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--book-danger)" }}>
          {error}
        </p>
      )}
      {deeper && (
        <div className="book-ai-diff-new rounded-md px-3 py-2 text-sm leading-relaxed">{deeper}</div>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="text-xs font-medium"
          style={{ color: "var(--book-text-muted)" }}
          onClick={onClose}
        >
          Close
        </button>
        {isAuthor && onRemove && (
          <button
            type="button"
            className="text-xs font-medium"
            style={{ color: "var(--book-danger)" }}
            onClick={onRemove}
          >
            Remove mark
          </button>
        )}
      </div>
    </div>
  );
}
