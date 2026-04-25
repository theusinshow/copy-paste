export const REVIEW_DECISION_OPTIONS = [
  {
    description: "Mantem a issue aberta como achado valido do pacote.",
    label: "Confirmada",
    value: "confirmada",
  },
  {
    description: "Fecha a issue porque a regra apontou um conflito inexistente.",
    label: "Falso positivo",
    value: "falso_positivo",
  },
  {
    description: "Registra que o ponto foi corrigido fora do sistema.",
    label: "Corrigido",
    value: "corrigido",
  },
  {
    description: "Fecha a issue porque ela nao se aplica ao pacote revisado.",
    label: "Nao aplicavel",
    value: "nao_aplicavel",
  },
  {
    description: "Marca que a evidencia disponivel nao permite concluir o caso.",
    label: "Sem evidencia",
    value: "sem_evidencia",
  },
] as const;

export type ReviewDecisionCode =
  (typeof REVIEW_DECISION_OPTIONS)[number]["value"];

export type IssueReviewStatus =
  | "active"
  | "dismissed"
  | "inconclusive"
  | "pending_review"
  | "resolved";

const reviewDecisionLabelMap: Record<ReviewDecisionCode, string> = {
  confirmada: "Confirmada",
  corrigido: "Corrigido",
  falso_positivo: "Falso positivo",
  nao_aplicavel: "Nao aplicavel",
  sem_evidencia: "Sem evidencia",
};

const reviewStatusAppearanceMap: Record<
  IssueReviewStatus,
  { label: string; pillClassName: string }
> = {
  active: {
    label: "Ativa",
    pillClassName:
      "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/12 text-[var(--cp-error)]",
  },
  dismissed: {
    label: "Descartada",
    pillClassName:
      "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/12 text-[var(--cp-info)]",
  },
  inconclusive: {
    label: "Sem evidencia",
    pillClassName:
      "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)]",
  },
  pending_review: {
    label: "Pendente",
    pillClassName:
      "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/12 text-[var(--cp-warning)]",
  },
  resolved: {
    label: "Resolvida",
    pillClassName:
      "border-[var(--cp-success)]/30 bg-[var(--cp-success)]/12 text-[var(--cp-success)]",
  },
};

export function getReviewDecisionLabel(decision: string) {
  return reviewDecisionLabelMap[decision as ReviewDecisionCode] ?? decision;
}

export function getReviewStatusAppearance(status: string) {
  return (
    reviewStatusAppearanceMap[status as IssueReviewStatus] ?? {
      label: status,
      pillClassName: "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)]",
    }
  );
}

export function normalizeReviewDecisionValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return REVIEW_DECISION_OPTIONS.some((option) => option.value === value)
    ? value
    : "";
}
