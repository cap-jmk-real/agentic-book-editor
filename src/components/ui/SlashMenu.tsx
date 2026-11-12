"use client";

import type { LucideIcon } from "lucide-react";

export type SlashItem = {
  id: string;
  label: string;
  hint: string;
  icon?: LucideIcon;
};

type Props = {
  items: SlashItem[];
  activeIndex: number;
  onPick: (id: string) => void;
};

export function SlashMenu({ items, activeIndex, onPick }: Props) {
  if (items.length === 0) return null;
  return (
    <div
      className="book-slash-menu absolute left-4 z-20 w-72 overflow-hidden rounded-lg shadow-md sm:left-8"
      style={{ background: "var(--book-page)", border: "1px solid var(--book-border)" }}
    >
      <ul className="py-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm"
                style={{
                  background: index === activeIndex ? "var(--book-sidebar)" : "transparent",
                  color: "var(--book-text)",
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPick(item.id)}
              >
                {Icon && <Icon size={16} strokeWidth={1.5} style={{ color: "var(--book-text-muted)" }} />}
                <span>
                  <span className="font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-xs" style={{ color: "var(--book-text-faint)" }}>
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
