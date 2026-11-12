"use client";

import { Bold, BookMarked, Italic, Sparkles } from "lucide-react";
import { IconButton } from "./IconButton";

type Props = {
  visible: boolean;
  onBold: () => void;
  onItalic: () => void;
  onMarkTerm: () => void;
  onRewrite: () => void;
  markDisabled?: boolean;
  markDisabledReason?: string;
  offline?: boolean;
};

export function SelectionBubble({
  visible,
  onBold,
  onItalic,
  onMarkTerm,
  onRewrite,
  markDisabled,
  markDisabledReason,
  offline,
}: Props) {
  if (!visible) return null;
  return (
    <div
      className="book-selection-bubble flex flex-wrap items-center gap-0.5 rounded-lg px-1 py-1 shadow-md"
      style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
      role="toolbar"
      aria-label="Selection actions"
    >
      <IconButton icon={Bold} label="Bold" size="sm" onClick={onBold} />
      <IconButton icon={Italic} label="Italic" size="sm" onClick={onItalic} />
      <span className="mx-0.5 h-5 w-px" style={{ background: "var(--book-border)" }} aria-hidden />
      <button
        type="button"
        className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium disabled:opacity-40"
        style={{ color: "var(--book-text-secondary)" }}
        disabled={markDisabled}
        title={markDisabled ? markDisabledReason : "Mark as go-deeper term"}
        onClick={onMarkTerm}
      >
        <BookMarked size={14} strokeWidth={1.5} />
        Go deeper
      </button>
      <button
        type="button"
        className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium disabled:opacity-40"
        style={{ color: "var(--book-text-secondary)" }}
        disabled={offline}
        title={offline ? "Munenori is offline" : "Rewrite with Munenori"}
        onClick={onRewrite}
      >
        <Sparkles size={14} strokeWidth={1.5} />
        Rewrite
      </button>
    </div>
  );
}
