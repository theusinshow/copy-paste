import Link from "next/link";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { getAnalysisModeLabel } from "@/lib/analysis/analysis-modes";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun } from "@/lib/types/analysis";

type AnalysisResultHeaderProps = {
  analysis: AnalysisRun;
  attentionCount: number;
  issueCount: number;
  relevantCount: number;
};

export function AnalysisResultHeader({
  analysis,
  attentionCount,
  issueCount,
  relevantCount,
}: AnalysisResultHeaderProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <div className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-8">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-full border border-[var(--cp-border)] px-4 py-2 text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
          >
            Voltar para analises
          </Link>
          <span className="rounded-full bg-[var(--cp-accent)]/10 px-4 py-2 font-medium text-[var(--cp-accent)]">
            Resultado tecnico
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--cp-accent)]">
              Analise #{analysis.id.toString().padStart(4, "0")}
            </p>
            <AnalysisModeBadge mode={analysis.analysis_mode} />
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--cp-text)]">
              Resultado e evidencias das issues encontradas.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--cp-muted)]">
              Esta tela resume o status da analise e lista as issues geradas com
              evidencia textual derivada dos campos extraidos.
            </p>
          </div>
          <AnalysisStatusBadge status={analysis.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <MetricCard label="Criada em" value={formatAnalysisDate(analysis.created_at)} />
        <MetricCard label="Modo" value={getAnalysisModeLabel(analysis.analysis_mode)} />
        <MetricCard label="Issues totais" value={issueCount.toString().padStart(2, "0")} />
        <MetricCard
          label="Severidades"
          value={`${relevantCount} relevante / ${attentionCount} atencao`}
        />
      </div>
    </section>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article
      className="rounded-[1.75rem] border border-[var(--cp-border)] bg-black/15 p-5"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
        {props.label}
      </p>
      <p className="mt-4 text-sm font-medium leading-6 text-[var(--cp-text)]">
        {props.value}
      </p>
    </article>
  );
}
