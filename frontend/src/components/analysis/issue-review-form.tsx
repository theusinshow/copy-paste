"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  REVIEW_DECISION_OPTIONS,
  normalizeReviewDecisionValue,
} from "@/lib/analysis/review-decisions";
import { reviewIssue } from "@/lib/api/issues";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import type { IssueReview } from "@/lib/types/issue";

type IssueReviewFormProps = {
  issueId: number;
  review: IssueReview | null;
};

export function IssueReviewForm({ issueId, review }: IssueReviewFormProps) {
  const router = useRouter();
  const [decision, setDecision] = useState(
    normalizeReviewDecisionValue(review?.decision),
  );
  const [comment, setComment] = useState(review?.comment ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);
    setIsSaving(true);

    try {
      await reviewIssue(issueId, {
        comment,
        decision,
      });
      setFeedback("Revisao salva com sucesso.");
      startTransition(() => {
        router.refresh();
      });
    } catch (submissionError) {
      setError(
        extractApiErrorMessage(
          submissionError,
          "Nao foi possivel salvar a revisao desta issue agora.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
          <span className="text-xs uppercase tracking-[0.18em]">Resultado da revisão</span>
          <select
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)]"
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
          <span className="text-xs uppercase tracking-[0.18em]">Observação</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Explique rapidamente o que foi conferido ou corrigido."
            rows={3}
            className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2 text-sm text-[var(--cp-text)] outline-none transition-colors focus:border-[var(--cp-accent)]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!decision.trim() || isSaving || isPending}
          className="rounded-lg border border-[var(--cp-accent)] bg-[var(--cp-accent)]/10 px-4 py-2 text-sm font-medium text-[var(--cp-accent)] transition-colors hover:bg-[var(--cp-accent)]/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving || isPending ? "Salvando..." : "Salvar revisão"}
        </button>

        {review ? (
          <div className="grid gap-1 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            <span>Revisão atual: {review.status_label}</span>
            <span>Resultado: {review.decision_label || review.decision}</span>
          </div>
        ) : (
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            Sem revisão registrada
          </span>
        )}
      </div>

      {review && !decision ? (
        <div className="rounded-lg border border-[var(--cp-warning)]/35 bg-[var(--cp-warning)]/10 px-3 py-2 text-sm text-[var(--cp-text)]">
          A decisão salva anteriormente não está no conjunto padrão atual.
          Selecione uma opção padronizada para normalizar o fechamento.
        </div>
      ) : null}

      <div className="grid gap-2 rounded-lg border border-[var(--cp-border)] bg-black/10 p-3 text-xs leading-6 text-[var(--cp-muted)]">
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
