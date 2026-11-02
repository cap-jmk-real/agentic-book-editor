"use client";

import { useCallback, useRef, useState } from "react";
import { ChapterReader } from "./ChapterReader";

export type EditorMode = "read" | "edit";

type Props = {
  title: string;
  body: string;
  onBodyChange: (body: string) => void;
  onContinue: () => void;
  continuing: boolean;
  continueError: string | null;
  instruction: string;
  onInstructionChange: (value: string) => void;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
};

export function EditorPane({
  title,
  body,
  onBodyChange,
  onContinue,
  continuing,
  continueError,
  instruction,
  onInstructionChange,
  mode,
  onModeChange,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [agentOpen, setAgentOpen] = useState(false);

  const insertMarkdown = useCallback(
    (before: string, after: string = before) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = body.slice(start, end);
      const next =
        body.slice(0, start) + before + selected + after + body.slice(end);
      onBodyChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const cursor = start + before.length + selected.length;
        el.setSelectionRange(cursor, cursor);
      });
    },
    [body, onBodyChange],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6"
        style={{
          borderColor: "var(--book-border)",
          background: "var(--book-chrome)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--book-text-faint)" }}
          >
            Chapter
          </p>
          <h1
            className="truncate text-lg font-semibold tracking-tight sm:text-xl"
            style={{ color: "var(--book-text)" }}
          >
            {title}
          </h1>
        </div>
        <div
          className="flex items-center rounded-lg p-0.5"
          style={{
            background: "var(--book-sidebar)",
            border: "1px solid var(--book-border)",
          }}
          role="tablist"
          aria-label="Reading or editing"
        >
          <ModeTab
            active={mode === "read"}
            onClick={() => onModeChange("read")}
            label="Read"
          />
          <ModeTab
            active={mode === "edit"}
            onClick={() => onModeChange("edit")}
            label="Edit"
          />
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ background: "var(--book-canvas)" }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[min(100%,52rem)] justify-center px-4 py-6 sm:px-6 sm:py-8">
          <div
            className="w-full min-h-[min(70vh,40rem)] rounded-sm"
            style={{
              background: "var(--book-page)",
              boxShadow: "var(--book-page-shadow)",
              border: "1px solid var(--book-border)",
            }}
          >
            {mode === "read" ? (
              <ChapterReader body={body} />
            ) : (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                spellCheck
                className="block min-h-[min(70vh,40rem)] w-full resize-none border-0 bg-transparent px-8 py-10 font-sans outline-none sm:px-12 sm:py-12"
                style={{
                  color: "var(--book-text-secondary)",
                  fontSize: "var(--book-prose-size)",
                  lineHeight: "var(--book-prose-leading)",
                  maxWidth: "var(--book-prose-measure)",
                  margin: "0 auto",
                }}
                aria-label="Chapter markdown"
              />
            )}
          </div>
        </div>
      </div>

      {mode === "edit" && (
        <div
          className="sticky bottom-0 z-10 flex flex-wrap items-center justify-center gap-1 border-t px-3 py-2 sm:gap-2"
          style={{
            borderColor: "var(--book-border)",
            background: "color-mix(in srgb, var(--book-chrome) 92%, transparent)",
            backdropFilter: "blur(8px)",
          }}
          role="toolbar"
          aria-label="Markdown formatting"
        >
          <FormatButton label="H2" title="Heading" onClick={() => insertMarkdown("## ", "")} />
          <FormatButton label="B" title="Bold" onClick={() => insertMarkdown("**", "**")} />
          <FormatButton label="I" title="Italic" onClick={() => insertMarkdown("*", "*")} />
          <FormatButton label="`" title="Code" onClick={() => insertMarkdown("`", "`")} />
          <span
            className="mx-1 hidden h-5 w-px sm:inline"
            style={{ background: "var(--book-border-strong)" }}
          />
          <FormatButton
            label="—"
            title="Horizontal rule"
            onClick={() => insertMarkdown("\n---\n", "")}
          />
        </div>
      )}

      <div
        className="shrink-0 border-t"
        style={{ borderColor: "var(--book-border)", background: "var(--book-chrome)" }}
      >
        <button
          type="button"
          onClick={() => setAgentOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-2 text-left text-sm sm:px-6"
          style={{ color: "var(--book-text-muted)" }}
          aria-expanded={agentOpen}
        >
          <span className="font-medium" style={{ color: "var(--book-text-secondary)" }}>
            Munenori continue
          </span>
          <span aria-hidden>{agentOpen ? "▾" : "▸"}</span>
        </button>
        {agentOpen && (
          <div className="space-y-3 border-t px-4 pb-4 pt-3 sm:px-6">
            <label className="block text-xs font-medium" style={{ color: "var(--book-text-muted)" }}>
              Optional instruction
              <input
                type="text"
                value={instruction}
                onChange={(e) => onInstructionChange(e.target.value)}
                placeholder="e.g. add a worked example"
                className="mt-1.5 w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{
                  color: "var(--book-text)",
                  background: "var(--book-page)",
                  border: "1px solid var(--book-border-strong)",
                }}
              />
            </label>
            <button
              type="button"
              onClick={onContinue}
              disabled={continuing}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
              style={{
                background: "var(--book-accent)",
              }}
              onMouseEnter={(e) => {
                if (!continuing) e.currentTarget.style.background = "var(--book-accent-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--book-accent)";
              }}
            >
              {continuing ? "Writing…" : "Continue chapter"}
            </button>
            {continueError && (
              <p className="text-xs" style={{ color: "var(--book-warning)" }}>
                {continueError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
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

function FormatButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-md text-sm font-medium transition"
      style={{
        color: "var(--book-text-secondary)",
        border: "1px solid var(--book-border)",
        background: "var(--book-page)",
      }}
    >
      {label}
    </button>
  );
}
