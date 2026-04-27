"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  AUDIT_CLOSURE_OPTIONS,
  getAuditClosureLabel,
} from "@/lib/analysis/audit-closure";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import { upsertAnalysisSignoff } from "@/lib/api/analysis";
import type { AnalysisSignoff } from "@/lib/types/analysis";

type AnalysisSignoffPanelProps = {
  analysisId: number;
  analysisStatus: string;
  computedStatusCode?: string;
  computedStatusLabel?: string;
  signoff: AnalysisSignoff | null;
};

export function AnalysisSignoffPanel({
  analysisId,
  analysisStatus,
  computedStatusCode,
  computedStatusLabel,
  signoff,
}: AnalysisSignoffPanelProps) {
  const router = useRouter();
  const [finalStatusCode, setFinalStatusCode] = useState(
    signoff?.final_status_code ?? computedStatusCode ?? "needs_review",
  );
  const [reviewerName, setReviewerName] = useState(signoff?.reviewer_name ?? "");
  const [comment, setComment] = useState(signoff?.comment ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    analysisStatus === "completed" &&
    finalStatusCode.trim().length > 0 &&
    reviewerName.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setFeedback(null);
    setError(null);
    setIsSaving(true);

    try {
      const response = await upsertAnalysisSignoff(analysisId, {
        comment,
        final_status_code: finalStatusCode,
        reviewer_name: reviewerName,
      });
      setFeedback(
        `Encerramento formal salvo como ${response.final_status_label}.`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (submissionError) {
      setError(
        extractApiErrorMessage(
          submissionError,
          "Não foi possível salvar o encerramento formal agora.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="border-b border-[var(--cp-border)] pb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Conclusão final
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Conclusão registrada da análise.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--cp-muted)]">
          Depois de ler o resumo automático, você pode registrar aqui a decisão
          final da revisão com responsável e comentário.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            Resumo automático
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--cp-text)]">
            {computedStatusLabel || "Sem consolidado"}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            Conclusão salva
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--cp-text)]">
            {signoff?.final_status_label || "Nenhuma conclusão registrada"}
          </p>
          {signoff ? (
            <p className="mt-2 text-sm leading-6 text-[var(--cp-muted)]">
              {signoff.reviewer_name} · {new Date(signoff.updated_at).toLocaleString("pt-BR")}
            </p>
          ) : null}
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 xl:grid-cols-[280px_240px_minmax(0,1fr)]">
          <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
            <span className="text-xs uppercase tracking-[0.18em]">Conclusão final</span>
            <select
              value={finalStatusCode}
              onChange={(event) => setFinalStatusCode(event.target.value)}
              disabled={analysisStatus !== "completed"}
              className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {AUDIT_CLOSURE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
            <span className="text-xs uppercase tracking-[0.18em]">Responsável</span>
            <input
              value={reviewerName}
              onChange={(event) => setReviewerName(event.target.value)}
              disabled={analysisStatus !== "completed"}
              placeholder="Nome de quem encerrou"
              className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
            <span className="text-xs uppercase tracking-[0.18em]">Comentário final</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={analysisStatus !== "completed"}
              placeholder="Explique o motivo da conclusão final."
              rows={3}
              className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-2 rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-xs leading-6 text-[var(--cp-muted)]">
          {AUDIT_CLOSURE_OPTIONS.map((option) => (
            <p key={option.value}>
              <span className="font-semibold text-[var(--cp-text)]">
                {option.label}:
              </span>{" "}
              {option.description}
            </p>
          ))}
        </div>

        {analysisStatus !== "completed" ? (
          <div className="rounded-lg border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 px-3 py-2 text-sm text-[var(--cp-text)]">
            A conclusão final só pode ser salva quando a análise terminar o
            processamento.
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isSaving || isPending}
            className="rounded-lg border border-[var(--cp-accent)] bg-[var(--cp-accent)]/10 px-4 py-2 text-sm font-medium text-[var(--cp-accent)] transition-colors hover:bg-[var(--cp-accent)]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving || isPending ? "Salvando..." : "Salvar conclusão final"}
          </button>

          <span className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            Escolha atual: {getAuditClosureLabel(finalStatusCode)}
          </span>
        </div>

        {feedback ? (
          <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 px-3 py-2 text-sm text-[var(--cp-text)]">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 px-3 py-2 text-sm text-[var(--cp-text)]">
            {error}
          </div>
        ) : null}
      </form>
    </section>
  );
}
