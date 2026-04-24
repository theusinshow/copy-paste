import Link from "next/link";

import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { formatAnalysisDate } from "@/lib/formatters";
import type { AnalysisRun } from "@/lib/types/analysis";

export function AnalysisCard({ analysis }: { analysis: AnalysisRun }) {
  return (
    <article
      className="rounded-[1.75rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-muted)]">
            Analise
          </p>
          <h3 className="font-mono text-2xl font-semibold text-[var(--cp-text)]">
            #{analysis.id.toString().padStart(4, "0")}
          </h3>
        </div>
        <AnalysisStatusBadge status={analysis.status} />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/4 p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            Criada em
          </dt>
          <dd className="mt-2 text-sm font-medium text-[var(--cp-text)]">
            {formatAnalysisDate(analysis.created_at)}
          </dd>
        </div>
        <div className="rounded-2xl bg-white/4 p-4">
          <dt className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            Etapa atual
          </dt>
          <dd className="mt-2 text-sm font-medium text-[var(--cp-text)]">
            {getAnalysisStepLabel(analysis.status)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--cp-border)] pt-4 text-sm text-[var(--cp-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>Resultado tecnico disponivel sem viewer PDF e sem highlight visual.</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/analysis/${analysis.id}`}
            className="inline-flex items-center font-medium text-[var(--cp-accent)]"
          >
            Ver resultado
          </Link>
          <Link
            href="/analysis/new"
            className="inline-flex items-center font-medium text-[var(--cp-muted)] transition-colors hover:text-[var(--cp-text)]"
          >
            Criar outra analise
          </Link>
        </div>
      </div>
    </article>
  );
}

function getAnalysisStepLabel(status: string) {
  const statusMap: Record<string, string> = {
    completed: "Resultado disponivel",
    created: "Aguardando processamento",
    failed: "Falha no processamento",
    processing: "Processando documentos",
  };

  return statusMap[status] ?? "Status tecnico indisponivel";
}
