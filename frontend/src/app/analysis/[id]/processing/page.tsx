import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProcessingMonitor } from "@/components/analysis/processing-monitor";
import { getAnalysis } from "@/lib/api/analysis";
import { ApiError } from "@/lib/api/fetcher";
import type { AnalysisRun } from "@/lib/types/analysis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Processamento da análise",
};

type ProcessingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProcessingPage({ params }: ProcessingPageProps) {
  const { id } = await params;
  const analysisId = Number(id);

  if (!Number.isInteger(analysisId) || analysisId <= 0) {
    notFound();
  }

  const analysis = await loadAnalysisOrNotFound(analysisId);

  return <ProcessingMonitor initialAnalysis={analysis} />;
}

async function loadAnalysisOrNotFound(analysisId: number): Promise<AnalysisRun> {
  try {
    return await getAnalysis(analysisId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
