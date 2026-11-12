"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  size?: "sm" | "md";
  active?: boolean;
};

export function IconButton({ icon: Icon, label, size = "md", active, className = "", ...rest }: Props) {
  const dim = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`book-icon-btn inline-flex shrink-0 items-center justify-center rounded-md transition ${dim} ${className}`}
      data-active={active ? "true" : undefined}
      style={{ color: active ? "var(--book-accent-text)" : "var(--book-text-secondary)" }}
      {...rest}
    >
      <Icon size={size === "sm" ? 16 : 18} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
