type Props = {
  onClick?: () => void;
  busy?: boolean;
  label?: string;
};

export function MunenoriChip({ onClick, busy, label = "Munenori" }: Props) {
  const base =
    "inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-200";
  if (!onClick) {
    return <span className={base}>{label}</span>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`${base} transition hover:bg-violet-500/20 disabled:opacity-50`}
    >
      {busy ? "…" : label}
    </button>
  );
}
