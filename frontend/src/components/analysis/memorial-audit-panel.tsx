import type {
  MemorialAudit,
  MemorialAuditFinding,
  MemorialAuditOccurrence,
} from "@/lib/types/analysis";

type MemorialAuditPanelProps = {
  audit: MemorialAudit | null;
  loadError?: string | null;
};

export function MemorialAuditPanel({
  audit,
  loadError,
}: MemorialAuditPanelProps) {
  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Memoriais
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--cp-text)]">
            Enderecos e identidade textual.
          </h2>
        </div>

        {audit ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Docs" value={audit.stats.document_count} />
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
        <div className="mt-6 grid gap-6">
          <IdentityGrid audit={audit} />
          <FindingList findings={audit.findings} />
          <OccurrenceList occurrences={audit.occurrences} />
        </div>
      ) : null}
    </section>
  );
}

function IdentityGrid({ audit }: { audit: MemorialAudit }) {
  const items = [
    ["Obra", audit.identity.work_name],
    ["Projeto", audit.identity.project_code],
    ["Bairro", audit.identity.bairro],
    ["Municipio", audit.identity.municipality],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
            {label}
          </p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
            {value || "Nao detectado"}
          </p>
        </div>
      ))}
    </div>
  );
}

function FindingList({ findings }: { findings: MemorialAuditFinding[] }) {
  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhuma divergencia objetiva foi detectada nos memoriais.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {findings.map((finding) => (
        <article
          key={`${finding.reason}-${finding.message}`}
          className="rounded-lg border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--cp-text)]">
                {finding.message}
              </p>
              <p className="mt-2 text-xs text-[var(--cp-muted)]">
                Motivo: {formatReason(finding.reason)}
              </p>
            </div>
            <CategoryPill category={finding.category} />
          </div>

          {finding.occurrences.map((occurrence) => (
            <OccurrenceEvidence
              key={`${occurrence.filename}-${occurrence.page}-${occurrence.field}-${occurrence.value}`}
              occurrence={occurrence}
            />
          ))}
        </article>
      ))}
    </div>
  );
}

function OccurrenceList({
  occurrences,
}: {
  occurrences: MemorialAuditOccurrence[];
}) {
  if (occurrences.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
        Nenhum endereco ou campo de identidade foi extraido dos memoriais.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--cp-border)]">
      <div className="hidden grid-cols-[140px_minmax(0,1fr)_70px_minmax(0,1fr)] gap-3 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)] lg:grid">
        <span>Campo</span>
        <span>Valor</span>
        <span>Pagina</span>
        <span>Documento</span>
      </div>
      <div className="divide-y divide-[var(--cp-border)]">
        {occurrences.slice(0, 80).map((occurrence) => (
          <div
            key={`${occurrence.filename}-${occurrence.page}-${occurrence.field}-${occurrence.value}`}
            className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[140px_minmax(0,1fr)_70px_minmax(0,1fr)]"
            title={occurrence.source_text}
          >
            <span className="text-[var(--cp-muted)]">
              {occurrence.field_label}
            </span>
            <span className="font-medium text-[var(--cp-text)]">
              {occurrence.value}
            </span>
            <span className="text-[var(--cp-muted)]">p{occurrence.page}</span>
            <span className="truncate text-[var(--cp-muted)]">
              {occurrence.filename}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OccurrenceEvidence({
  occurrence,
}: {
  occurrence: MemorialAuditOccurrence;
}) {
  return (
    <div
      className="mt-3 rounded-lg border border-[var(--cp-border)] bg-black/10 p-3 text-sm"
      title={occurrence.source_text}
    >
      <p className="text-xs text-[var(--cp-muted)]">
        {occurrence.filename} · p{occurrence.page} · {occurrence.field_label}
      </p>
      <p className="mt-2 font-medium text-[var(--cp-text)]">
        {occurrence.value}
      </p>
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

function CategoryPill({ category }: { category: string }) {
  const className =
    category === "probable_issue"
      ? "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 text-[var(--cp-error)]"
      : category === "needs_review"
        ? "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 text-[var(--cp-warning)]"
        : "border-[var(--cp-border)] bg-black/20 text-[var(--cp-muted)]";

  return (
    <span
      className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {category === "probable_issue"
        ? "conflito"
        : category === "needs_review"
          ? "revisar"
          : "limite"}
    </span>
  );
}

function formatReason(reason: string) {
  const labels: Record<string, string> = {
    bairro_differs_from_package_identity: "bairro diferente da identidade principal",
    multiple_memorial_address_values_detected: "multiplos enderecos encontrados",
    multiple_memorial_municipality_values_detected:
      "multiplos municipios encontrados",
    multiple_memorial_project_code_values_detected:
      "multiplos numeros de projeto encontrados",
    multiple_memorial_owner_values_detected:
      "multiplos proprietarios/clientes encontrados",
    no_memorial_identity_fields_detected: "campos nao detectados",
    owner_city_differs_from_memorial_municipality:
      "proprietario/cliente aponta outro municipio",
    project_code_differs_from_package_identity:
      "numero do projeto diferente da identidade principal",
    work_name_differs_from_package_identity:
      "obra diferente da identidade principal",
  };

  return labels[reason] || reason;
}
