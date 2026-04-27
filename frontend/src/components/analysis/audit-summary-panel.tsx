import { buildApiUrl } from "@/lib/api/config";
import type { AuditSummary } from "@/lib/types/analysis";

type AuditSummaryPanelProps = {
  analysisId: number;
  loadError?: string | null;
  summary: AuditSummary | null;
};

export function AuditSummaryPanel({
  analysisId,
  loadError,
  summary,
}: AuditSummaryPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Resumo final
          </p>
          <h2 className="text-2xl font-semibold text-[var(--cp-text)]">
            O que o sistema concluiu sobre os arquivos.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--cp-muted)]">
            Esse quadro junta o que foi encontrado nos arquivos, na lista de
            documentos, nas pranchas, nos memoriais, nos rodapés e no que já
            foi revisado por uma pessoa.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              href={buildApiUrl(`/api/v1/analysis/${analysisId}/export`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
            >
              Baixar relatório
            </a>
            <a
              href={buildApiUrl(`/api/v1/analysis/${analysisId}/export?format=html`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] bg-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
            >
              Versão para impressão
            </a>
          </div>

          {summary ? (
            <div
              className={`rounded-2xl border px-4 py-3 ${getToneClassName(summary.status.tone)}`}
            >
              <p className="text-[10px] uppercase tracking-[0.22em]">
                Situação geral
              </p>
              <p className="mt-2 text-lg font-semibold">{summary.status.label}</p>
            </div>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && summary ? (
        <div className="mt-6 grid gap-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label="Verificar"
              tone={summary.metrics.relevant_count > 0 ? "danger" : "success"}
              value={summary.metrics.relevant_count.toString().padStart(2, "0")}
            />
            <SummaryMetric
              label="Atenção"
              tone={summary.metrics.attention_count > 0 ? "warning" : "success"}
              value={summary.metrics.attention_count.toString().padStart(2, "0")}
            />
            <SummaryMetric
              label="Aguardando revisão"
              tone={summary.metrics.pending_review_count > 0 ? "muted" : "success"}
              value={summary.metrics.pending_review_count.toString().padStart(2, "0")}
            />
            <SummaryMetric
              label="Concluídos"
              tone={
                summary.metrics.resolved_issue_count +
                  summary.metrics.dismissed_issue_count >
                0
                  ? "success"
                  : "muted"
              }
              value={(
                summary.metrics.resolved_issue_count +
                summary.metrics.dismissed_issue_count
              )
                .toString()
                .padStart(2, "0")}
            />
          </div>

          <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              Leitura rápida
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--cp-text)]">
              {summary.status.summary}
            </p>
          </div>

          <div className="grid gap-3">
            {summary.highlights.map((highlight) => (
              <div
                key={highlight.message}
                className={`rounded-lg border px-4 py-3 text-sm leading-6 ${getToneClassName(highlight.tone)}`}
              >
                {highlight.message}
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {summary.sources.map((source) => (
              <article
                key={source.source}
                className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
                      {source.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--cp-text)]">
                      {source.item_count.toString().padStart(2, "0")} itens analisados
                    </p>
                  </div>
                  <span className="rounded-none border border-[var(--cp-border)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--cp-muted)]">
                    {source.relevant_count} verificar / {source.attention_count} revisar /{" "}
                    {source.incomplete_count} não confirmado
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--cp-muted)]">
                  {source.summary}
                </p>
                {source.active_count ||
                source.pending_review_count ||
                source.resolved_count ||
                source.dismissed_count ||
                source.inconclusive_count ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--cp-muted)]">
                    <span className="rounded-none border border-[var(--cp-border)] px-3 py-1">
                      {source.active_count} ativa(s)
                    </span>
                    <span className="rounded-none border border-[var(--cp-border)] px-3 py-1">
                      {source.pending_review_count} pendente(s)
                    </span>
                    <span className="rounded-none border border-[var(--cp-border)] px-3 py-1">
                      {source.resolved_count} resolvida(s)
                    </span>
                    <span className="rounded-none border border-[var(--cp-border)] px-3 py-1">
                      {source.dismissed_count} descartada(s)
                    </span>
                    <span className="rounded-none border border-[var(--cp-border)] px-3 py-1">
                      {source.inconclusive_count} sem evidência
                    </span>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SummaryMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "muted" | "success" | "warning";
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${getMetricTone(tone)}`}>
        {value}
      </p>
    </div>
  );
}

function getMetricTone(tone: "danger" | "muted" | "success" | "warning") {
  const classNames = {
    danger: "text-[var(--cp-error)]",
    muted: "text-[var(--cp-muted)]",
    success: "text-[var(--cp-success)]",
    warning: "text-[var(--cp-warning)]",
  };
  return classNames[tone];
}

function getToneClassName(tone: string) {
  const classNames: Record<string, string> = {
    danger: "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 text-[var(--cp-text)]",
    muted: "border-[var(--cp-border)] bg-black/10 text-[var(--cp-text)]",
    success:
      "border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 text-[var(--cp-text)]",
    warning:
      "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 text-[var(--cp-text)]",
  };
  return classNames[tone] || classNames.muted;
}
