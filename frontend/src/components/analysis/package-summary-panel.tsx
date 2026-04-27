import type { PackageSummary } from "@/lib/types/analysis";

type PackageSummaryPanelProps = {
  loadError?: string | null;
  summary: PackageSummary | null;
};

export function PackageSummaryPanel({
  loadError,
  summary,
}: PackageSummaryPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-5 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Visao do pacote
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            O que foi identificado nos PDFs enviados.
          </h2>
        </div>

        {summary ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <SummaryMetric label="PDFs" value={summary.stats.document_count} />
      <SummaryMetric label="Páginas" value={summary.stats.page_count} />
            <SummaryMetric label="Volumes" value={summary.stats.volume_count} />
            <SummaryMetric label="Listas" value={summary.stats.ld_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && summary ? (
        <div className="mt-6 grid gap-6">
          <IdentityGrid summary={summary} />
          <DocumentTable summary={summary} />
          <AlertList summary={summary} />
        </div>
      ) : null}
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-[var(--cp-text)]">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}

function IdentityGrid({ summary }: { summary: PackageSummary }) {
  const identityItems = [
    ["Projeto", summary.identity.project_code],
    ["Obra", summary.identity.work_name],
    ["Bairro", summary.identity.bairro],
    ["Cliente", summary.identity.client],
    ["Data", summary.identity.date],
    ["Volumes", summary.identity.volumes.join(", ")],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {identityItems.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4"
        >
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
            {label}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
            {value || "Nao detectado"}
          </p>
        </div>
      ))}
    </div>
  );
}

function DocumentTable({ summary }: { summary: PackageSummary }) {
  if (summary.documents.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
        Nenhum documento foi encontrado para este pacote.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--cp-border)]">
      <div className="hidden grid-cols-[minmax(0,1fr)_90px_90px_90px] gap-3 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)] md:grid">
        <span>Arquivo</span>
        <span>Volume</span>
            <span>Páginas</span>
        <span>Lista</span>
      </div>
      <div className="divide-y divide-[var(--cp-border)]">
        {summary.documents.map((document) => (
          <div
            key={document.document_id}
            className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_90px_90px_90px]"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--cp-text)]">
                {document.filename}
              </p>
              <p className="mt-1 truncate text-xs text-[var(--cp-muted)]">
                {document.discipline || document.classification}
                {document.tomo ? ` · tomo ${document.tomo}` : ""}
              </p>
            </div>
            <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Volume'] md:before:content-none">
              {document.volume || "-"}
            </span>
                  <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Páginas'] md:before:content-none">
              {document.page_count}
            </span>
            <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Lista'] md:before:content-none">
              {document.ld_pages.length > 0
                ? document.ld_pages.map((page) => `p${page}`).join(", ")
                : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertList({ summary }: { summary: PackageSummary }) {
  if (summary.alerts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhum ponto de atencao inicial foi detectado na leitura geral do pacote.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {summary.alerts.map((alert) => (
        <div
          key={alert.message}
          className="rounded-lg border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 p-4 text-sm leading-6 text-[var(--cp-text)]"
        >
          <span className="mr-2 font-semibold uppercase tracking-[0.16em] text-[var(--cp-warning)]">
            {alert.severity}
          </span>
          {alert.message}
        </div>
      ))}
    </div>
  );
}
