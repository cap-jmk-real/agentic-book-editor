"use client";

import {
  Heading,
  ListFilter,
  Minus,
  PenLine,
  Sparkles,
  Text,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiProposalCard } from "@/components/ui/AiProposalCard";
import { CommandPalette, type PaletteAction } from "@/components/ui/CommandPalette";
import { FormatToolbar } from "@/components/ui/FormatToolbar";
import { SelectionBubble } from "@/components/ui/SelectionBubble";
import { SlashMenu, type SlashItem } from "@/components/ui/SlashMenu";
import type { AiProposal } from "@/lib/editor/aiProposal";
import { isValidMarkSelection } from "@/lib/book/terms";
import type { GoDeeperTerm } from "@/lib/book/types";
import { ChapterReader } from "./ChapterReader";
import { TermMarkDialog } from "./TermMarkDialog";

export type EditorMode = "read" | "edit";

type Props = {
  title: string;
  body: string;
  onBodyChange: (body: string) => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  terms: GoDeeperTerm[];
  showSuggestedTerms: boolean;
  munenoriOnline: boolean;
  proposal: AiProposal | null;
  proposalInstruction: string;
  onProposalInstructionChange: (v: string) => void;
  onContinue: (instruction?: string) => void;
  onRewriteSelection: (start: number, end: number, text: string) => void;
  onAcceptProposal: (insertBelow?: boolean) => void;
  onDiscardProposal: () => void;
  onRetryProposal: () => void;
  onCancelProposal: () => void;
  onMarkTerm: (term: string, explanation: string) => void;
  onDetectTerms: () => void;
  onRemoveTerm: (termId: string) => void;
  revertVisible: boolean;
  onRevert: () => void;
  onOpenPalette: () => void;
  paletteOpen: boolean;
  onClosePalette: () => void;
  paletteActions: PaletteAction[];
  onChapterTitleTap?: () => void;
};

export function EditorPane({
  title,
  body,
  onBodyChange,
  mode,
  onModeChange,
  terms,
  showSuggestedTerms,
  munenoriOnline,
  proposal,
  proposalInstruction,
  onProposalInstructionChange,
  onContinue,
  onRewriteSelection,
  onAcceptProposal,
  onDiscardProposal,
  onRetryProposal,
  onCancelProposal,
  onMarkTerm,
  onDetectTerms,
  onRemoveTerm,
  revertVisible,
  onRevert,
  paletteOpen,
  onClosePalette,
  paletteActions,
  onChapterTitleTap,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(
    null,
  );
  const [markOpen, setMarkOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);
  const [useMarkSheet, setUseMarkSheet] = useState(false);

  const slashItems: SlashItem[] = [
    { id: "continue", label: "Continue chapter", hint: "Munenori proposes the next paragraphs", icon: Sparkles },
    { id: "rewrite", label: "Rewrite selection", hint: "Replace the selected passage", icon: PenLine },
    { id: "mark", label: "Mark as go-deeper", hint: "Readers can tap for more context", icon: Text },
    { id: "h2", label: "Heading", hint: "Insert a level-2 heading", icon: Heading },
    { id: "rule", label: "Horizontal rule", hint: "Insert ---", icon: Minus },
    { id: "detect", label: "Detect terms", hint: "Find difficult phrases in this chapter", icon: ListFilter },
  ];

  const insertMarkdown = useCallback(
    (before: string, after: string = before) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = body.slice(start, end);
      const next = body.slice(0, start) + before + selected + after + body.slice(end);
      onBodyChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const cursor = start + before.length + selected.length;
        el.setSelectionRange(cursor, cursor);
      });
    },
    [body, onBodyChange],
  );

  const updateSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el || mode !== "edit") {
      setSelection(null);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) {
      setSelection(null);
      return;
    }
    setSelection({ start, end, text: body.slice(start, end) });
  }, [body, mode]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setUseMarkSheet(mq.matches);
  }, []);

  useEffect(() => {
    if (mode !== "edit") {
      setSlashOpen(false);
      return;
    }
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart;
    const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
    const line = body.slice(lineStart, pos);
    const atLineStart = line === "/" || line.startsWith("/") && !line.includes(" ");
    setSlashOpen(atLineStart && line.startsWith("/"));
  }, [body, mode]);

  function runSlash(id: string) {
    const el = textareaRef.current;
    if (el) {
      const pos = el.selectionStart;
      const lineStart = body.lastIndexOf("\n", pos - 1) + 1;
      const next = body.slice(0, lineStart) + body.slice(pos);
      onBodyChange(next);
    }
    setSlashOpen(false);
    if (id === "continue") onContinue();
    else if (id === "rewrite" && selection) onRewriteSelection(selection.start, selection.end, selection.text);
    else if (id === "mark") setMarkOpen(true);
    else if (id === "h2") insertMarkdown("## ", "");
    else if (id === "rule") insertMarkdown("\n---\n", "");
    else if (id === "detect") onDetectTerms();
  }

  const markValid = selection ? isValidMarkSelection(selection.text) : false;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PaneHeader
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6"
        onTitleTap={onChapterTitleTap}
        title={title}
        mode={mode}
        onModeChange={onModeChange}
      />

      {revertVisible && (
        <div className="flex justify-center px-4 py-2 text-xs" style={{ background: "var(--book-sidebar)" }}>
          <span style={{ color: "var(--book-text-muted)" }}>Applied · </span>
          <button type="button" className="font-medium" style={{ color: "var(--book-accent-text)" }} onClick={onRevert}>
            Revert
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0" style={{ background: "var(--book-canvas)" }}>
        <div className="mx-auto flex min-h-full w-full max-w-[min(100%,52rem)] justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
          <div
            className="book-page-card relative w-full min-h-[min(70vh,40rem)] rounded-sm"
            style={{
              background: "var(--book-page)",
              boxShadow: "var(--book-page-shadow)",
              border: "1px solid var(--book-border)",
            }}
          >
            {mode === "read" ? (
              <ChapterReader
                body={body}
                terms={terms}
                chapterTitle={title}
                showSuggested={showSuggestedTerms}
                munenoriOnline={munenoriOnline}
                onRemoveTerm={onRemoveTerm}
                isAuthor
              />
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                  onSelect={updateSelection}
                  onKeyUp={updateSelection}
                  onMouseUp={updateSelection}
                  onKeyDown={(e) => {
                    if (slashOpen) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSlashIndex((i) => Math.min(i + 1, slashItems.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSlashIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        runSlash(slashItems[slashIndex].id);
                      } else if (e.key === "Escape") {
                        setSlashOpen(false);
                      }
                    }
                  }}
                  spellCheck
                  data-testid="chapter-textarea"
                  className="book-font block min-h-[min(70vh,40rem)] w-full resize-none border-0 bg-transparent px-8 py-10 outline-none sm:px-12 sm:py-12"
                  style={{
                    color: "var(--book-text-secondary)",
                    fontSize: "var(--book-prose-size)",
                    lineHeight: "var(--book-prose-leading)",
                    maxWidth: "var(--book-prose-measure)",
                    margin: "0 auto",
                  }}
                  aria-label="Chapter markdown"
                />
                {slashOpen && (
                  <div className="relative">
                    <SlashMenu items={slashItems} activeIndex={slashIndex} onPick={runSlash} />
                  </div>
                )}
                {selection && (
                  <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
                    <SelectionBubble
                      visible
                      onBold={() => insertMarkdown("**", "**")}
                      onItalic={() => insertMarkdown("*", "*")}
                      onMarkTerm={() => setMarkOpen(true)}
                      onRewrite={() => onRewriteSelection(selection.start, selection.end, selection.text)}
                      markDisabled={!markValid}
                      markDisabledReason="Select a shorter term"
                      offline={!munenoriOnline}
                    />
                  </div>
                )}
              </div>
            )}

            {mode === "edit" && proposal && (
              <div className="border-t px-6 pb-6" style={{ borderColor: "var(--book-border)" }}>
                <AiProposalCard
                  proposal={proposal}
                  originalExcerpt={
                    proposal.sourceRange
                      ? body.slice(proposal.sourceRange.start, proposal.sourceRange.end)
                      : proposal.auditExcerpt
                  }
                  instruction={proposalInstruction}
                  onInstructionChange={onProposalInstructionChange}
                  onAccept={() => onAcceptProposal(false)}
                  onInsertBelow={
                    !proposal.sourceRange ? () => onAcceptProposal(true) : undefined
                  }
                  onDiscard={onDiscardProposal}
                  onRetry={onRetryProposal}
                  onCancel={onCancelProposal}
                />
              </div>
            )}

            {mode === "edit" && !proposal && (
              <div className="flex justify-center px-6 pb-8">
                <button
                  type="button"
                  data-testid="continue-munenori"
                  className="text-sm font-medium disabled:opacity-40"
                  style={{ color: "var(--book-text-secondary)" }}
                  disabled={!munenoriOnline}
                  title={!munenoriOnline ? "Munenori is offline" : undefined}
                  onClick={() => onContinue(proposalInstruction)}
                >
                  Continue with Munenori
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mode === "edit" && (
        <FormatToolbar
          onBold={() => insertMarkdown("**", "**")}
          onItalic={() => insertMarkdown("*", "*")}
          onCode={() => insertMarkdown("`", "`")}
          onHr={() => insertMarkdown("\n---\n", "")}
          onHeading={(level) => insertMarkdown(`${"#".repeat(level)} `, "")}
        />
      )}

      <TermMarkDialog
        open={markOpen}
        initialTerm={selection?.text.trim() ?? ""}
        useSheet={useMarkSheet}
        onSave={(term, explanation) => {
          onMarkTerm(term, explanation);
          setMarkOpen(false);
        }}
        onCancel={() => setMarkOpen(false)}
      />

      <CommandPalette open={paletteOpen} onClose={onClosePalette} actions={paletteActions} />
    </div>
  );
}

function PaneHeader({
  title,
  mode,
  onModeChange,
  onTitleTap,
  className,
}: {
  title: string;
  mode: EditorMode;
  onModeChange: (m: EditorMode) => void;
  onTitleTap?: () => void;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        borderColor: "var(--book-border)",
        background: "var(--book-chrome)",
      }}
    >
      <button
        type="button"
        className="min-w-0 flex-1 text-left lg:pointer-events-none"
        onClick={onTitleTap}
        data-testid="chapter-title-button"
      >
        <p className="text-xs font-medium" style={{ color: "var(--book-text-faint)" }}>
          Chapter
        </p>
        <h1
          className="truncate text-lg font-semibold tracking-tight sm:text-xl"
          style={{ color: "var(--book-text)" }}
        >
          {title}
        </h1>
      </button>
      <ModeTabs mode={mode} onModeChange={onModeChange} />
    </div>
  );
}

function ModeTabs({ mode, onModeChange }: { mode: EditorMode; onModeChange: (m: EditorMode) => void }) {
  return (
    <div
      className="flex items-center rounded-lg p-0.5"
      style={{ background: "var(--book-sidebar)", border: "1px solid var(--book-border)" }}
      role="tablist"
      aria-label="Reading or editing"
    >
      <ModeTab active={mode === "read"} onClick={() => onModeChange("read")} label="Read" />
      <ModeTab active={mode === "edit"} onClick={() => onModeChange("edit")} label="Edit" />
    </div>
  );
}

function ModeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-sm font-medium transition"
      style={
        active
          ? {
              background: "var(--book-page)",
              color: "var(--book-text)",
              boxShadow: "0 1px 2px rgb(0 0 0 / 6%)",
            }
          : { color: "var(--book-text-muted)" }
      }
    >
      {label}
    </button>
  );
}
