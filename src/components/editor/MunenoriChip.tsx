import { LoaderCircle } from "lucide-react";

type Props = {
  onClick?: () => void;
  busy?: boolean;
  label?: string;
  disabled?: boolean;
};

export function MunenoriChip({ onClick, busy, label = "Fix with Munenori", disabled }: Props) {
  if (!onClick) {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--book-text-muted)" }}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="inline-flex items-center gap-1 text-xs font-medium disabled:opacity-50"
      style={{ color: "var(--book-accent-text)" }}
      aria-busy={busy}
    >
      {busy && <LoaderCircle size={12} className="animate-spin" aria-hidden />}
      {label}
    </button>
  );
}
