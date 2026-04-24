const statusMap: Record<string, { label: string; className: string }> = {
  created: {
    label: "Criada",
    className:
      "border-[var(--cp-accent)]/40 bg-[var(--cp-accent)]/12 text-[var(--cp-accent)]",
  },
  processing: {
    label: "Processando",
    className:
      "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/12 text-[var(--cp-info)]",
  },
  completed: {
    label: "Concluida",
    className:
      "border-[var(--cp-success)]/40 bg-[var(--cp-success)]/12 text-[var(--cp-success)]",
  },
  failed: {
    label: "Falhou",
    className:
      "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/12 text-[var(--cp-error)]",
  },
  cancelled: {
    label: "Cancelada",
    className:
      "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/12 text-[var(--cp-warning)]",
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
