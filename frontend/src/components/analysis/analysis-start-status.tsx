import Link from "next/link";

import { AnalysisModeBadge } from "@/components/analysis/analysis-mode-badge";
import { AnalysisStatusBadge } from "@/components/analysis/analysis-status-badge";
import { UploadedDocumentsList } from "@/components/analysis/uploaded-documents-list";
import type { NewAnalysisActionState } from "@/lib/types/new-analysis-action";

export function AnalysisStartStatus({
  state,
}: {
  state: NewAnalysisActionState;
}) {
  if (state.status === "idle" && !state.message) {
    return null;
  }

  const appearance = getStatusAppearance(state);

  return (
    <section
      className={`mt-6 rounded-none border p-5 ${appearance.className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium leading-6 text-[var(--cp-text)]">
            {state.message}
          </p>
          {state.analysis ? (
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
          <span>Análise criada: #{state.analysis.id}</span>
              <AnalysisModeBadge mode={state.analysis.analysis_mode} />
            </div>
          ) : null}
        </div>

        {state.status !== "idle" ? (
          <AnalysisStatusBadge status={state.status} />
        ) : null}
      </div>

      {state.documents.length > 0 ? (
        <UploadedDocumentsList documents={state.documents} />
      ) : null}

      {state.analysis && Object.keys(state.analysis.config).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(state.analysis.config).map(([key, value]) => (
            <span
              key={key}
              className="rounded-none border border-[var(--cp-border)] bg-white/5 px-3 py-1 text-xs text-[var(--cp-muted)]"
            >
              {key}: {String(value)}
            </span>
          ))}
        </div>
      ) : null}

      {state.analysis ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--cp-border)] pt-4 text-sm">
          {state.status === "completed" ? (
            <Link
              href={`/analysis/${state.analysis.id}`}
              className="inline-flex items-center justify-center rounded-none bg-[var(--cp-accent)] px-5 py-3 font-semibold text-[var(--cp-accent-ink)]"
            >
              Ver resultado
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-none border border-[var(--cp-border)] px-5 py-3 font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
          Voltar para análises
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function getStatusAppearance(state: NewAnalysisActionState) {
  if (state.tone === "error" || state.status === "failed") {
    return {
      className: "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10",
    };
  }

  if (state.status === "completed") {
    return {
      className: "border-[var(--cp-success)]/40 bg-[var(--cp-success)]/10",
    };
  }

  if (state.status === "cancelled") {
    return {
      className: "border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10",
    };
  }

  if (state.status === "processing") {
    return {
      className: "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/10",
    };
  }

  return {
    className: "border-[var(--cp-accent)]/40 bg-[var(--cp-accent)]/10",
  };
}
