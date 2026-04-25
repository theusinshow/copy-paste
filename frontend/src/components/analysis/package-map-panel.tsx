import type { PackageMap } from "@/lib/types/analysis";

type PackageMapPanelProps = {
  loadError?: string | null;
  map: PackageMap | null;
};

export function PackageMapPanel({ loadError, map }: PackageMapPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
            Organizacao dos arquivos
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Como o sistema separou cada PDF por parte interna.
          </h2>
        </div>

        {map ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Arquivos" value={map.stats.document_count} />
            <Metric label="Partes" value={map.stats.section_count} />
            <Metric label="Listas" value={map.stats.ld_section_count} />
            <Metric label="Pranchas" value={map.stats.sheet_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && map ? (
        <div className="mt-5 grid gap-4">
          {map.documents.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
              Nenhum arquivo foi organizado automaticamente nesta analise.
            </div>
          ) : (
            map.documents.map((document) => (
              <article
                key={document.document_id}
                className="rounded-lg border border-[var(--cp-border)] bg-black/10"
              >
                <div className="grid gap-3 border-b border-[var(--cp-border)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--cp-text)]">
                      {document.filename}
                    </p>
                    <p className="mt-1 text-xs text-[var(--cp-muted)]">
                      {document.classification}
                      {document.discipline ? ` · ${document.discipline}` : ""}
                      {document.volume ? ` · volume ${document.volume}` : ""}
                      {document.tomo ? ` · tomo ${document.tomo}` : ""}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--cp-muted)]">
                    {document.page_count} paginas · {document.sections.length} parte(s)
                  </p>
                </div>

                <div className="divide-y divide-[var(--cp-border)]">
                  {document.sections.map((section) => (
                    <div
                      key={`${document.document_id}-${section.scope_id}`}
                      className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_160px_160px]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--cp-text)]">
                          {section.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--cp-muted)]">
                          {section.section_label} ·{" "}
                          paginas {section.start_page}-{section.end_page}
                          {section.ld_page ? ` · lista p${section.ld_page}` : " · sem lista"}
                        </p>
                        <CodeList codes={section.ld_codes} emptyLabel="Sem codigos listados" />
                      </div>
                      <SmallStat label="Itens da lista" value={section.ld_row_count} />
                      <SmallStat label="Pranchas" value={section.sheet_count} />
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}

function CodeList({ codes, emptyLabel }: { codes: string[]; emptyLabel: string }) {
  const visibleCodes = codes.slice(0, 6);
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {visibleCodes.length > 0 ? (
        visibleCodes.map((code) => (
          <span
            key={code}
            className="rounded border border-[var(--cp-border)] bg-black/10 px-2 py-1 font-mono text-[11px] text-[var(--cp-muted)]"
          >
            {code}
          </span>
        ))
      ) : (
        <span className="text-xs text-[var(--cp-muted)]">{emptyLabel}</span>
      )}
      {codes.length > visibleCodes.length ? (
        <span className="rounded border border-[var(--cp-border)] bg-black/10 px-2 py-1 text-[11px] text-[var(--cp-muted)]">
          +{codes.length - visibleCodes.length}
        </span>
      ) : null}
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

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-semibold text-[var(--cp-text)]">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
