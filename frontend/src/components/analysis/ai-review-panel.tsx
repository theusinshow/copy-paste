import type { AiReview } from "@/lib/types/analysis";

type AiReviewPanelProps = {
  review: AiReview | null;
  loadError?: string | null;
};

export function AiReviewPanel({ review, loadError }: AiReviewPanelProps) {
  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--cp-border)] pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
            Apoio de leitura
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            Trechos separados para ajudar a revisao.
          </h2>
          {review ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--cp-muted)]">
              {review.summary}
            </p>
          ) : null}
        </div>

        {review ? (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label="Contextos" value={review.stats.context_count} />
            <Metric label="Sugestoes" value={review.stats.suggestion_count} />
            <Metric label="Conflitos" value={review.stats.probable_issue_count} />
            <Metric label="Revisar" value={review.stats.needs_review_count} />
          </div>
        ) : null}
      </div>

      {loadError ? (
        <div className="mt-5 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && review ? (
        <div className="mt-5 grid gap-5">
          <ProviderStatus status={review.provider_status} />
          <SuggestionList review={review} />
          <ContextList review={review} />
        </div>
      ) : null}
    </section>
  );
}

function ProviderStatus({ status }: { status: string }) {
  const isConfigured = status === "configured";

  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        Recurso externo
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--cp-text)]">
        {isConfigured
          ? "Ha um recurso externo configurado para apoiar a leitura."
          : "Nenhum recurso externo esta configurado. Mesmo assim o sistema separou trechos e pontos para apoiar a revisao humana."}
      </p>
    </div>
  );
}

function SuggestionList({ review }: { review: AiReview }) {
  if (review.suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhuma sugestao estrutural foi gerada nesta etapa.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10">
      <div className="border-b border-[var(--cp-border)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
          Pontos sugeridos para olhar
        </p>
      </div>
      <div className="divide-y divide-[var(--cp-border)]">
        {review.suggestions.map((suggestion) => (
          <article
            key={`${suggestion.reason}-${suggestion.message}`}
            className="grid gap-2 px-4 py-4 md:grid-cols-[1fr_160px]"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--cp-text)]">
                {suggestion.message}
              </p>
              <p className="mt-1 text-xs text-[var(--cp-muted)]">
                {suggestion.reason}
              </p>
            </div>
            <span className="h-fit w-fit rounded-full border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cp-warning)]">
              {suggestion.severity}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContextList({ review }: { review: AiReview }) {
  if (review.contexts.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4 text-sm text-[var(--cp-muted)]">
        Nenhum trecho foi preparado para leitura assistida.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10">
      <div className="border-b border-[var(--cp-border)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
          Trechos separados
        </p>
      </div>
      <div className="divide-y divide-[var(--cp-border)]">
        {review.contexts.slice(0, 8).map((context) => (
          <article
            key={`${context.document_id}-${context.kind}-${context.page_start}-${context.title}`}
            className="grid gap-3 px-4 py-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--cp-text)]">
                  {context.title}
                </p>
                <p className="mt-1 text-xs text-[var(--cp-muted)]">
                  {context.filename} - p{context.page_start}
                  {context.page_end !== context.page_start
                    ? ` a ${context.page_end}`
                    : ""}
                </p>
              </div>
              <span className="w-fit rounded border border-[var(--cp-border)] bg-black/10 px-2 py-1 text-xs text-[var(--cp-muted)]">
                {context.section_label}
              </span>
            </div>
            <p className="line-clamp-3 text-xs leading-6 text-[var(--cp-muted)]">
              {context.evidence_text}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-[var(--cp-text)]">
        {value.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
