"use client";

import type { BookState, GoDeeperTerm } from "@/lib/book/types";

type Props = {
  book: BookState;
  chapterId: string;
  onAccept: (term: GoDeeperTerm, explanation?: string) => void;
  onReject: (termId: string) => void;
  onRemove: (termId: string) => void;
  onEditExplanation: (termId: string, explanation: string) => void;
};

export function TermsPanel({ book, chapterId, onAccept, onReject, onRemove, onEditExplanation }: Props) {
  const terms = book.terms.filter((t) => t.chapterId === chapterId && t.status !== "rejected");
  const accepted = terms.filter((t) => t.status === "accepted");
  const suggested = terms.filter((t) => t.status === "suggested");

  return (
    <aside className="flex h-full flex-col">
      <header className="border-b px-4 py-3" style={{ borderColor: "var(--book-border)" }}>
        <h2 className="text-xs font-medium" style={{ color: "var(--book-text-faint)" }}>
          Terms
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--book-text-secondary)" }}>
          {accepted.length} marked · {suggested.length} suggested
        </p>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {suggested.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-medium" style={{ color: "var(--book-text-faint)" }}>
              Suggested terms
            </h3>
            <ul className="space-y-2">
              {suggested.map((t) => (
                <TermRow
                  key={t.id}
                  term={t}
                  stale={t.ranges.length === 0}
                  onAccept={() => onAccept(t, t.explanation)}
                  onReject={() => onReject(t.id)}
                />
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3 className="mb-2 text-xs font-medium" style={{ color: "var(--book-text-faint)" }}>
            Marked terms
          </h3>
          <ul className="space-y-2">
            {accepted.length === 0 && (
              <li className="text-sm" style={{ color: "var(--book-text-muted)" }}>
                No terms marked in this chapter.
              </li>
            )}
            {accepted.map((t) => (
              <li
                key={t.id}
                className="rounded-lg p-3 text-sm"
                style={{ border: "1px solid var(--book-border)", background: "var(--book-page)" }}
              >
                <p className="font-medium" style={{ color: "var(--book-text)" }}>
                  {t.term}
                </p>
                {t.ranges.length === 0 && (
                  <p className="mt-1 text-xs" style={{ color: "var(--book-warning)" }}>
                    Not found in this chapter
                  </p>
                )}
                <textarea
                  defaultValue={t.explanation ?? ""}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-md px-2 py-1.5 text-xs outline-none"
                  style={{
                    border: "1px solid var(--book-border)",
                    color: "var(--book-text-secondary)",
                  }}
                  onBlur={(e) => onEditExplanation(t.id, e.target.value)}
                  placeholder="Explanation for readers"
                />
                <button
                  type="button"
                  className="mt-2 text-xs font-medium"
                  style={{ color: "var(--book-danger)" }}
                  onClick={() => onRemove(t.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

function TermRow({
  term,
  stale,
  onAccept,
  onReject,
}: {
  term: GoDeeperTerm;
  stale?: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <li
      className="rounded-lg p-3 text-sm"
      style={{ border: "1px solid var(--book-border)", background: "var(--book-page)" }}
    >
      <p className="font-medium" style={{ color: "var(--book-text)" }}>
        {term.term}
      </p>
      {stale && (
        <p className="text-xs" style={{ color: "var(--book-warning)" }}>
          Not found in this chapter
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          className="text-xs font-medium"
          style={{ color: "var(--book-accent-text)" }}
          onClick={onAccept}
        >
          Accept
        </button>
        <button
          type="button"
          className="text-xs font-medium"
          style={{ color: "var(--book-text-muted)" }}
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </li>
  );
}
