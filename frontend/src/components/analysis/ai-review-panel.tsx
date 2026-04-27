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
            {review?.provider_status === "ok" ? "Análise assistida por IA" : "Apoio de leitura"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
            {review?.provider_status === "ok"
              ? "Revisão gerada pelo modelo de linguagem."
              : "Trechos separados para ajudar a revisão."}
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
            <Metric label="Sugestões" value={review.stats.suggestion_count} />
            <Metric label="Verificar" value={review.stats.probable_issue_count} />
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
          <ProviderStatus review={review} />
          {review.ai_narrative ? <AiNarrative review={review} /> : null}
          <SuggestionList review={review} />
          <ContextList review={review} />
        </div>
      ) : null}
    </section>
  );
}

function ProviderStatus({ review }: { review: AiReview }) {
  const { provider_status, ai_model } = review;

  if (provider_status === "ok") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--cp-accent)]/30 bg-[var(--cp-accent)]/5 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cp-accent)]" />
        <p className="text-xs text-[var(--cp-muted)]">
          Análise gerada por{" "}
          <span className="font-semibold text-[var(--cp-text)]">{ai_model}</span>{" "}
          via Groq
        </p>
      </div>
    );
  }

  if (provider_status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[var(--cp-error)]/30 bg-[var(--cp-error)]/5 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cp-error)]" />
        <p className="text-xs text-[var(--cp-muted)]">
          O modelo de linguagem não respondeu. Exibindo análise estrutural.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        Recurso externo
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--cp-text)]">
        Nenhum modelo de linguagem configurado. Configure{" "}
        <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-xs">
          GROQ_API_KEY
        </code>{" "}
        no backend para ativar a análise assistida.
      </p>
    </div>
  );
}

function AiNarrative({ review }: { review: AiReview }) {
  const paragraphs = (review.ai_narrative ?? "")
    .split("\n")
    .filter((line) => line.trim());

  return (
    <div className="rounded-lg border border-[var(--cp-accent)]/20 bg-black/10">
      <div className="flex items-center gap-3 border-b border-[var(--cp-border)] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--cp-accent)]">
          Análise do modelo
        </p>
      </div>
      <div className="space-y-3 px-4 py-4">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-sm leading-6 text-[var(--cp-text)]">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}

function SuggestionList({ review }: { review: AiReview }) {
  if (review.suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--cp-success)]/30 bg-[var(--cp-success)]/10 p-4 text-sm text-[var(--cp-text)]">
        Nenhuma sugestão estrutural foi gerada nesta etapa.
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
            <span className="h-fit w-fit rounded-none border border-[var(--cp-warning)]/40 bg-[var(--cp-warning)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cp-warning)]">
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
