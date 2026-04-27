export const AUDIT_CLOSURE_OPTIONS = [
  {
    description: "Pacote sem ponto relevante ativo no fechamento humano.",
    label: "Sem pontos relevantes",
    value: "clean",
  },
  {
    description: "Pacote pode ser encerrado, mas com pontos formais para revisar.",
    label: "Com pontos para revisar",
    value: "needs_review",
  },
  {
    description: "Encerramento com ponto relevante registrado formalmente.",
    label: "Com pontos para verificar",
    value: "relevant_issue",
  },
  {
    description: "Encerramento bloqueado por falta de evidência suficiente.",
    label: "Análise incompleta por falta de evidência",
    value: "incomplete",
  },
] as const;

export type AuditClosureCode =
  (typeof AUDIT_CLOSURE_OPTIONS)[number]["value"];

const auditClosureLabelMap: Record<AuditClosureCode, string> = {
  clean: "Sem pontos relevantes",
  incomplete: "Análise incompleta por falta de evidência",
  needs_review: "Com pontos para revisar",
  relevant_issue: "Com pontos para verificar",
};

export function getAuditClosureLabel(value: string) {
  return auditClosureLabelMap[value as AuditClosureCode] ?? value;
}
