"use client";

import { useCallback, useEffect, useState } from "react";
import { loadAudit, loadBook, saveAudit, saveBook } from "@/lib/book/storage";
import type { AuditState, BookState } from "@/lib/book/types";
import { AuditPanel } from "./AuditPanel";
import { EditorPane } from "./EditorPane";
import { MunenoriStatus } from "./MunenoriStatus";
import { PhoneModal } from "./PhoneModal";

export function BookEditor() {
  const [book, setBook] = useState<BookState | null>(null);
  const [audit, setAudit] = useState<AuditState | null>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  useEffect(() => {
    setBook(loadBook());
    setAudit(loadAudit());
  }, []);

  useEffect(() => {
    if (book) saveBook(book);
  }, [book]);

  useEffect(() => {
    if (audit) saveAudit(audit);
  }, [audit]);

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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Agentic Book Editor</p>
          <p className="text-sm font-medium text-zinc-200">{book.title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <MunenoriStatus />
          <button
            type="button"
            onClick={() => setPhoneOpen(true)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
          >
            Phone
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav className="border-b border-zinc-800 lg:w-48 lg:border-b-0 lg:border-r">
          <ul className="flex gap-1 overflow-x-auto p-2 lg:flex-col">
            {book.chapters.map((ch) => (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => setBook({ ...book, activeChapterId: ch.id })}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    ch.id === book.activeChapterId
                      ? "bg-violet-600/20 text-violet-100"
                      : "text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  {ch.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-h-[50vh] flex-1 lg:min-h-0">
          <EditorPane
            title={activeChapter.title}
            body={activeChapter.body}
            onBodyChange={(body) => setChapterBody(activeChapter.id, body)}
            onContinue={() => void handleContinue()}
            continuing={continuing}
            continueError={continueError}
            instruction={instruction}
            onInstructionChange={setInstruction}
          />
        </main>
        <div className="h-64 w-full lg:h-auto lg:w-80">
          <AuditPanel
            book={book}
            audit={audit}
            onAuditChange={setAudit}
            onChapterBody={setChapterBody}
          />
        </div>
      </div>
      <PhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </div>
  );
}
