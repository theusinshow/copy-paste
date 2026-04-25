import Link from "next/link";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun, AuditSummary } from "@/lib/types/analysis";

type AnalysisResultHeaderProps = {
  analysis: AnalysisRun;
  auditSummary: AuditSummary | null;
};

export function AnalysisResultHeader({
  analysis,
  auditSummary,
}: AnalysisResultHeaderProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
        >
          ← Voltar
        </Link>
        <AnalysisModeBadge mode={analysis.analysis_mode} />
        <span className="text-sm text-[var(--cp-muted)]">
          #{analysis.id.toString().padStart(4, "0")} ·{" "}
          {formatAnalysisDate(analysis.created_at)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {auditSummary ? (
          <span className="text-sm font-medium text-[var(--cp-text)]">
            {auditSummary.status.label}
          </span>
        ) : null}
        <AnalysisStatusBadge status={analysis.status} />
      </div>
    </section>
  );
}
