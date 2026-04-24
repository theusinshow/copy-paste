import type { LdSheetCrosscheck } from "@/lib/types/analysis";

type LdSheetCrosscheckPanelProps = {
  crosscheck: LdSheetCrosscheck | null;
  loadError?: string | null;
};

export function LdSheetCrosscheckPanel({
  crosscheck,
  loadError,
}: LdSheetCrosscheckPanelProps) {
  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            LD x Pranchas
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--cp-text)]">
            Cruzamento por codigo, folha e descricao.
          </h2>
        </div>

        {crosscheck ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Total" value={crosscheck.stats.total_count} />
            <Metric label="Ok" value={crosscheck.stats.ok_count} />
            <Metric label="Atencao" value={crosscheck.stats.attention_count} />
            <Metric label="Relevante" value={crosscheck.stats.relevant_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && crosscheck ? (
        <div className="mt-6 grid gap-4">
          {crosscheck.results.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
              Nenhum item de LD foi encontrado para cruzar com pranchas.
            </div>
          ) : (
            crosscheck.results.map((result) => (
              <article
                key={`${result.ld_filename}-${result.ld_page}-${result.ld_item}-${result.ld_document_code}`}
                className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-[var(--cp-text)]">
                      {result.ld_document_code}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--cp-text)]">
                      {result.message}
                    </p>
                  </div>
                  <SeverityPill severity={result.severity} />
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <EvidenceBlock
                    description={result.ld_description}
                    filename={result.ld_filename}
                    item={result.ld_item}
                    label="LD"
                    page={result.ld_page}
                    title={result.ld_source_text}
                  />
                  {result.matched_sheet ? (
                    <EvidenceBlock
                      description={
                        result.matched_sheet.description || "Nao detectada"
                      }
                      filename={result.matched_sheet.filename}
                      item={result.matched_sheet.item || "-"}
                      label="Prancha"
                      page={result.matched_sheet.page}
                      title={result.matched_sheet.source_text}
                    />
                  ) : (
                    <div className="rounded-lg border border-[var(--cp-border)] p-3 text-sm text-[var(--cp-muted)]">
                      Nenhuma prancha correspondente foi detectada fora da LD.
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}

function EvidenceBlock({
  description,
  filename,
  item,
  label,
  page,
  title,
}: {
  description: string;
  filename: string;
  item: string;
  label: string;
  page: number;
  title: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--cp-border)] p-3 text-sm"
      title={title}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-2 truncate font-medium text-[var(--cp-text)]">
        {filename}
      </p>
      <p className="mt-1 text-xs text-[var(--cp-muted)]">
        folha {item} · p{page}
      </p>
      <p className="mt-2 leading-6 text-[var(--cp-text)]">{description}</p>
    </div>
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

function SeverityPill({ severity }: { severity: string }) {
  const className =
    severity === "relevante"
      ? "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 text-[var(--cp-error)]"
      : severity === "atencao"
        ? "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 text-[var(--cp-warning)]"
        : "border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 text-[var(--cp-success)]";

  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {severity}
    </span>
  );
}
