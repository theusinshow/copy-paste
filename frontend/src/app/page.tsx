import { AnalysisList } from "@/components/analysis/analysis-list";
import { NewAnalysisForm } from "@/components/analysis/new-analysis-form";
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
      <section className="space-y-5">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--cp-accent)]">
            Copy&amp;Paste
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
            Anexe o documento e escolha as verificacoes.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
            O fluxo cria a analise, envia os PDFs e inicia o processamento com
            as regras explicitas do sistema.
          </p>
        </div>

        <NewAnalysisForm />
      </section>

      <AnalysisList analyses={analyses} loadError={loadError} variant="compact" />
    </div>
  );
}
