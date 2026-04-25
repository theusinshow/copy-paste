import Link from "next/link";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun } from "@/lib/types/analysis";

type AnalysisResultHeaderProps = {
  analysis: AnalysisRun;
};

export function AnalysisResultHeader({ analysis }: AnalysisResultHeaderProps) {
  const rerunParams = new URLSearchParams({ mode: analysis.analysis_mode });
  const config = analysis.config as Record<string, unknown>;
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      rerunParams.set(`cfg_${key}`, value);
    }
  }

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
        <Link
          href={`/?${rerunParams.toString()}`}
          className="rounded-none border border-[var(--cp-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
        >
          Repetir modo
        </Link>
        <AnalysisStatusBadge status={analysis.status} />
      </div>
    </section>
  );
}
