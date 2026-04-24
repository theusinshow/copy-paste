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
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/"
            className="rounded-lg border border-[var(--cp-border)] px-3 py-2 text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
          >
            Voltar
          </Link>
          <span className="rounded-lg bg-[var(--cp-accent)]/10 px-3 py-2 font-medium text-[var(--cp-accent)]">
            Resultado tecnico
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-accent)]">
              Analise #{analysis.id.toString().padStart(4, "0")}
            </p>
            <AnalysisModeBadge mode={analysis.analysis_mode} />
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
              Resultado consolidado da auditoria.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
              Use os blocos abaixo para revisar identidade do pacote,
              cruzamento de LDs, memoriais e evidencias extraidas.
            </p>
          </div>
          <AnalysisStatusBadge status={analysis.status} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
      className="rounded-lg border border-[var(--cp-border)] bg-black/15 p-4"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        {props.label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
        {props.value}
      </p>
    </article>
  );
}
