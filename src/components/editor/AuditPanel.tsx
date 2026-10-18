"use client";

import { useState } from "react";
import { openFindingsForChapter, resolveFinding, severityLabel } from "@/lib/book/audit";
import type { AuditFinding, AuditState, BookState } from "@/lib/book/types";
import { MunenoriChip } from "./MunenoriChip";

type Props = {
  book: BookState;
  audit: AuditState;
  onAuditChange: (audit: AuditState) => void;
  onChapterBody: (chapterId: string, body: string) => void;
};

export function AuditPanel({ book, audit, onAuditChange, onChapterBody }: Props) {
  const chapterId = book.activeChapterId;
  const findings = openFindingsForChapter(audit, chapterId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMunenoriFix(finding: AuditFinding) {
    const chapter = book.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    setBusyId(finding.id);
    setError(null);
    try {
      const res = await fetch("/api/llm/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "audit-fix",
          chapterTitle: chapter.title,
          body: chapter.body,
          auditIssue: finding.issue,
          auditExcerpt: finding.excerpt,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Munenori failed");

      let nextBody = chapter.body;
      if (finding.excerpt && chapter.body.includes(finding.excerpt)) {
        nextBody = chapter.body.replace(finding.excerpt, data.text ?? finding.excerpt);
      } else if (data.text) {
        nextBody = `${chapter.body}\n\n${data.text}\n`;
      }
      onChapterBody(chapterId, nextBody);
      onAuditChange(resolveFinding(audit, finding.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fix failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <aside className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950/50">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Audit
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {findings.length} open in this chapter
        </p>
      </header>
      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
        {findings.length === 0 && (
          <li className="text-sm text-zinc-500">No open findings for this chapter.</li>
        )}
        {findings.map((f) => (
          <li
            key={f.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                {severityLabel(f.severity)}
              </span>
              {f.resolver === "munenori" && (
                <MunenoriChip
                  busy={busyId === f.id}
                  onClick={() => void runMunenoriFix(f)}
                />
              )}
            </div>
            <p className="text-zinc-200">{f.issue}</p>
            <p className="mt-2 border-l-2 border-zinc-700 pl-2 text-xs text-zinc-500">
              {f.excerpt}
            </p>
          </li>
        ))}
      </ul>
      {error && (
        <p className="border-t border-zinc-800 px-4 py-2 text-xs text-amber-300">{error}</p>
      )}
    </aside>
  );
}
