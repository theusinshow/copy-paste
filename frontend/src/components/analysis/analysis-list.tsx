"use client";

import { useState } from "react";
import Link from "next/link";

import { AnalysisCard } from "@/components/analysis/analysis-card";
import { AnalysisEmptyState } from "@/components/analysis/analysis-empty-state";
import type { AnalysisRun } from "@/lib/types/analysis";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { id: "all", label: "Todos" },
  { id: "completed", label: "Concluidas" },
  { id: "processing", label: "Em andamento" },
  { id: "failed", label: "Falha" },
  { id: "cancelled", label: "Canceladas" },
  { id: "created", label: "Criadas" },
] as const;

const MODE_FILTERS = [
  { id: "all", label: "Todos modos" },
  { id: "full_check", label: "Completa" },
  { id: "memorial_only", label: "Memorial" },
  { id: "sheets_only", label: "Pranchas" },
  { id: "ld_only", label: "LD" },
  { id: "find_text", label: "Busca" },
  { id: "find_replace", label: "Substituicao" },
  { id: "check_address", label: "Endereco" },
  { id: "check_project_number", label: "N. projeto" },
  { id: "check_work_name", label: "Nome da obra" },
] as const;

type AnalysisListProps = {
  analyses: AnalysisRun[];
  loadError?: string | null;
  variant?: "default" | "compact";
};

export function AnalysisList({
  analyses,
  loadError,
  variant = "default",
}: AnalysisListProps) {
  const isCompact = variant === "compact";
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  function setStatusFilterAndReset(value: string) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function setModeFilterAndReset(value: string) {
    setModeFilter(value);
    setCurrentPage(1);
  }

  const filtered = analyses.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (modeFilter !== "all" && a.analysis_mode !== modeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section
      className={
        isCompact
          ? "rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 opacity-80 transition-opacity hover:opacity-100"
          : "rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      }
      style={isCompact ? undefined : { boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Historico
          </p>
          <h2
            className={
              isCompact
                ? "text-base font-semibold text-[var(--cp-text)]"
                : "text-2xl font-semibold text-[var(--cp-text)]"
            }
          >
        Análises feitas
          </h2>
          {isCompact ? null : (
            <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
              Esta lista usa o endpoint atual do backend para abrir a Central de
        Análise e consulta do resultado técnico de cada execução.
            </p>
          )}
        </div>

        {isCompact ? (
          <span className="text-xs text-[var(--cp-muted)]">
            {analyses.length} registro(s)
          </span>
        ) : (
          <Link
            href="/analysis/new"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] px-4 py-2 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
            Abrir Central
          </Link>
        )}
      </div>

      {!isCompact ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilterAndReset(f.id)}
                className={`rounded-none border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                  statusFilter === f.id
                    ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/12 text-[var(--cp-accent)]"
                    : "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MODE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setModeFilterAndReset(f.id)}
                className={`rounded-none border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                  modeFilter === f.id
                    ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/12 text-[var(--cp-accent)]"
                    : "border-[var(--cp-border)] bg-black/10 text-[var(--cp-muted)] hover:border-[var(--cp-accent)]/40 hover:text-[var(--cp-text)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="ml-auto self-end text-xs text-[var(--cp-muted)]">
            {filtered.length} de {analyses.length} resultado(s)
          </span>
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-6 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      <div className="mt-6">
        {filtered.length === 0 ? (
          <AnalysisEmptyState />
        ) : (
          <div className="grid gap-4">
            {pageItems.map((analysis) => (
              <AnalysisCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>

      {!isCompact && totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between border-t border-[var(--cp-border)] pt-4">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-none border border-[var(--cp-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-[var(--cp-muted)]">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-none border border-[var(--cp-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Proxima →
          </button>
        </div>
      ) : null}
    </section>
  );
}
