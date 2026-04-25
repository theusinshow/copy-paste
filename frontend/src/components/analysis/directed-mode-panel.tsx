import {
  getIssueSeverityAppearance,
  IssueSeverityBadge,
} from "@/components/analysis/issue-severity-badge";
import type { DirectedModeOutput } from "@/lib/types/analysis";

type DirectedModePanelProps = {
  loadError?: string | null;
  output: DirectedModeOutput | null;
};

export function DirectedModePanel({
  loadError,
  output,
}: DirectedModePanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="border-b border-[var(--cp-border)] pb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Modo dirigido
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Saida operacional da analise configurada.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cp-muted)]">
          Esta secao consolida busca textual, busca e substituicao ou verificacao
          pontual sem alterar o PDF original.
        </p>
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && output ? (
        <div className="mt-6 grid gap-6">
          <div className="flex flex-wrap gap-2">
            {output.query ? <ConfigChip label="Buscar" value={output.query} /> : null}
            {output.replace !== null ? (
              <ConfigChip label="Substituir por" value={output.replace} />
            ) : null}
            {output.expected ? (
              <ConfigChip label="Esperado" value={output.expected} />
            ) : null}
            {output.field_label ? (
              <ConfigChip label="Campo" value={output.field_label} />
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Ocorrencias" value={output.stats.occurrence_count} />
            <StatCard label="Paginas" value={output.stats.page_count} />
            <StatCard label="Conferem" value={output.stats.matching_count} />
            <StatCard label="Divergem" value={output.stats.divergent_count} />
          </div>

          <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              Resumo
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--cp-text)]">
              {output.summary}
            </p>
          </div>

          {output.entries.length > 0 ? (
            <div className="grid gap-3">
              {output.entries.map((entry, index) => {
                const appearance = getIssueSeverityAppearance(entry.severity);

                return (
                  <article
                    key={`${entry.filename}-${entry.page}-${index}`}
                    className={`rounded-lg border bg-black/10 p-4 ${appearance.cardClassName}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
                          {entry.filename} · pagina {entry.page ?? "-"}
                        </p>
                        <p className="text-sm font-medium leading-7 text-[var(--cp-text)]">
                          {entry.value}
                        </p>
                      </div>
                      <IssueSeverityBadge severity={entry.severity} />
                    </div>

                    {entry.expected_value ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--cp-muted)]">
                        Esperado: {entry.expected_value}
                      </p>
                    ) : null}

                    {entry.replacement_preview !== null ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--cp-muted)]">
                        Sugestao de substituicao: {entry.replacement_preview}
                      </p>
                    ) : null}

                    <p className="mt-3 text-sm leading-6 text-[var(--cp-muted)]">
                      Contexto: {entry.context}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-5 text-sm leading-6 text-[var(--cp-muted)]">
              Nenhuma evidencia adicional foi registrada para este modo.
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ConfigChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[var(--cp-border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--cp-text)]">
      {label}: {value || "-"}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold text-[var(--cp-text)]">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
