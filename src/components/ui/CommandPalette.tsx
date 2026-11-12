"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

export type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  disabledReason?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  actions: PaletteAction[];
};

export function CommandPalette({ open, onClose, actions }: Props) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = actions.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
      return;
    }
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/25 px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="book-palette relative w-full max-w-md overflow-hidden rounded-xl shadow-lg"
        style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
      >
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands…"
          className="w-full border-0 bg-transparent px-4 py-3 text-sm outline-none"
          style={{ color: "var(--book-text)", borderBottom: "1px solid var(--book-border)" }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[active] && !filtered[active].disabled) {
              e.preventDefault();
              filtered[active].run();
              onClose();
            }
          }}
        />
        <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
          {filtered.map((action, index) => {
            const Icon = action.icon;
            return (
              <li key={action.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  disabled={action.disabled}
                  title={action.disabled ? action.disabledReason : undefined}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm disabled:opacity-40"
                  style={{
                    background: index === active ? "var(--book-sidebar)" : "transparent",
                    color: "var(--book-text)",
                  }}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    if (action.disabled) return;
                    action.run();
                    onClose();
                  }}
                >
                  {Icon && <Icon size={16} strokeWidth={1.5} style={{ color: "var(--book-text-muted)" }} />}
                  <span className="flex-1">
                    <span className="font-medium">{action.label}</span>
                    {action.hint && (
                      <span className="mt-0.5 block text-xs" style={{ color: "var(--book-text-faint)" }}>
                        {action.hint}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
