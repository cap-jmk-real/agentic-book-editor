"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";

type Props = {
  open: boolean;
  initialTerm: string;
  onSave: (term: string, explanation: string) => void;
  onCancel: () => void;
  useSheet?: boolean;
};

export function TermMarkDialog({ open, initialTerm, onSave, onCancel, useSheet }: Props) {
  const [term, setTerm] = useState(initialTerm);
  const [explanation, setExplanation] = useState("");

  if (!open) return null;

  const form = (
    <div className="space-y-3 p-4">
      <label className="block text-xs font-medium" style={{ color: "var(--book-text-muted)" }}>
        Term
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="mt-1 w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--book-border-strong)",
            background: "var(--book-page)",
            color: "var(--book-text)",
          }}
        />
      </label>
      <label className="block text-xs font-medium" style={{ color: "var(--book-text-muted)" }}>
        Explanation (optional)
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Add a short explanation readers will see"
          rows={3}
          className="mt-1 w-full resize-none rounded-md px-3 py-2 text-sm outline-none"
          style={{
            border: "1px solid var(--book-border-strong)",
            background: "var(--book-page)",
            color: "var(--book-text)",
          }}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-xs font-medium text-white"
          style={{ background: "var(--book-accent)" }}
          onClick={() => onSave(term.trim(), explanation.trim())}
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-md px-3 py-2 text-xs font-medium"
          style={{ color: "var(--book-text-secondary)" }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  if (useSheet) {
    return (
      <Sheet open={open} onClose={onCancel} title="Mark go-deeper term">
        {form}
      </Sheet>
    );
  }

  return (
    <div
      className="book-term-popover absolute z-40 w-72 rounded-lg shadow-lg"
      style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
      role="group"
      aria-label="Mark term form"
    >
      {form}
    </div>
  );
}
