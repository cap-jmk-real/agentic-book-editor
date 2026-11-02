type Props = {
  onClick?: () => void;
  busy?: boolean;
  label?: string;
};

export function MunenoriChip({ onClick, busy, label = "Munenori" }: Props) {
  const base =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition";
  const style = {
    color: "var(--book-accent-text)",
    background: "var(--book-accent-subtle)",
    border: "1px solid color-mix(in srgb, var(--book-accent) 35%, transparent)",
  };
  if (!onClick) {
    return (
      <span className={base} style={style}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`${base} disabled:opacity-50`}
      style={style}
    >
      {busy ? "…" : label}
    </button>
  );
}
