import { IssueEvidenceList } from "@/components/analysis/issue-evidence-list";
import { IssueReviewBadge } from "@/components/analysis/issue-review-badge";
import { IssueReviewForm } from "@/components/analysis/issue-review-form";
import {
  getIssueSeverityAppearance,
  IssueSeverityBadge,
} from "@/components/analysis/issue-severity-badge";
import type { AnalysisIssue } from "@/lib/types/issue";

const ISSUE_TYPE_LABELS: Record<string, string> = {
  campo_ausente: "Campo não encontrado",
  check_address: "Verificação de endereço",
  check_project_number: "Verificação de número de projeto",
  check_work_name: "Verificação de nome da obra",
  divergencia_bairro: "Divergência no bairro",
  divergencia_endereco: "Divergência no endereço",
  divergencia_nome_obra: "Divergência no nome da obra",
  divergencia_projeto_numero: "Divergência no número do projeto",
  find_replace: "Substituição sugerida",
  find_text: "Ocorrência encontrada",
};

function humanizeIssueType(type: string): string {
  return ISSUE_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

type IssueCardProps = {
  cardId?: string;
  isFocused?: boolean;
  isSelected?: boolean;
  issue: AnalysisIssue;
  onToggleSelection?: (issueId: number) => void;
};

export function IssueCard({
  cardId,
  isFocused = false,
  isSelected = false,
  issue,
  onToggleSelection,
}: IssueCardProps) {
  const appearance = getIssueSeverityAppearance(issue.severity);

  return (
    <article
      id={cardId}
      className={`rounded-[1.75rem] border bg-[var(--cp-panel)]/85 p-5 ${appearance.cardClassName} ${isFocused ? "ring-2 ring-[var(--cp-accent)] ring-offset-2 ring-offset-transparent" : ""}`}
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {onToggleSelection ? (
            <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(issue.id)}
                className="h-4 w-4 rounded border border-[var(--cp-border)] bg-transparent accent-[var(--cp-accent)]"
              />
              Selecionar
            </label>
          ) : null}
          <h3 className="text-base font-semibold text-[var(--cp-text)]">
            {humanizeIssueType(issue.type)}
          </h3>
          <p className="font-mono text-xs text-[var(--cp-muted)]">{issue.type}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IssueReviewBadge
            status={issue.review_status}
            label={issue.review_status_label}
          />
          <IssueSeverityBadge severity={issue.severity} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--cp-text)]">
        {issue.description}
      </p>

      {issue.evidences.length > 0 ? (
        <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            Evidencias
          </p>
          <div className="mt-4">
            <IssueEvidenceList evidences={issue.evidences} />
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
          Revisao humana
        </p>
        <div className="mt-4">
          <IssueReviewForm issueId={issue.id} review={issue.review} />
        </div>
      </div>
    </article>
  );
}
