import type { FooterAudit } from "@/lib/types/analysis";

type FooterAuditPanelProps = {
  audit: FooterAudit | null;
  loadError?: string | null;
};

export function FooterAuditPanel({ audit, loadError }: FooterAuditPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
            Conferencia do rodape
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Comparacao dos numeros de projeto lidos no rodape.
          </h2>
        </div>

        {audit ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Paginas" value={audit.stats.footer_page_count} />
            <Metric label="Campos" value={audit.stats.occurrence_count} />
            <Metric label="Conflitos" value={audit.stats.probable_issue_count} />
            <Metric label="Revisar" value={audit.stats.needs_review_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && audit ? (
        <div className="mt-5 grid gap-4">
          {audit.findings.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
              Nenhum conflito objetivo foi detectado nos rodapes lidos.
            </div>
          ) : (
            <div className="grid gap-3">
              {audit.findings.map((finding) => {
                const occurrence = finding.occurrences[0];
                return (
                  <article
                    key={`${finding.reason}-${occurrence?.filename}-${occurrence?.page}-${occurrence?.value}`}
                    className="rounded-lg border border-[var(--cp-error)]/35 bg-[var(--cp-error)]/10 p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--cp-text)]">
                      {finding.message}
                    </p>
                    {occurrence ? (
                      <p className="mt-2 text-xs leading-6 text-[var(--cp-muted)]">
                        {occurrence.filename} - p{occurrence.page} -{" "}
                        {occurrence.source_text}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <OccurrenceSummary audit={audit} />
        </div>
      ) : null}
    </section>
  );
}

function OccurrenceSummary({ audit }: { audit: FooterAudit }) {
  if (audit.occurrences.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
        Nenhum numero de projeto foi detectado nos rodapes com posicao legivel.
      </div>
    );
  }

  const counts = new Map<string, number>();
  for (const occurrence of audit.occurrences) {
    counts.set(occurrence.value, (counts.get(occurrence.value) ?? 0) + 1);
  }

  return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        Numeros encontrados
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[...counts.entries()].map(([value, count]) => (
          <span
            key={value}
            className="rounded border border-[var(--cp-border)] bg-black/10 px-2 py-1 font-mono text-xs text-[var(--cp-muted)]"
          >
            {value} - {count}x
          </span>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-[var(--cp-text)]">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
