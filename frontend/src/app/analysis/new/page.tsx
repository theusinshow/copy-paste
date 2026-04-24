import type { Metadata } from "next";
import Link from "next/link";

import { NewAnalysisForm } from "@/components/analysis/new-analysis-form";

export const metadata: Metadata = {
  title: "Central de analise",
};

const uploadRules = [
  "PDFs apenas, em envio multipart para o backend atual.",
  "O modo e enviado em POST /api/v1/analysis com config flexivel.",
  "O tipo continua sendo aplicado ao conjunto de arquivos enviado nesta etapa.",
  "O processamento e iniciado por POST /api/v1/analysis/{analysis_id}/start de forma sincronica.",
];

const nextSteps = [
  "Selecionar o modo de analise e preencher a configuracao dinamica.",
  "Criar a analise via POST /api/v1/analysis com default em full_check.",
  "Enviar os PDFs via POST /api/v1/analysis/{analysis_id}/files.",
  "Iniciar o processamento via POST /api/v1/analysis/{analysis_id}/start.",
  "Liberar o link de resultado somente quando o status final for completed.",
];

export default function NewAnalysisPage() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-8">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--cp-accent)]">
            Central de Analise
          </p>
          <div className="mt-4 space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--cp-text)]">
              Configure o modo, envie os PDFs e dispare a analise.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--cp-muted)]">
              Esta tela evolui o upload atual para uma Central de Analise com
              modos configuraveis. O contrato segue compativel com `full_check`
              como padrao, e o start continua sincronico.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-[var(--cp-border)] px-4 py-2 text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-accent)] hover:text-[var(--cp-text)]"
            >
              Voltar para analises
            </Link>
            <span className="rounded-full bg-[var(--cp-accent)]/10 px-4 py-2 font-medium text-[var(--cp-accent)]">
              Fluxo atual: Lista → Central de Analise → Upload → Processamento
            </span>
          </div>
        </div>

        <NewAnalysisForm />
      </section>

      <aside className="grid gap-4">
        <InfoPanel
          title="Como esta tela funciona"
          items={nextSteps}
          tone="accent"
        />
        <InfoPanel title="Regras desta etapa" items={uploadRules} tone="muted" />
      </aside>
    </div>
  );
}

function InfoPanel(props: {
  items: string[];
  title: string;
  tone: "accent" | "muted";
}) {
  const dotClassName =
    props.tone === "accent"
      ? "bg-[var(--cp-accent)]"
      : "bg-[var(--cp-info)]";

  return (
    <section
      className="rounded-[1.75rem] border border-[var(--cp-border)] bg-black/15 p-6"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--cp-muted)]">
        {props.title}
      </h2>
      <ul className="mt-4 space-y-3">
        {props.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm leading-6 text-[var(--cp-text)]"
          >
            <span
              className={`mt-2 h-2 w-2 rounded-full ${dotClassName}`}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
