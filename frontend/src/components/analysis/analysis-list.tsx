import Link from "next/link";

import { AnalysisCard } from "@/components/analysis/analysis-card";
import { AnalysisEmptyState } from "@/components/analysis/analysis-empty-state";
import type { AnalysisRun } from "@/lib/types/analysis";

type AnalysisListProps = {
  analyses: AnalysisRun[];
  loadError?: string | null;
};

export function AnalysisList({ analyses, loadError }: AnalysisListProps) {
  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Lista de analises
          </p>
          <h2 className="text-2xl font-semibold text-[var(--cp-text)]">
            Visao inicial das analises cadastradas.
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
            Esta lista usa o endpoint atual do backend e mostra o minimo
            necessario para seguir ao fluxo de upload inicial.
          </p>
        </div>

        <Link
          href="/analysis/new"
          className="inline-flex items-center justify-center rounded-full border border-[var(--cp-border)] px-4 py-2 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
        >
          Abrir nova analise
        </Link>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-2xl border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      <div className="mt-6">
        {analyses.length === 0 ? (
          <AnalysisEmptyState />
        ) : (
          <div className="grid gap-4">
            {analyses.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
