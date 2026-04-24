import type { PageMap, PageMapPage } from "@/lib/types/analysis";

type PageMapPanelProps = {
  loadError?: string | null;
  map: PageMap | null;
};

const PAGE_TYPE_ORDER = [
  "cover",
  "drawing_list",
  "separator",
  "sheet",
  "memorial",
  "summary",
  "unknown",
];

const PAGE_TYPE_LABELS: Record<string, string> = {
  cover: "Capa",
  drawing_list: "LD",
  memorial: "Memorial",
  separator: "Separatriz",
  sheet: "Prancha",
  summary: "Sumario",
  unknown: "Nao classificada",
};

export function PageMapPanel({ loadError, map }: PageMapPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
            Mapa de paginas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Classificacao objetiva por pagina.
          </h2>
        </div>

        {map ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Docs" value={map.stats.document_count} />
            <Metric label="Paginas" value={map.stats.page_count} />
            <Metric label="Baixa conf." value={map.stats.low_confidence_count} />
            <Metric label="Tipos" value={Object.keys(map.stats.page_type_counts).length} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && map ? (
        <div className="mt-5 grid gap-5">
          <TypeSummary counts={map.stats.page_type_counts} />
          {map.documents.map((document) => (
            <article
              key={document.document_id}
              className="rounded-lg border border-[var(--cp-border)] bg-black/10"
            >
              <div className="grid gap-2 border-b border-[var(--cp-border)] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_160px]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--cp-text)]">
                    {document.filename}
                  </p>
                  <p className="mt-1 text-xs text-[var(--cp-muted)]">
                    {document.page_count} pagina(s)
                  </p>
                </div>
              </div>
              <div className="grid gap-2 p-4">
                {document.pages.map((page) => (
                  <PageRow key={`${document.document_id}-${page.page}`} page={page} />
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function TypeSummary({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAGE_TYPE_ORDER.filter((type) => counts[type]).map((type) => (
        <span
          key={type}
          className="rounded border border-[var(--cp-border)] bg-black/10 px-2 py-1 text-xs text-[var(--cp-muted)]"
        >
          {PAGE_TYPE_LABELS[type]} - {counts[type]}
        </span>
      ))}
    </div>
  );
}

function PageRow({ page }: { page: PageMapPage }) {
  return (
    <div className="grid gap-3 rounded-lg border border-[var(--cp-border)] bg-black/10 p-3 lg:grid-cols-[110px_170px_minmax(0,1fr)]">
      <div>
        <p className="font-mono text-sm font-semibold text-[var(--cp-text)]">
          p{page.page.toString().padStart(2, "0")}
        </p>
        <p className="mt-1 text-xs text-[var(--cp-muted)]">
          {page.scope_id ? `secao ${page.scope_id}` : "sem secao"}
        </p>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--cp-text)]">
          {page.page_type_label}
        </p>
        <p className={`mt-1 text-xs ${confidenceClass(page.confidence)}`}>
          {formatConfidence(page.confidence)}
        </p>
        {page.discipline_code ? (
          <p className="mt-1 text-xs text-[var(--cp-muted)]">
            {page.discipline_code} - {page.discipline_label}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs leading-6 text-[var(--cp-muted)]">
          {page.evidence_text || "Sem evidencia textual destacada"}
        </p>
        <p className="mt-1 truncate text-[11px] text-[var(--cp-muted)]">
          {page.signals.join(", ")}
        </p>
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

function confidenceClass(confidence: string) {
  if (confidence === "high") {
    return "text-[var(--cp-success)]";
  }
  if (confidence === "medium") {
    return "text-[var(--cp-warning)]";
  }
  return "text-[var(--cp-muted)]";
}

function formatConfidence(confidence: string) {
  const labels: Record<string, string> = {
    high: "confianca alta",
    low: "confianca baixa",
    medium: "confianca media",
  };
  return labels[confidence] || confidence;
}
