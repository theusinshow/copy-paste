export const AUDIT_CLOSURE_OPTIONS = [
  {
    description: "Pacote sem conflito relevante ativo no fechamento humano.",
    label: "Sem incongruencia relevante",
    value: "clean",
  },
  {
    description: "Pacote pode ser encerrado, mas com pontos formais de atencao.",
    label: "Com pontos de atencao",
    value: "needs_review",
  },
  {
    description: "Encerramento com incongruencia relevante registrada formalmente.",
    label: "Com incongruencia relevante",
    value: "relevant_issue",
  },
  {
    description: "Encerramento bloqueado por falta de evidencia suficiente.",
    label: "Analise incompleta por falta de evidencia",
    value: "incomplete",
  },
] as const;

export type AuditClosureCode =
  (typeof AUDIT_CLOSURE_OPTIONS)[number]["value"];

const auditClosureLabelMap: Record<AuditClosureCode, string> = {
  clean: "Sem incongruencia relevante",
  incomplete: "Analise incompleta por falta de evidencia",
  needs_review: "Com pontos de atencao",
  relevant_issue: "Com incongruencia relevante",
};

export function getAuditClosureLabel(value: string) {
  return auditClosureLabelMap[value as AuditClosureCode] ?? value;
}
