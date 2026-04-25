import { AnalysisList } from "@/components/analysis/analysis-list";
import { HomeIntakeFlow } from "@/components/home-intake-flow";
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
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <HomeIntakeFlow />

        <aside className="grid gap-4 self-start">
          <WorkflowPanel />
          <AnalysisList
            analyses={analyses}
            loadError={loadError}
            variant="compact"
          />
        </aside>
      </section>
    </div>
  );
}

function WorkflowPanel() {
  const steps = [
    "Enviar arquivos",
    "Ler o conteudo",
    "Comparar informacoes",
    "Revisar o resultado",
  ];

  return (
    <section className="rounded-lg border border-[var(--cp-border)] bg-black/12 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--cp-accent)]">
        Fluxo
      </p>
      <div className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 border-b border-[var(--cp-border)] pb-3 last:border-b-0 last:pb-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--cp-border)] font-mono text-xs text-[var(--cp-muted)]">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <span className="text-sm font-medium text-[var(--cp-text)]">
              {step}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
