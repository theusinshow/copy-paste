import Link from "next/link";

import { AnalysisCard } from "@/components/analysis/analysis-card";
import { AnalysisEmptyState } from "@/components/analysis/analysis-empty-state";
import type { AnalysisRun } from "@/lib/types/analysis";

type AnalysisListProps = {
  analyses: AnalysisRun[];
  loadError?: string | null;
  variant?: "default" | "compact";
};

export function AnalysisList({
  analyses,
  loadError,
  variant = "default",
}: AnalysisListProps) {
  const isCompact = variant === "compact";

  return (
    <section
      className={
        isCompact
          ? "rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 opacity-80 transition-opacity hover:opacity-100"
          : "rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      }
      style={isCompact ? undefined : { boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Historico
          </p>
          <h2
            className={
              isCompact
                ? "text-base font-semibold text-[var(--cp-text)]"
                : "text-2xl font-semibold text-[var(--cp-text)]"
            }
          >
            Analises feitas
          </h2>
          {isCompact ? null : (
            <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
              Esta lista usa o endpoint atual do backend para abrir a Central de
              Analise e consultar o resultado tecnico de cada execucao.
            </p>
          )}
        </div>

        {isCompact ? (
          <span className="text-xs text-[var(--cp-muted)]">
            {analyses.length} registro(s)
          </span>
        ) : (
          <Link
            href="/analysis/new"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] px-4 py-2 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
            Abrir Central
          </Link>
        )}
      </div>

      {loadError ? (
        <div className="mt-6 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
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
