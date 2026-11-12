type Props = {
  online?: boolean;
  loading?: boolean;
  label?: string;
};

export function StatusDot({ online, loading, label = "Munenori" }: Props) {
  const title =
    loading ? "Checking Munenori…" : online ? "Munenori is online" : "Munenori is offline";
  return (
    <span className="inline-flex items-center gap-2 text-xs" title={title}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background: loading
            ? "var(--book-text-faint)"
            : online
              ? "var(--book-success)"
              : "var(--book-text-faint)",
        }}
        aria-hidden
      />
      <span style={{ color: "var(--book-text-muted)" }}>{label}</span>
    </span>
  );
}
