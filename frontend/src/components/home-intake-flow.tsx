"use client";

import { useEffect, useRef, useState } from "react";

import { NewAnalysisForm } from "@/components/analysis/new-analysis-form";

export function HomeIntakeFlow() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFormVisible) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isFormVisible]);

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Copy&amp;Paste
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--cp-text)]">
          Revise pacotes de PDFs com um fluxo guiado.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--cp-muted)]">
          Envie os arquivos, escolha o tipo de verificacao e receba um resultado
          com evidencias e sem decisao automatica por IA.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
          <span className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1.5">
            1. Enviar PDFs
          </span>
          <span className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1.5">
            2. Escolher a revisao
          </span>
          <span className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1.5">
            3. Classificar os arquivos
          </span>
          <span className="rounded-none border border-[var(--cp-border)] bg-black/10 px-3 py-1.5">
            4. Ler o resultado
          </span>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setIsFormVisible(true)}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--cp-accent)] px-5 py-3 text-sm font-semibold text-[var(--cp-accent-ink)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Comecar agora
          </button>
        </div>
      </section>

      <div ref={formRef}>
        {isFormVisible ? (
          <NewAnalysisForm />
        ) : (
          <section className="rounded-lg border border-dashed border-[var(--cp-border)] bg-black/10 p-5 text-sm leading-7 text-[var(--cp-muted)]">
            Clique em{" "}
            <span className="font-semibold text-[var(--cp-text)]">
              Comecar agora
            </span>{" "}
            para abrir o envio dos arquivos e iniciar a revisao.
          </section>
        )}
      </div>
    </div>
  );
}
