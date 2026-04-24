import Link from "next/link";

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
      className={`mt-6 rounded-[1.5rem] border p-5 ${appearance.className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium leading-6 text-[var(--cp-text)]">
            {state.message}
          </p>
          {state.analysis ? (
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
              Analise criada: #{state.analysis.id}
            </p>
          ) : null}
        </div>

        {state.status !== "idle" ? (
          <AnalysisStatusBadge status={state.status} />
        ) : null}
      </div>

      {state.documents.length > 0 ? (
        <UploadedDocumentsList documents={state.documents} />
      ) : null}

      {state.analysis ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--cp-border)] pt-4 text-sm">
          {state.status === "completed" ? (
            <Link
              href={`/analysis/${state.analysis.id}`}
              className="inline-flex items-center justify-center rounded-full bg-[var(--cp-accent)] px-5 py-3 font-semibold text-[var(--cp-accent-ink)]"
            >
              Ver resultado
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--cp-border)] px-5 py-3 font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
            Voltar para analises
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

  if (state.status === "processing") {
    return {
      className: "border-[var(--cp-info)]/40 bg-[var(--cp-info)]/10",
    };
  }

  return {
    className: "border-[var(--cp-accent)]/40 bg-[var(--cp-accent)]/10",
  };
}
