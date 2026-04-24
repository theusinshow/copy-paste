import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisResultHeader } from "@/components/analysis/analysis-result-header";
import { DetectedSheetsPanel } from "@/components/analysis/detected-sheets-panel";
import { DrawingListPanel } from "@/components/analysis/drawing-list-panel";
import { ExtractedFieldList } from "@/components/analysis/extracted-field-list";
import { IssueList } from "@/components/analysis/issue-list";
import { LdSheetCrosscheckPanel } from "@/components/analysis/ld-sheet-crosscheck-panel";
import { MemorialAuditPanel } from "@/components/analysis/memorial-audit-panel";
import { PackageSummaryPanel } from "@/components/analysis/package-summary-panel";
import {
  getDetectedSheets,
  getDrawingLists,
  getLdSheetCrosscheck,
  getMemorialAudit,
  getPackageSummary,
  getAnalysis,
  listAnalysisFields,
  listAnalysisIssues,
} from "@/lib/api/analysis";
import { ApiError, extractApiErrorMessage } from "@/lib/api/fetcher";
import type {
  AnalysisRun,
  DetectedSheets,
  DrawingLists,
  ExtractedField,
  LdSheetCrosscheck,
  MemorialAudit,
  PackageSummary,
} from "@/lib/types/analysis";
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
  let packageSummary: PackageSummary | null = null;
  let packageSummaryLoadError: string | null = null;
  let drawingLists: DrawingLists | null = null;
  let drawingListsLoadError: string | null = null;
  let detectedSheets: DetectedSheets | null = null;
  let detectedSheetsLoadError: string | null = null;
  let ldSheetCrosscheck: LdSheetCrosscheck | null = null;
  let ldSheetCrosscheckLoadError: string | null = null;
  let memorialAudit: MemorialAudit | null = null;
  let memorialAuditLoadError: string | null = null;

  try {
    [
      issues,
      fields,
      packageSummary,
      drawingLists,
      detectedSheets,
      ldSheetCrosscheck,
      memorialAudit,
    ] = await Promise.all([
      listAnalysisIssues(analysisId),
      listAnalysisFields(analysisId),
      getPackageSummary(analysisId),
      getDrawingLists(analysisId),
      getDetectedSheets(analysisId),
      getLdSheetCrosscheck(analysisId),
      getMemorialAudit(analysisId),
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
    packageSummaryLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar o resumo do pacote desta analise agora.",
    );
    drawingListsLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar as Listas de Documentos desta analise agora.",
    );
    detectedSheetsLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar as pranchas detectadas desta analise agora.",
    );
    ldSheetCrosscheckLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar o cruzamento LD x Pranchas desta analise agora.",
    );
    memorialAuditLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar a auditoria de memoriais desta analise agora.",
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
      <PackageSummaryPanel
        summary={packageSummary}
        loadError={packageSummaryLoadError}
      />
      <DrawingListPanel
        drawingLists={drawingLists}
        loadError={drawingListsLoadError}
      />
      <DetectedSheetsPanel
        detectedSheets={detectedSheets}
        loadError={detectedSheetsLoadError}
      />
      <LdSheetCrosscheckPanel
        crosscheck={ldSheetCrosscheck}
        loadError={ldSheetCrosscheckLoadError}
      />
      <MemorialAuditPanel
        audit={memorialAudit}
        loadError={memorialAuditLoadError}
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
