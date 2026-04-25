import type {
  DetectedSheetCrosscheckResult,
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
            Lista e pranchas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Comparacao entre a lista de documentos e as pranchas.
          </h2>
        </div>

        {crosscheck ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Total" value={crosscheck.stats.total_count} />
            <Metric
              label="Conflitos"
              value={crosscheck.stats.combined_probable_issue_count}
            />
            <Metric
              label="Revisar"
              value={crosscheck.stats.combined_needs_review_count}
            />
            <Metric
              label="Sem lista"
              value={crosscheck.stats.undeclared_sheet_count}
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
          {crosscheck.results.length === 0 &&
          crosscheck.reverse_results.length === 0 ? (
            <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
              Nenhuma diferenca relevante foi encontrada entre a lista e as pranchas.
            </div>
          ) : (
            <div className="grid gap-6">
              <GroupedResults crosscheck={crosscheck} />
              <ReverseGroupedResults crosscheck={crosscheck} />
            </div>
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
      description: "Diferencas mais objetivas entre o que esta na lista e o que foi lido na prancha.",
      title: "Divergencias provaveis",
    },
    {
      category: "needs_review",
      description: "Casos que merecem uma revisao humana antes de concluir.",
      title: "Pontos para revisar",
    },
    {
      category: "extraction_limit",
      description: "Casos em que a leitura automatica nao conseguiu confirmar o texto com seguranca.",
      title: "Leitura incompleta",
    },
    {
      category: "compatible",
      description: "Itens em que lista e prancha ficaram compativeis.",
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

function ReverseGroupedResults({ crosscheck }: { crosscheck: LdSheetCrosscheck }) {
  if (crosscheck.reverse_results.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhuma prancha ficou fora da lista de documentos neste pacote.
      </div>
    );
  }

  const groups = [
    {
      category: "probable_issue",
      description: "Pranchas encontradas sem item correspondente na lista ou declaradas na parte errada do pacote.",
      title: "Pranchas com problema de lista",
    },
    {
      category: "needs_review",
      description: "Pranchas que apareceram aqui, mas a declaracao foi encontrada em outro documento do pacote.",
      title: "Pranchas para revisar",
    },
  ];

  return (
    <div className="grid gap-5 border-t border-[var(--cp-border)] pt-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
          Conferencia das pranchas
        </p>
        <p className="mt-1 text-sm text-[var(--cp-muted)]">
          Aqui aparecem as pranchas lidas no pacote que nao ficaram bem
          declaradas na lista de documentos.
        </p>
      </div>

      {groups.map((group) => {
        const results = crosscheck.reverse_results.filter(
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
              <ReverseCrosscheckCard
                key={`${result.sheet_filename}-${result.sheet_page}-${result.sheet_code}`}
                result={result}
              />
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
          label="Lista"
          page={result.ld_page}
          scopeId={result.ld_scope_id}
          title={result.ld_source_text}
        />
        {result.matched_sheet ? (
          <EvidenceBlock
            description={result.matched_sheet.description || "Nao detectada"}
            filename={result.matched_sheet.filename}
            item={result.matched_sheet.item || "-"}
            label="Prancha"
            page={result.matched_sheet.page}
            scopeId={result.matched_sheet.scope_id}
            title={result.matched_sheet.source_text}
          />
        ) : (
          <div className="rounded-lg border border-[var(--cp-border)] p-3 text-sm text-[var(--cp-muted)]">
            Nenhuma prancha correspondente foi detectada nessa mesma parte do pacote.
          </div>
        )}
      </div>
    </article>
  );
}

function ReverseCrosscheckCard({
  result,
}: {
  result: DetectedSheetCrosscheckResult;
}) {
  return (
    <article className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-[var(--cp-text)]">
            {result.sheet_code}
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
          description={result.sheet_description || "Nao detectada"}
          filename={result.sheet_filename}
          item={result.sheet_item || "-"}
          label="Prancha"
          page={result.sheet_page}
          scopeId={result.sheet_scope_id}
          title={result.sheet_source_text}
        />
        {result.matched_ld_row ? (
          <EvidenceBlock
            description={result.matched_ld_row.description}
            filename={result.matched_ld_row.filename}
            item={result.matched_ld_row.item}
            label="Lista"
            page={result.matched_ld_row.page}
            scopeId={result.matched_ld_row.scope_id}
            title={result.matched_ld_row.source_text}
          />
        ) : (
          <div className="rounded-lg border border-[var(--cp-border)] p-3 text-sm text-[var(--cp-muted)]">
            Nenhum item correspondente foi detectado na lista do pacote.
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
  scopeId,
  title,
}: {
  description: string;
  filename: string;
  item: string;
  label: string;
  page: number;
  scopeId: number | null;
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
        {scopeId ? ` · parte ${scopeId}` : ""}
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
      className={`w-fit rounded-none border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
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
    description_mismatch: "descricao diferente entre lista e prancha",
    detected_sheet_declared_in_other_document:
      "prancha declarada apenas em outro documento",
    detected_sheet_declared_in_other_section:
      "prancha declarada em outra parte do mesmo pdf",
    detected_sheet_missing_from_ld: "prancha sem declaracao na lista",
    matched_code_item_and_description: "codigo, folha e descricao compativeis",
    sheet_code_found_in_other_document_context:
      "codigo encontrado em outro documento",
    sheet_code_found_outside_ld_section:
      "codigo encontrado fora da parte esperada da lista",
    sheet_code_not_detected_in_ld_section:
      "codigo nao confirmado na parte esperada da lista",
    sheet_code_not_detected_outside_ld: "codigo nao confirmado fora da lista",
    sheet_description_low_confidence: "descricao da prancha lida com baixa confianca",
    sheet_item_mismatch: "folha divergente",
  };

  return labels[reason] || reason;
}
