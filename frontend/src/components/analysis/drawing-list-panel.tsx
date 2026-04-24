import type { DrawingLists } from "@/lib/types/analysis";

type DrawingListPanelProps = {
  drawingLists: DrawingLists | null;
  loadError?: string | null;
};

export function DrawingListPanel({
  drawingLists,
  loadError,
}: DrawingListPanelProps) {
  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Listas de documentos
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--cp-text)]">
            Linhas de LD detectadas.
          </h2>
        </div>

        {drawingLists ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="LDs" value={drawingLists.stats.document_count} />
            <Metric label="Linhas" value={drawingLists.stats.row_count} />
            <Metric label="Alertas" value={drawingLists.stats.alert_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && drawingLists ? (
        <div className="mt-6 grid gap-5">
          <AlertList drawingLists={drawingLists} />
          {drawingLists.lists.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
              Nenhuma linha de Lista de Documentos foi detectada nesta analise.
            </div>
          ) : (
            drawingLists.lists.map((list) => (
              <div
                key={list.document_id}
                className="overflow-hidden rounded-lg border border-[var(--cp-border)]"
              >
                <div className="bg-black/20 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--cp-text)]">
                    {list.filename}
                  </p>
                  <p className="mt-1 text-xs text-[var(--cp-muted)]">
                    {list.row_count} linhas
                    {list.project_codes.length > 0
                      ? ` · projetos ${list.project_codes.join(", ")}`
                      : ""}
                  </p>
                </div>

                <div className="hidden grid-cols-[80px_minmax(140px,180px)_minmax(0,1fr)_70px] gap-3 border-t border-[var(--cp-border)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)] lg:grid">
                  <span>Item</span>
                  <span>Codigo</span>
                  <span>Descricao</span>
                  <span>Pagina</span>
                </div>
                <div className="divide-y divide-[var(--cp-border)]">
                  {list.rows.map((row) => (
                    <div
                      key={`${list.document_id}-${row.page}-${row.item}-${row.document_code}`}
                      className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[80px_minmax(140px,180px)_minmax(0,1fr)_70px]"
                      title={row.source_text}
                    >
                      <span className="font-mono text-[var(--cp-muted)] before:mr-2 before:font-sans before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Item'] lg:before:content-none">
                        {row.item}
                      </span>
                      <span className="font-mono text-[var(--cp-text)] before:mr-2 before:font-sans before:text-xs before:uppercase before:tracking-[0.18em] before:text-[var(--cp-muted)] before:content-['Codigo'] lg:before:content-none">
                        {row.document_code}
                      </span>
                      <span className="leading-6 text-[var(--cp-text)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:text-[var(--cp-muted)] before:content-['Descricao'] lg:before:content-none">
                        {row.description}
                      </span>
                      <span className="text-[var(--cp-muted)] before:mr-2 before:text-xs before:uppercase before:tracking-[0.18em] before:content-['Pagina'] lg:before:content-none">
                        p{row.page}
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

function AlertList({ drawingLists }: { drawingLists: DrawingLists }) {
  if (drawingLists.alerts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhum alerta inicial foi detectado no cruzamento das LDs.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {drawingLists.alerts.map((alert) => (
        <div
          key={`${alert.type}-${alert.filename}-${alert.page}-${alert.item}-${alert.document_code}`}
          className="rounded-lg border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 p-4 text-sm leading-6 text-[var(--cp-text)]"
          title={alert.source_text}
        >
          <p>
            <span className="mr-2 font-semibold uppercase tracking-[0.16em] text-[var(--cp-warning)]">
              {alert.severity}
            </span>
            {alert.message}
          </p>
          <p className="mt-2 text-xs text-[var(--cp-muted)]">
            {alert.filename} · p{alert.page} · {alert.document_code} ·{" "}
            {alert.description}
          </p>
        </div>
      ))}
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
