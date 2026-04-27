"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { REVIEW_DECISION_OPTIONS } from "@/lib/analysis/review-decisions";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import { reviewAnalysisIssuesBatch } from "@/lib/api/issues";

type IssueBatchReviewPanelProps = {
  activeFilterLabel: string;
  analysisId: number;
  onClearSelection: () => void;
  onSelectVisible: () => void;
  selectedCount: number;
  selectedIssueIds: number[];
  visibleCount: number;
};

export function IssueBatchReviewPanel({
  activeFilterLabel,
  analysisId,
  onClearSelection,
  onSelectVisible,
  selectedCount,
  selectedIssueIds,
  visibleCount,
}: IssueBatchReviewPanelProps) {
  const router = useRouter();
  const [decision, setDecision] = useState("");
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSubmit = selectedCount > 0 && decision.trim().length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setFeedback(null);
    setError(null);
    setIsSaving(true);

    try {
      const result = await reviewAnalysisIssuesBatch(analysisId, {
        comment,
        decision,
        issue_ids: selectedIssueIds,
      });
      setFeedback(
        `${result.updated_count} ponto(s) atualizado(s) como ${result.decision_label}.`,
      );
      setComment("");
      setDecision("");
      onClearSelection();
      startTransition(() => {
        router.refresh();
      });
    } catch (submissionError) {
      setError(
        extractApiErrorMessage(
          submissionError,
          "Não foi possível salvar a revisão em lote agora.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-none border border-[var(--cp-border)] bg-black/10 p-4"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-accent)]">
            Checklist pós-análise
          </p>
          <p className="text-sm leading-6 text-[var(--cp-text)]">
            {selectedCount} ponto(s) selecionado(s) entre {visibleCount} visível(is)
            na fila <span className="font-semibold">{activeFilterLabel}</span>.
          </p>
          <p className="text-sm leading-6 text-[var(--cp-muted)]">
            Use esta área para registrar o mesmo resultado em vários pontos de
            uma vez. Depois, ajuste individualmente apenas o que precisar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSelectVisible}
            disabled={visibleCount === 0 || isSaving || isPending}
            className="rounded-none border border-[var(--cp-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Selecionar visíveis
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={selectedCount === 0 || isSaving || isPending}
            className="rounded-none border border-[var(--cp-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Limpar seleção
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
          <span className="text-xs uppercase tracking-[0.18em]">Resultado em lote</span>
          <select
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/70 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)]"
          >
            <option value="">Selecionar resultado</option>
            {REVIEW_DECISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
          <span className="text-xs uppercase tracking-[0.18em]">
            Observação comum
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Registrar contexto compartilhado para todos os pontos selecionados."
            rows={3}
            className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/70 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)]"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={!canSubmit || isSaving || isPending}
            className="w-full rounded-lg border border-[var(--cp-accent)] bg-[var(--cp-accent)]/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--cp-accent)] transition-colors hover:bg-[var(--cp-accent)]/15 disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
          >
            {isSaving || isPending ? "Aplicando..." : "Aplicar em lote"}
          </button>
        </div>
      </div>

      <div className="grid gap-2 text-xs leading-6 text-[var(--cp-muted)]">
        {REVIEW_DECISION_OPTIONS.map((option) => (
          <p key={option.value}>
            <span className="font-semibold text-[var(--cp-text)]">
              {option.label}:
            </span>{" "}
            {option.description}
          </p>
        ))}
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
  );
}
