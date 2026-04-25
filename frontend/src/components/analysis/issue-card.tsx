import { IssueEvidenceList } from "@/components/analysis/issue-evidence-list";
import { IssueReviewBadge } from "@/components/analysis/issue-review-badge";
import { IssueReviewForm } from "@/components/analysis/issue-review-form";
import {
  getIssueSeverityAppearance,
  IssueSeverityBadge,
} from "@/components/analysis/issue-severity-badge";
import type { AnalysisIssue } from "@/lib/types/issue";

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
  const primaryEvidence = issue.evidences[0] ?? null;

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
              Selecionar issue
            </label>
          ) : null}
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            Tipo
          </p>
          <h3 className="font-mono text-lg font-semibold text-[var(--cp-text)]">
            {issue.type}
          </h3>
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

      {primaryEvidence ? (
        <div className="mt-4 rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            Evidencia principal
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--cp-text)]">
            pagina {primaryEvidence.page} · {primaryEvidence.text}
          </p>
        </div>
      ) : null}

      <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
          Evidencia textual
        </p>
        <div className="mt-4">
          <IssueEvidenceList evidences={issue.evidences} />
        </div>
      </div>

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
