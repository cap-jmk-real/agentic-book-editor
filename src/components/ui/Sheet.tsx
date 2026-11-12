"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Max height as CSS value, e.g. 85vh */
  maxHeight?: string;
};

export function Sheet({ open, onClose, title, children, maxHeight = "85vh" }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="book-sheet-root fixed inset-0 z-50 flex flex-col justify-end pb-[env(safe-area-inset-bottom)] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="book-sheet-panel relative flex max-h-[var(--sheet-max)] flex-col rounded-t-xl outline-none"
        style={{
          ["--sheet-max" as string]: maxHeight,
          background: "var(--book-chrome)",
          borderTop: "1px solid var(--book-border)",
          maxHeight,
        }}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full"
          style={{ background: "var(--book-border-strong)" }}
          aria-hidden
        />
        <header
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--book-border)" }}
        >
          <h2 id={titleId} className="text-sm font-medium" style={{ color: "var(--book-text)" }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="book-icon-btn flex h-9 w-9 items-center justify-center rounded-md"
            aria-label="Close"
            style={{ color: "var(--book-text-muted)" }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
