"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAudit, loadBook, saveAudit, saveBook } from "@/lib/book/storage";
import type { AuditState, BookState } from "@/lib/book/types";
import { AuditPanel } from "./AuditPanel";
import { EditorPane, type EditorMode } from "./EditorPane";
import { MunenoriStatus } from "./MunenoriStatus";
import { PhoneModal } from "./PhoneModal";

type BookTheme = "light" | "dark";

export function BookEditor() {
  const [book, setBook] = useState<BookState | null>(null);
  const [audit, setAudit] = useState<AuditState | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("read");
  const [focusMode, setFocusMode] = useState(false);
  const [auditOpen, setAuditOpen] = useState(true);
  const [theme, setTheme] = useState<BookTheme>("light");

  useEffect(() => {
    setBook(loadBook());
    setAudit(loadAudit());
    const stored = window.localStorage.getItem("agentic-book-editor:theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    if (book) saveBook(book);
  }, [book]);

  useEffect(() => {
    if (audit) saveAudit(audit);
  }, [audit]);

  useEffect(() => {
    window.localStorage.setItem("agentic-book-editor:theme", theme);
  }, [theme]);

  const activeChapter = book?.chapters.find((c) => c.id === book.activeChapterId);

  const setChapterBody = useCallback((chapterId: string, body: string) => {
    setBook((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((c) => (c.id === chapterId ? { ...c, body } : c)),
      };
    });
  }, []);

  async function handleContinue() {
    if (!book || !activeChapter) return;
    setContinuing(true);
    setContinueError(null);
    try {
      const res = await fetch("/api/llm/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "continue",
          chapterTitle: activeChapter.title,
          body: activeChapter.body,
          instruction: instruction.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Continue failed");
      const suffix = data.text?.startsWith("\n") ? data.text : `\n\n${data.text ?? ""}`;
      setChapterBody(activeChapter.id, `${activeChapter.body}${suffix}`);
    } catch (e) {
      setContinueError(e instanceof Error ? e.message : "Continue failed");
    } finally {
      setContinuing(false);
    }
  }

  if (!book || !audit || !activeChapter) {
    return (
      <div
        className="book-editor flex min-h-screen items-center justify-center"
        data-theme="light"
        style={{ background: "var(--book-canvas)", color: "var(--book-text-muted)" }}
      >
        Loading editor…
      </div>
    );
  }

  const showToc = !focusMode;

  return (
    <div
      className="book-editor flex min-h-screen flex-col"
      data-theme={theme}
      style={{ background: "var(--book-canvas)", color: "var(--book-text)" }}
    >
      <header
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-5"
        style={{
          borderColor: "var(--book-border)",
          background: "var(--book-chrome)",
        }}
      >
        <div className="min-w-0">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.14em]"
            style={{ color: "var(--book-text-faint)" }}
          >
            Agentic Book Editor
          </p>
          <p
            className="truncate text-sm font-semibold sm:text-base"
            style={{ color: "var(--book-text)" }}
          >
            {book.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <MunenoriStatus />
          <button
            type="button"
            onClick={() => setFocusMode((f) => !f)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
            style={{
              color: focusMode ? "var(--book-accent-text)" : "var(--book-text-secondary)",
              background: focusMode ? "var(--book-accent-subtle)" : "transparent",
              border: "1px solid var(--book-border)",
            }}
            aria-pressed={focusMode}
          >
            {focusMode ? "Exit focus" : "Focus"}
          </button>
          <button
            type="button"
            onClick={() => setAuditOpen((o) => !o)}
            className="rounded-lg px-3 py-1.5 text-sm lg:hidden"
            style={{
              color: "var(--book-text-secondary)",
              border: "1px solid var(--book-border)",
            }}
            aria-pressed={auditOpen}
          >
            Audit
          </button>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{
              color: "var(--book-text-secondary)",
              border: "1px solid var(--book-border)",
            }}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <button
            type="button"
            onClick={() => setPhoneOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              color: "var(--book-text-secondary)",
              border: "1px solid var(--book-border)",
            }}
          >
            Phone
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {showToc && (
          <nav
            className="shrink-0 border-b lg:w-56 lg:border-b-0 lg:border-r xl:w-60"
            style={{
              borderColor: "var(--book-border)",
              background: "var(--book-sidebar)",
            }}
            aria-label="Table of contents"
          >
            <div className="hidden px-4 pt-4 pb-2 lg:block">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--book-text-faint)" }}
              >
                Chapters
              </p>
            </div>
            <ul className="flex gap-0.5 overflow-x-auto p-2 lg:flex-col lg:overflow-x-visible lg:px-3 lg:pb-4">
              {book.chapters.map((ch, index) => {
                const active = ch.id === book.activeChapterId;
                return (
                  <li key={ch.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setBook({ ...book, activeChapterId: ch.id })}
                      className="flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition lg:py-2"
                      style={
                        active
                          ? {
                              background: "var(--book-accent-subtle)",
                              color: "var(--book-accent-text)",
                              boxShadow: "inset 3px 0 0 var(--book-accent)",
                            }
                          : {
                              color: "var(--book-text-muted)",
                            }
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "var(--book-sidebar-hover)";
                          e.currentTarget.style.color = "var(--book-text-secondary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--book-text-muted)";
                        }
                      }}
                    >
                      <span
                        className="mt-0.5 w-5 shrink-0 text-xs tabular-nums"
                        style={{ color: active ? "var(--book-accent)" : "var(--book-text-faint)" }}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={active ? "font-semibold" : "font-medium"}>{ch.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <main className="min-h-[50vh] min-w-0 flex-1 lg:min-h-0">
          <EditorPane
            title={activeChapter.title}
            body={activeChapter.body}
            onBodyChange={(body) => setChapterBody(activeChapter.id, body)}
            onContinue={() => void handleContinue()}
            continuing={continuing}
            continueError={continueError}
            instruction={instruction}
            onInstructionChange={setInstruction}
            mode={editorMode}
            onModeChange={setEditorMode}
          />
        </main>

        {!focusMode && (
          <div
            className={`h-56 w-full shrink-0 lg:block lg:h-auto lg:w-72 xl:w-80 ${auditOpen ? "block" : "hidden"}`}
          >
            <AuditPanel
              book={book}
              audit={audit}
              onAuditChange={setAudit}
              onChapterBody={setChapterBody}
              onClose={() => setAuditOpen(false)}
              showClose={!focusMode}
            />
          </div>
        )}
      </div>
      <PhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} theme={theme} />
    </div>
  );
}
