import type { Metadata } from "next";

import { NewAnalysisForm } from "@/components/analysis/new-analysis-form";

export const metadata: Metadata = {
  title: "Nova análise",
};

export default function NewAnalysisPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Nova análise
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
          Anexe o documento e escolha as verificações.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
          O fluxo cria a análise, envia os PDFs e inicia o processamento com as
          regras explícitas do sistema.
        </p>
      </div>

      <NewAnalysisForm />
    </div>
  );
}
