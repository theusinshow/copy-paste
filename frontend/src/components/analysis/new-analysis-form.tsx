"use client";

import Link from "next/link";
import { useActionState } from "react";

import { submitNewAnalysis } from "@/app/analysis/new/actions";
import { FormSubmitButton } from "@/components/analysis/form-submit-button";
import { UploadedDocumentsList } from "@/components/analysis/uploaded-documents-list";
import { initialNewAnalysisActionState } from "@/lib/types/new-analysis-action";

export function NewAnalysisForm() {
  const [state, formAction] = useActionState(
    submitNewAnalysis,
    initialNewAnalysisActionState,
  );

  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-8"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <form action={formAction} className="grid gap-6">
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
          <FormSubmitButton />
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[var(--cp-border)] px-5 py-3 text-sm font-medium text-[var(--cp-text)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-accent)]"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {state.status !== "idle" ? (
        <div
          className={`mt-6 rounded-[1.5rem] border p-5 ${
            state.status === "success"
              ? "border-[var(--cp-success)]/40 bg-[var(--cp-success)]/10"
              : "border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10"
          }`}
        >
          <p className="text-sm font-medium leading-6 text-[var(--cp-text)]">
            {state.message}
          </p>

          {state.analysis ? (
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
              Analise criada: #{state.analysis.id}
            </p>
          ) : null}

          {state.documents.length > 0 ? (
            <UploadedDocumentsList documents={state.documents} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
