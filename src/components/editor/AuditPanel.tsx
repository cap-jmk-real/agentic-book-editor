"use client";

import { openFindingsForChapter, severityLabel } from "@/lib/book/audit";
import type { AuditFinding, AuditState, BookState } from "@/lib/book/types";
import type { AiProposal } from "@/lib/editor/aiProposal";
import { MunenoriChip } from "./MunenoriChip";

type Props = {
  book: BookState;
  audit: AuditState;
  onRequestFix: (finding: AuditFinding) => void;
  busyFindingId: string | null;
  munenoriOnline: boolean;
  onClose?: () => void;
  showClose?: boolean;
  activeProposal?: AiProposal | null;
};

export function AuditPanel({
  book,
  audit,
  onRequestFix,
  busyFindingId,
  munenoriOnline,
  onClose,
  showClose,
}: Props) {
  const chapterId = book.activeChapterId;
  const findings = openFindingsForChapter(audit, chapterId);

  return (
    <aside
      className="flex h-full flex-col border-l"
      style={{
        borderColor: "var(--book-border)",
        background: "var(--book-chrome)",
      }}
      data-testid="audit-panel"
    >
      <header
        className="flex items-start justify-between gap-2 border-b px-4 py-3"
        style={{ borderColor: "var(--book-border)" }}
      >
        <div>
          <h2 className="text-xs font-medium" style={{ color: "var(--book-text-faint)" }}>
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
            Close
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
              <SeverityTick severity={f.severity} />
              {f.resolver === "munenori" && (
                <MunenoriChip
                  busy={busyFindingId === f.id}
                  disabled={!munenoriOnline}
                  onClick={() => onRequestFix(f)}
                  label={munenoriOnline ? "Fix with Munenori" : "Munenori offline"}
                />
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
    </aside>
  );
}

function SeverityTick({ severity }: { severity: AuditFinding["severity"] }) {
  const colors: Record<string, string> = {
    info: "var(--book-accent)",
    warn: "var(--book-warning)",
    error: "var(--book-danger)",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--book-text-muted)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: colors[severity] }} aria-hidden />
      {severityLabel(severity)}
    </span>
  );
}
