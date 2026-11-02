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
  onClose?: () => void;
  showClose?: boolean;
};

export function AuditPanel({
  book,
  audit,
  onAuditChange,
  onChapterBody,
  onClose,
  showClose,
}: Props) {
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
    <aside
      className="flex h-full flex-col border-l"
      style={{
        borderColor: "var(--book-border)",
        background: "var(--book-chrome)",
      }}
    >
      <header
        className="flex items-start justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--book-border)" }}
      >
        <div>
          <h2
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--book-text-faint)" }}
          >
            Audit
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--book-text-secondary)" }}>
            <span className="font-semibold tabular-nums">{findings.length}</span>
            <span style={{ color: "var(--book-text-muted)" }}> open in this chapter</span>
          </p>
        </div>
        {showClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs font-medium lg:hidden"
            style={{ color: "var(--book-text-muted)" }}
          >
            Hide
          </button>
        )}
      </header>
      <ul className="flex-1 space-y-3 overflow-y-auto p-4">
        {findings.length === 0 && (
          <li className="text-sm" style={{ color: "var(--book-text-muted)" }}>
            No open findings for this chapter.
          </li>
        )}
        {findings.map((f) => (
          <li
            key={f.id}
            className="rounded-lg p-3 text-sm"
            style={{
              border: "1px solid var(--book-border)",
              background: "var(--book-page)",
            }}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={f.severity} />
              {f.resolver === "munenori" && (
                <MunenoriChip busy={busyId === f.id} onClick={() => void runMunenoriFix(f)} />
              )}
            </div>
            <p style={{ color: "var(--book-text)" }}>{f.issue}</p>
            <p
              className="mt-2 border-l-2 pl-2 text-xs leading-relaxed"
              style={{
                borderColor: "var(--book-border-strong)",
                color: "var(--book-text-muted)",
              }}
            >
              {f.excerpt}
            </p>
          </li>
        ))}
      </ul>
      {error && (
        <p
          className="border-t px-4 py-2 text-xs"
          style={{ borderColor: "var(--book-border)", color: "var(--book-warning)" }}
        >
          {error}
        </p>
      )}
    </aside>
  );
}

function SeverityBadge({ severity }: { severity: AuditFinding["severity"] }) {
  const label = severityLabel(severity);
  const styles: Record<string, { bg: string; color: string }> = {
    info: {
      bg: "var(--book-accent-subtle)",
      color: "var(--book-accent-text)",
    },
    warn: {
      bg: "var(--book-warning-bg)",
      color: "var(--book-warning)",
    },
    error: {
      bg: "color-mix(in srgb, var(--book-danger) 12%, transparent)",
      color: "var(--book-danger)",
    },
  };
  const s = styles[severity] ?? styles.info;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {label}
    </span>
  );
}
