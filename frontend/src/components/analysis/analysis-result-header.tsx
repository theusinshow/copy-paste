import Link from "next/link";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { getAnalysisModeLabel } from "@/lib/analysis/analysis-modes";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun, AuditSummary } from "@/lib/types/analysis";

type AnalysisResultHeaderProps = {
  analysis: AnalysisRun;
  attentionCount: number;
  auditSummary: AuditSummary | null;
  issueCount: number;
  relevantCount: number;
};

export function AnalysisResultHeader({
  analysis,
  attentionCount,
  auditSummary,
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
            Resultado da revisao
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-accent)]">
              Analise #{analysis.id.toString().padStart(4, "0")}
            </p>
            <AnalysisModeBadge mode={analysis.analysis_mode} />
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
              Resumo da revisao dos arquivos.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
              Veja abaixo o que foi encontrado, o que precisa de atencao e as
              evidencias usadas para chegar a esse resultado.
            </p>
          </div>
          <AnalysisStatusBadge status={analysis.status} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <MetricCard label="Criada em" value={formatAnalysisDate(analysis.created_at)} />
        <MetricCard
          label="Tipo de analise"
          value={getAnalysisModeLabel(analysis.analysis_mode)}
        />
        <MetricCard
          label="Resumo final"
          value={auditSummary?.status.label || "Aguardando consolidado"}
        />
        <MetricCard
          label="Itens encontrados"
          value={issueCount.toString().padStart(2, "0")}
        />
        <MetricCard
          label="Conflitos e atencao"
          value={`${relevantCount} conflito(s) / ${attentionCount} revisar`}
        />
        <MetricCard
          label="Itens ja revisados"
          value={
            auditSummary
              ? `${auditSummary.metrics.reviewed_issue_count}/${auditSummary.metrics.issue_count} revisados · ${auditSummary.metrics.pending_review_count} pendente(s)`
              : "Sem consolidado"
          }
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
