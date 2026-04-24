"use client";

import Link from "next/link";
import { useState } from "react";

import { AnalysisStartStatus } from "@/components/analysis/analysis-start-status";
import { FormSubmitButton } from "@/components/analysis/form-submit-button";
import { runNewAnalysisFlow } from "@/lib/analysis/run-new-analysis-flow";
import { initialNewAnalysisActionState } from "@/lib/types/new-analysis-action";

export function NewAnalysisForm() {
  const [state, setState] = useState(initialNewAnalysisActionState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const tipo = String(formData.get("tipo") ?? "").trim();
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (!tipo) {
      setState({
        ...initialNewAnalysisActionState,
        message: "Informe o tipo aplicado aos PDFs desta analise.",
        status: "failed",
        tone: "error",
      });
      return;
    }

    if (files.length === 0) {
      setState({
        ...initialNewAnalysisActionState,
        message: "Selecione ao menos um arquivo PDF.",
        status: "failed",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await runNewAnalysisFlow({
        files,
        onStateChange: (nextState) => {
          setState(nextState);
        },
        tipo,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-8"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid gap-2">
          <label
            htmlFor="tipo"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cp-muted)]"
          >
            Tipo aplicado aos arquivos
          </label>
          <input
            id="tipo"
            name="tipo"
            type="text"
            required
            placeholder="Ex.: planta, memorial, levantamento"
            className="w-full rounded-2xl border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] outline-none transition-colors placeholder:text-[var(--cp-muted)] focus:border-[var(--cp-accent)]"
          />
          <p className="text-sm leading-6 text-[var(--cp-muted)]">
            O backend atual aplica este tipo a todos os PDFs enviados na mesma
            submissao.
          </p>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="files"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cp-muted)]"
          >
            PDFs da analise
          </label>
          <input
            id="files"
            name="files"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            required
            className="w-full rounded-2xl border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--cp-accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--cp-accent-ink)]"
          />
          <p className="text-sm leading-6 text-[var(--cp-muted)]">
            O upload inicial usa somente os endpoints ja disponiveis do backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <FormSubmitButton pending={isSubmitting} />
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--cp-border)] px-5 py-3 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
            Cancelar
          </Link>
        </div>
      </form>

      <AnalysisStartStatus state={state} />
    </section>
  );
}
