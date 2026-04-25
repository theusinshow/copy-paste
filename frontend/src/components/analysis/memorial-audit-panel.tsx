import type {
  MemorialAudit,
  MemorialAuditFinding,
  MemorialAuditOccurrence,
} from "@/lib/types/analysis";

type MemorialAuditPanelProps = {
  audit: MemorialAudit | null;
  loadError?: string | null;
};

type FindingGroup = {
  category: string;
  findings: MemorialAuditFinding[];
  title: string;
};

export function MemorialAuditPanel({
  audit,
  loadError,
}: MemorialAuditPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Revisao dos memoriais
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Comparacao dos dados principais escritos nos memoriais.
          </h2>
        </div>

        {audit ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Arquivos" value={audit.stats.document_count} />
            <Metric label="Valores" value={uniqueOccurrenceCount(audit.occurrences)} />
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
          <OccurrenceSummary occurrences={audit.occurrences} />
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
        Nenhuma divergencia objetiva foi detectada nos memoriais lidos.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {groupFindings(findings).map((group) => (
        <div
          key={group.category}
          className="rounded-lg border border-[var(--cp-border)] bg-black/10"
        >
          <div className="flex flex-col gap-3 border-b border-[var(--cp-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
                {group.title}
              </p>
              <p className="mt-1 text-sm text-[var(--cp-text)]">
                {group.findings.length.toString().padStart(2, "0")} item(ns)
              </p>
            </div>
            <CategoryPill category={group.category} />
          </div>

          <div className="divide-y divide-[var(--cp-border)]">
            {group.findings.map((finding) => (
              <FindingRow
                key={`${finding.reason}-${finding.message}`}
                finding={finding}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingRow({ finding }: { finding: MemorialAuditFinding }) {
  const occurrence = finding.occurrences[0];

  return (
    <article className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <p className="text-sm font-semibold leading-6 text-[var(--cp-text)]">
          {formatFindingTitle(finding)}
        </p>
        <p className="mt-1 text-xs text-[var(--cp-muted)]">
          {formatReason(finding.reason)}
        </p>
      </div>

      {occurrence ? (
        <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-3 text-sm">
          <p className="font-medium text-[var(--cp-text)]">{occurrence.value}</p>
          <p className="mt-2 text-xs text-[var(--cp-muted)]">
            p{occurrence.page} · {occurrence.field_label}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--cp-muted)]">
            {occurrence.filename}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function OccurrenceSummary({
  occurrences,
}: {
  occurrences: MemorialAuditOccurrence[];
}) {
  const grouped = groupOccurrences(occurrences);

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
        Nenhum dado principal foi separado automaticamente dos memoriais.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10">
      <div className="border-b border-[var(--cp-border)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
          Valores encontrados
        </p>
      </div>

      <div className="divide-y divide-[var(--cp-border)]">
        {grouped.map((group) => (
          <div
            key={group.field}
            className="grid gap-3 px-4 py-4 lg:grid-cols-[150px_minmax(0,1fr)]"
          >
            <p className="text-sm font-medium text-[var(--cp-text)]">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.values.slice(0, 12).map((item) => (
                <span
                  key={`${group.field}-${item.value}`}
                  className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1 text-xs text-[var(--cp-muted)]"
                  title={item.pages}
                >
                  {item.value} · {item.count}x
                </span>
              ))}
              {group.values.length > 12 ? (
                <span className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1 text-xs text-[var(--cp-muted)]">
                  +{group.values.length - 12}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
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
      className={`w-fit rounded-none border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}
    >
      {category === "probable_issue"
        ? "conflito"
        : category === "needs_review"
          ? "revisar"
          : "limite"}
    </span>
  );
}

function groupFindings(findings: MemorialAuditFinding[]): FindingGroup[] {
  const labels: Record<string, string> = {
    extraction_limit: "Limites de extracao",
    needs_review: "Pontos para revisar",
    probable_issue: "Conflitos provaveis",
  };
  const order = ["probable_issue", "needs_review", "extraction_limit"];

  return order
    .map((category) => ({
      category,
      findings: findings.filter((finding) => finding.category === category),
      title: labels[category],
    }))
    .filter((group) => group.findings.length > 0);
}

function groupOccurrences(occurrences: MemorialAuditOccurrence[]) {
  const fieldOrder = ["work_name", "project_code", "bairro", "municipality", "owner", "address"];
  const groups = new Map<
    string,
    {
      field: string;
      label: string;
      values: Map<string, { count: number; pages: Set<number>; value: string }>;
    }
  >();

  for (const occurrence of occurrences) {
    if (!groups.has(occurrence.field)) {
      groups.set(occurrence.field, {
        field: occurrence.field,
        label: occurrence.field_label,
        values: new Map(),
      });
    }

    const group = groups.get(occurrence.field);
    const current = group?.values.get(occurrence.normalized_value) ?? {
      count: 0,
      pages: new Set<number>(),
      value: occurrence.value,
    };
    current.count += 1;
    current.pages.add(occurrence.page);
    group?.values.set(occurrence.normalized_value, current);
  }

  return [...groups.values()]
    .sort((a, b) => fieldOrder.indexOf(a.field) - fieldOrder.indexOf(b.field))
    .map((group) => ({
      ...group,
      values: [...group.values.values()]
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .map((item) => ({
          count: item.count,
          pages: `Paginas: ${[...item.pages].sort((a, b) => a - b).join(", ")}`,
          value: item.value,
        })),
    }));
}

function uniqueOccurrenceCount(occurrences: MemorialAuditOccurrence[]) {
  return new Set(
    occurrences.map(
      (occurrence) => `${occurrence.field}:${occurrence.normalized_value}`,
    ),
  ).size;
}

function formatFindingTitle(finding: MemorialAuditFinding) {
  const occurrence = finding.occurrences[0];
  if (!occurrence) {
    return finding.message;
  }

  const field = occurrence.field_label.toLowerCase();
  if (finding.category === "probable_issue") {
    return `${occurrence.field_label} com divergencia: ${occurrence.value}`;
  }
  return `Revisar ${field}: ${occurrence.value}`;
}

function formatReason(reason: string) {
  const labels: Record<string, string> = {
    bairro_differs_from_package_identity: "bairro diferente da identidade principal",
    multiple_memorial_address_values_detected: "mais de um endereco distinto foi encontrado",
    multiple_memorial_municipality_values_detected:
      "mais de um municipio foi encontrado",
    multiple_memorial_project_code_values_detected:
      "mais de um numero de projeto foi encontrado",
    multiple_memorial_owner_values_detected:
      "mais de um proprietario/cliente foi encontrado",
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
