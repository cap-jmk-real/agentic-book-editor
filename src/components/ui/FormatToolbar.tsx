"use client";

import { Bold, Code, Italic, Minus, Heading } from "lucide-react";
import { useState } from "react";
import { useVisualViewportBottom } from "@/hooks/useVisualViewport";
import { IconButton } from "./IconButton";

type Props = {
  onBold: () => void;
  onItalic: () => void;
  onCode: () => void;
  onHr: () => void;
  onHeading: (level: 1 | 2 | 3) => void;
};

export function FormatToolbar({ onBold, onItalic, onCode, onHr, onHeading }: Props) {
  const keyboardGap = useVisualViewportBottom();
  const [headingsOpen, setHeadingsOpen] = useState(false);

  return (
    <div
      className="book-format-toolbar fixed left-0 right-0 z-30 flex h-11 items-center gap-1 overflow-x-auto px-3 pb-[env(safe-area-inset-bottom)] lg:static lg:z-auto lg:h-auto lg:justify-center lg:border-t lg:px-4 lg:py-2"
      style={{
        bottom: keyboardGap,
        borderColor: "var(--book-border)",
        background: "color-mix(in srgb, var(--book-chrome) 94%, transparent)",
        backdropFilter: "blur(8px)",
      }}
      role="toolbar"
      aria-label="Formatting"
    >
      <div className="relative flex items-center gap-0.5">
        <IconButton icon={Heading} label="Heading" onClick={() => setHeadingsOpen((o) => !o)} />
        {headingsOpen && (
          <div
            className="absolute bottom-full left-0 mb-1 flex gap-0.5 rounded-md p-1 shadow-sm"
            style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
          >
            {([1, 2, 3] as const).map((level) => (
              <button
                key={level}
                type="button"
                className="rounded px-2 py-1 text-xs font-medium"
                style={{ color: "var(--book-text-secondary)" }}
                onClick={() => {
                  onHeading(level);
                  setHeadingsOpen(false);
                }}
              >
                H{level}
              </button>
            ))}
          </div>
        )}
      </div>
      <IconButton icon={Bold} label="Bold" onClick={onBold} />
      <IconButton icon={Italic} label="Italic" onClick={onItalic} />
      <IconButton icon={Code} label="Code" onClick={onCode} />
      <IconButton icon={Minus} label="Horizontal rule" onClick={onHr} />
    </div>
  );
}
