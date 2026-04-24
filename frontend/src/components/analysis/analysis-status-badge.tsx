const statusMap: Record<string, { label: string; className: string }> = {
  created: {
    label: "Criada",
    className:
      "border-[var(--cp-accent)]/40 bg-[var(--cp-accent)]/12 text-[var(--cp-accent)]",
  },
};

export function AnalysisStatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? {
    label: status,
    className:
      "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/12 text-[var(--cp-info)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
