import type { ExtractedField } from "@/lib/types/analysis";

type ExtractedFieldListProps = {
  fields: ExtractedField[];
  loadError?: string | null;
};

export function ExtractedFieldList({
  fields,
  loadError,
}: ExtractedFieldListProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="border-b border-[var(--cp-border)] pb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Trechos separados
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--cp-text)]">
          Dados que ajudaram a montar a revisao.
        </h2>
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && fields.length === 0 ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-border)] bg-black/10 p-5 text-sm leading-6 text-[var(--cp-muted)]">
          Nenhum dado conhecido foi separado automaticamente. Quando isso
          acontece, a analise evita criar alerta sem evidencia suficiente.
        </div>
      ) : null}

      {fields.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {fields.map((field) => (
            <article
              key={field.id}
              className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
                    {formatFieldName(field.field_name)}
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
                    {field.raw_value}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-[var(--cp-border)] px-3 py-1 text-xs text-[var(--cp-muted)]">
                  pagina {field.page ?? "-"}
                </span>
              </div>
              <p className="mt-3 truncate text-xs text-[var(--cp-muted)]">
                {field.document_filename}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function formatFieldName(fieldName: string) {
  return fieldName.replaceAll("_", " ");
}
