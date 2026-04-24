import type { DetectedSheets } from "@/lib/types/analysis";

type DetectedSheetsPanelProps = {
  detectedSheets: DetectedSheets | null;
  loadError?: string | null;
};

export function DetectedSheetsPanel({
  detectedSheets,
  loadError,
}: DetectedSheetsPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Pranchas detectadas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Codigos encontrados fora das LDs.
          </h2>
        </div>

        {detectedSheets ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="PDFs" value={detectedSheets.stats.document_count} />
            <Metric label="Pranchas" value={detectedSheets.stats.sheet_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && detectedSheets ? (
        <div className="mt-6 grid gap-5">
          {detectedSheets.documents.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
              Nenhum codigo de prancha foi detectado fora das Listas de Documentos.
            </div>
          ) : (
            detectedSheets.documents.map((document) => (
              <div
                key={document.document_id}
                className="overflow-hidden rounded-lg border border-[var(--cp-border)]"
              >
                <div className="bg-black/20 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--cp-text)]">
                    {document.filename}
                  </p>
                  <p className="mt-1 text-xs text-[var(--cp-muted)]">
                    {document.sheet_count} codigos detectados
                  </p>
                </div>

                <div className="hidden grid-cols-[minmax(150px,210px)_80px_70px_minmax(0,1fr)] gap-3 border-t border-[var(--cp-border)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)] lg:grid">
                  <span>Codigo</span>
                  <span>Folha</span>
                  <span>Pagina</span>
                  <span>Descricao proxima</span>
                </div>
                <div className="divide-y divide-[var(--cp-border)]">
                  {document.sheets.map((sheet) => (
                    <div
                      key={`${document.document_id}-${sheet.page}-${sheet.sheet_code}`}
                      className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[minmax(150px,210px)_80px_70px_minmax(0,1fr)]"
                      title={sheet.source_text}
                    >
                      <span className="font-mono text-[var(--cp-text)] before:mr-2 before:font-sans before:text-xs before:uppercase before:tracking-[0.18em] before:text-[var(--cp-muted)] before:content-['Codigo'] lg:before:content-none">
                        {sheet.sheet_code}
                      </span>
                      <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Folha'] lg:before:content-none">
                        {sheet.item || "-"}
                      </span>
                      <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Pagina'] lg:before:content-none">
                        p{sheet.page}
                      </span>
                      <span className="leading-6 text-[var(--cp-text)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:text-[var(--cp-muted)] before:content-['Descricao'] lg:before:content-none">
                        {sheet.description || "Nao detectada"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
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
