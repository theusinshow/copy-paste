import { IssueEvidenceList } from "@/components/analysis/issue-evidence-list";
import {
  getIssueSeverityAppearance,
  IssueSeverityBadge,
} from "@/components/analysis/issue-severity-badge";
import type { AnalysisIssue } from "@/lib/types/issue";

export function IssueCard({ issue }: { issue: AnalysisIssue }) {
  const appearance = getIssueSeverityAppearance(issue.severity);

  return (
    <article
      className={`rounded-[1.75rem] border bg-[var(--cp-panel)]/85 p-5 ${appearance.cardClassName}`}
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            Tipo
          </p>
          <h3 className="font-mono text-lg font-semibold text-[var(--cp-text)]">
            {issue.type}
          </h3>
        </div>
        <IssueSeverityBadge severity={issue.severity} />
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--cp-text)]">
        {issue.description}
      </p>

      <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
          Evidencia textual
        </p>
        <div className="mt-4">
          <IssueEvidenceList evidences={issue.evidences} />
        </div>
      </div>
    </article>
  );
}
