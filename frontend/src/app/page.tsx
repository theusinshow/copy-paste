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
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <HomeIntakeFlow />

        <aside className="self-start">
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
