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
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--cp-border)] bg-[radial-gradient(circle_at_top_left,rgba(201,154,46,0.22),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(201,154,46,0.08),transparent)] lg:block" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--cp-accent)]">
              Comece por aqui
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-5xl">
                Revise seus PDFs com um fluxo guiado e mais claro.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--cp-muted)] sm:text-base">
                Envie os arquivos, escolha o tipo de verificacao e receba um
                resultado mais facil de entender, com evidencias e sem decisao
                automatica por IA.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              <span className="rounded-full border border-[var(--cp-border)] bg-black/10 px-3 py-2">
                1. Enviar PDFs
              </span>
              <span className="rounded-full border border-[var(--cp-border)] bg-black/10 px-3 py-2">
                2. Escolher a revisao
              </span>
              <span className="rounded-full border border-[var(--cp-border)] bg-black/10 px-3 py-2">
                3. Ler o resultado
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFormVisible(true)}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--cp-accent)] px-5 py-3 text-sm font-semibold text-[var(--cp-accent-ink)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Comecar agora
              </button>
              <p className="text-sm leading-6 text-[var(--cp-muted)]">
                O historico das analises continua disponivel na coluna da direita.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <HeroFact
              label="Melhor para"
              value="Pacotes tecnicos e revisoes guiadas"
            />
            <HeroFact
              label="Fluxo"
              value="Upload, escolha, processamento e leitura"
            />
            <HeroFact
              label="Saida"
              value="Resumo claro com evidencias"
            />
          </div>
        </div>
      </section>

      <div ref={formRef}>
        {isFormVisible ? (
          <NewAnalysisForm />
        ) : (
          <section className="rounded-[1.5rem] border border-dashed border-[var(--cp-border)] bg-black/10 p-5 text-sm leading-7 text-[var(--cp-muted)]">
            Clique em <span className="font-semibold text-[var(--cp-text)]">Comecar agora</span> para abrir o envio dos arquivos e iniciar a revisao.
          </section>
        )}
      </div>
    </div>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--cp-border)] bg-black/10 p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--cp-text)]">
        {value}
      </p>
    </div>
  );
}
