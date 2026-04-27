import Link from "next/link";

import type { PackageGroup } from "@/lib/api/analysis";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PackageCard({ pkg }: { pkg: PackageGroup }) {
  return (
    <div className="rounded-none border border-[var(--cp-border)] bg-[var(--cp-surface)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--cp-border)] px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-accent)]">
            Projeto
          </p>
          <h2 className="mt-1 text-base font-semibold text-[var(--cp-text)]">
            {pkg.project_code}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--cp-muted)]">
            {pkg.analysis_count}{" "}
            {pkg.analysis_count === 1 ? "analise" : "analises"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--cp-muted)]">
            Ultima: {formatDate(pkg.latest_at)}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-[var(--cp-border)]">
        {pkg.analyses.map((run) => (
          <li key={run.id}>
            <Link
              href={`/analysis/${run.id}`}
              className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-[var(--cp-border)]/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--cp-muted)]">
                  #{run.id}
                </span>
                <AnalysisModeBadge mode={run.analysis_mode} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--cp-muted)]">
                  {formatDate(run.created_at)}
                </span>
                <AnalysisStatusBadge status={run.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PackageList({ packages }: { packages: PackageGroup[] }) {
  if (packages.length === 0) {
    return (
      <div className="rounded-none border border-[var(--cp-border)] bg-[var(--cp-surface)] px-6 py-12 text-center">
        <p className="text-sm text-[var(--cp-muted)]">
          Nenhum pacote encontrado. Conclua ao menos uma analise para ver o historico aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {packages.map((pkg) => (
        <PackageCard key={pkg.project_code} pkg={pkg} />
      ))}
    </div>
  );
}
