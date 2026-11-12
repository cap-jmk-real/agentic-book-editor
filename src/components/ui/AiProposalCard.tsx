"use client";

import { LoaderCircle } from "lucide-react";
import type { AiProposal } from "@/lib/editor/aiProposal";

type Props = {
  proposal: AiProposal;
  originalExcerpt?: string;
  onAccept: () => void;
  onDiscard: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onInsertBelow?: () => void;
  instruction?: string;
  onInstructionChange?: (v: string) => void;
};

export function AiProposalCard({
  proposal,
  originalExcerpt,
  onAccept,
  onDiscard,
  onRetry,
  onCancel,
  onInsertBelow,
  instruction,
  onInstructionChange,
}: Props) {
  const isAppend = !proposal.sourceRange && !proposal.auditExcerpt;

  return (
    <div className="book-ai-proposal my-4 rounded-lg p-4 text-sm">
      {proposal.status === "loading" && (
        <div className="flex items-center gap-2" style={{ color: "var(--book-text-muted)" }}>
          <LoaderCircle className="animate-spin" size={14} strokeWidth={1.5} aria-hidden />
          <span>Munenori is writing</span>
          <button
            type="button"
            className="ml-auto text-xs font-medium"
            style={{ color: "var(--book-text-secondary)" }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      )}

      {proposal.status === "error" && (
        <div>
          <p style={{ color: "var(--book-danger)" }}>{proposal.error ?? "Something went wrong"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <GhostBtn onClick={onRetry}>Try again</GhostBtn>
            <GhostBtn onClick={onDiscard}>Discard</GhostBtn>
          </div>
        </div>
      )}

      {proposal.status === "ready" && (
        <div className="space-y-3">
          {originalExcerpt && (
            <p className="book-ai-diff-old text-sm leading-relaxed">{originalExcerpt}</p>
          )}
          <div className="book-ai-diff-new rounded-md px-3 py-2 leading-relaxed">{proposal.text}</div>
          {onInstructionChange && (
            <input
              type="text"
              value={instruction ?? ""}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder="Optional instruction"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: "1px solid var(--book-border-strong)",
                background: "var(--book-page)",
                color: "var(--book-text)",
              }}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <PrimaryBtn onClick={onAccept}>Accept</PrimaryBtn>
            <GhostBtn onClick={onDiscard}>Discard</GhostBtn>
            <GhostBtn onClick={onRetry}>Try again</GhostBtn>
            {isAppend && onInsertBelow && <GhostBtn onClick={onInsertBelow}>Insert below</GhostBtn>}
          </div>
        </div>
      )}
    </div>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-2 text-xs font-medium"
      style={{ background: "var(--book-accent)", color: "#fff" }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-2 text-xs font-medium"
      style={{ color: "var(--book-text-secondary)" }}
    >
      {children}
    </button>
  );
}
