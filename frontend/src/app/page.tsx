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
    <div className="grid gap-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="grid gap-5">
          <div className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/88 p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cp-accent)]">
                  Nova auditoria
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--cp-text)] sm:text-4xl">
                  Conferencia documental para PDFs tecnicos.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cp-muted)] sm:text-base">
                  Anexe um pacote, escolha o modo de verificacao e acompanhe os
                  resultados por evidencia, sem decisao automatica por IA.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <HomeMetric label="Modo" value="Full" />
                <HomeMetric label="Base" value="PDF" />
                <HomeMetric label="Saida" value="Issues" />
              </div>
            </div>
          </div>

          <NewAnalysisForm />
        </div>

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

function HomeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--cp-border)] bg-black/12 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--cp-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold text-[var(--cp-text)]">
        {value}
      </p>
    </div>
  );
}

function WorkflowPanel() {
  const steps = ["Upload", "Extracao", "Regras", "Revisao"];

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
