import Link from "next/link";

import { AnalysisList } from "@/components/analysis/analysis-list";
import { listAnalyses } from "@/lib/api/analysis";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import type { AnalysisRun } from "@/lib/types/analysis";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let analyses: AnalysisRun[] = [];
  let loadError: string | null = null;

  try {
    analyses = await listAnalyses();
  } catch (error) {
    loadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar as analises agora.",
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div
          className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/90 p-8"
          style={{ boxShadow: "var(--cp-shadow)" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--cp-border)] bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Copy&amp;Paste
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cp-accent)]" />
            Frontend Base
          </div>

          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-5xl">
              Auditoria documental com leitura rapida e fluxo tecnico.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--cp-muted)] sm:text-lg">
              A base do frontend ja conversa com o backend atual para listar
              analises, criar uma nova analise e iniciar o upload inicial de
              PDFs, mantendo o fluxo separado por etapas.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analysis/new"
              className="inline-flex items-center justify-center rounded-full bg-[var(--cp-accent)] px-6 py-3 text-sm font-semibold text-[var(--cp-accent-ink)] transition-transform duration-200 hover:-translate-y-0.5"
            >
              Nova analise
            </Link>
            <div className="inline-flex items-center rounded-full border border-[var(--cp-border)] px-4 py-3 text-sm text-[var(--cp-muted)]">
              Backend alvo: <span className="ml-2 font-mono">/api/v1</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <OverviewCard
            label="Analises registradas"
            value={analyses.length.toString().padStart(2, "0")}
            helper="Carregadas via GET /api/v1/analysis"
          />
          <OverviewCard
            label="Etapa atual"
            value="Start"
            helper="Criacao, upload e inicio sincronico do processamento ja integrados ao backend"
          />
          <OverviewCard
            label="Identidade visual"
            value="90/10"
            helper="Base escura com destaque pontual em amarelo"
          />
        </div>
      </section>

      <AnalysisList analyses={analyses} loadError={loadError} />
    </div>
  );
}

function OverviewCard(props: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <article
      className="rounded-[1.75rem] border border-[var(--cp-border)] bg-black/15 p-5"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-muted)]">
        {props.label}
      </p>
      <p className="mt-4 font-mono text-3xl font-semibold text-[var(--cp-text)]">
        {props.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--cp-muted)]">
        {props.helper}
      </p>
    </article>
  );
}
