const severityMap: Record<
  string,
  { cardClassName: string; label: string; pillClassName: string }
> = {
  atencao: {
    cardClassName: "border-[var(--cp-warning)]/35",
    label: "Atencao",
    pillClassName:
      "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/12 text-[var(--cp-warning)]",
  },
  info: {
    cardClassName: "border-[var(--cp-info)]/35",
    label: "Info",
    pillClassName:
      "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/12 text-[var(--cp-info)]",
  },
  relevante: {
    cardClassName: "border-[var(--cp-error)]/35",
    label: "Relevante",
    pillClassName:
      "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/12 text-[var(--cp-error)]",
  },
};

export function IssueSeverityBadge({ severity }: { severity: string }) {
  const appearance = getIssueSeverityAppearance(severity);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${appearance.pillClassName}`}
    >
      {appearance.label}
    </span>
  );
}

export function getIssueSeverityAppearance(severity: string) {
  return (
    severityMap[severity] ?? {
      cardClassName: "border-[var(--cp-info)]/35",
      label: severity,
      pillClassName:
        "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/12 text-[var(--cp-info)]",
    }
  );
}
