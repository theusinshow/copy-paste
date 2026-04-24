import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisResultHeader } from "@/components/analysis/analysis-result-header";
import { ExtractedFieldList } from "@/components/analysis/extracted-field-list";
import { IssueList } from "@/components/analysis/issue-list";
import {
  getAnalysis,
  listAnalysisFields,
  listAnalysisIssues,
} from "@/lib/api/analysis";
import { ApiError, extractApiErrorMessage } from "@/lib/api/fetcher";
import type { AnalysisRun, ExtractedField } from "@/lib/types/analysis";
import type { AnalysisIssue } from "@/lib/types/issue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado da analise",
};

type AnalysisResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AnalysisResultPage({
  params,
}: AnalysisResultPageProps) {
  const { id } = await params;
  const analysisId = Number(id);

  if (!Number.isInteger(analysisId) || analysisId <= 0) {
    notFound();
  }

  const analysis = await loadAnalysisOrNotFound(analysisId);

  let issues: AnalysisIssue[] = [];
  let issuesLoadError: string | null = null;
  let fields: ExtractedField[] = [];
  let fieldsLoadError: string | null = null;

  try {
    [issues, fields] = await Promise.all([
      listAnalysisIssues(analysisId),
      listAnalysisFields(analysisId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    issuesLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar as issues desta analise agora.",
    );
    fieldsLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar os campos extraidos desta analise agora.",
    );
  }

  const relevantCount = issues.filter(
    (issue) => issue.severity === "relevante",
  ).length;
  const attentionCount = issues.filter(
    (issue) => issue.severity === "atencao",
  ).length;

  return (
    <div className="grid gap-8">
      <AnalysisResultHeader
        analysis={analysis}
        attentionCount={attentionCount}
        issueCount={issues.length}
        relevantCount={relevantCount}
      />
      <IssueList
        issues={issues}
        loadError={issuesLoadError}
        status={analysis.status}
      />
      <ExtractedFieldList fields={fields} loadError={fieldsLoadError} />
    </div>
  );
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
