import type {
  LdSheetCrosscheck,
  LdSheetCrosscheckResult,
} from "@/lib/types/analysis";

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
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            LD x Pranchas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Cruzamento por codigo, folha e descricao.
          </h2>
        </div>

        {crosscheck ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Total" value={crosscheck.stats.total_count} />
            <Metric label="Conflitos" value={crosscheck.stats.probable_issue_count} />
            <Metric label="Revisar" value={crosscheck.stats.needs_review_count} />
            <Metric
              label="Limites"
              value={crosscheck.stats.extraction_limit_count}
            />
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
            <GroupedResults crosscheck={crosscheck} />
          )}
        </div>
      ) : null}
    </section>
  );
}

function GroupedResults({ crosscheck }: { crosscheck: LdSheetCrosscheck }) {
  const groups = [
    {
      category: "probable_issue",
      description: "Conflitos objetivos encontrados.",
      title: "Incongruencias provaveis",
    },
    {
      category: "needs_review",
      description: "Diferencas textuais que precisam de revisao.",
      title: "Pontos para revisar",
    },
    {
      category: "extraction_limit",
      description: "Casos em que a leitura automatica nao confirmou tudo.",
      title: "Limitacoes de extracao",
    },
    {
      category: "compatible",
      description: "Itens com codigo, folha e descricao compativeis.",
      title: "Compativeis",
    },
  ];

  return (
    <div className="grid gap-5">
      {groups.map((group) => {
        const results = crosscheck.results.filter(
          (result) => result.category === group.category,
        );
        if (results.length === 0) {
          return null;
        }

        return (
          <div key={group.category} className="grid gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
                {group.title} · {results.length}
              </p>
              <p className="mt-1 text-sm text-[var(--cp-muted)]">
                {group.description}
              </p>
            </div>
            {results.map((result) => (
              <CrosscheckCard key={buildResultKey(result)} result={result} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CrosscheckCard({ result }: { result: LdSheetCrosscheckResult }) {
  return (
    <article className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-[var(--cp-text)]">
            {result.ld_document_code}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--cp-text)]">
            {result.message}
          </p>
          <p className="mt-2 text-xs text-[var(--cp-muted)]">
            Motivo: {formatReason(result.reason)}
          </p>
        </div>
        <SeverityPill category={result.category} severity={result.severity} />
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
            description={result.matched_sheet.description || "Nao detectada"}
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
  );
}

function buildResultKey(result: LdSheetCrosscheckResult) {
  return `${result.ld_filename}-${result.ld_page}-${result.ld_item}-${result.ld_document_code}`;
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

function SeverityPill({
  category,
  severity,
}: {
  category: string;
  severity: string;
}) {
  const className =
    category === "probable_issue"
      ? "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 text-[var(--cp-error)]"
      : category === "needs_review"
        ? "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 text-[var(--cp-warning)]"
        : category === "extraction_limit"
          ? "border-[var(--cp-border)] bg-black/20 text-[var(--cp-muted)]"
          : "border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 text-[var(--cp-success)]";

  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {category === "probable_issue"
        ? "conflito"
        : category === "needs_review"
          ? "revisar"
          : category === "extraction_limit"
            ? "limite"
            : severity}
    </span>
  );
}

function formatReason(reason: string) {
  const labels: Record<string, string> = {
    description_mismatch: "descricao divergente",
    matched_code_item_and_description: "codigo, folha e descricao compativeis",
    sheet_code_not_detected_outside_ld: "codigo nao confirmado fora da LD",
    sheet_description_low_confidence: "descricao da prancha com baixa confianca",
    sheet_item_mismatch: "folha divergente",
  };

  return labels[reason] || reason;
}
