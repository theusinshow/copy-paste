import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AiReviewPanel } from "@/components/analysis/ai-review-panel";
import { AnalysisResultHeader } from "@/components/analysis/analysis-result-header";
import { DetectedSheetsPanel } from "@/components/analysis/detected-sheets-panel";
import { DrawingListPanel } from "@/components/analysis/drawing-list-panel";
import { ExtractedFieldList } from "@/components/analysis/extracted-field-list";
import { FooterAuditPanel } from "@/components/analysis/footer-audit-panel";
import { IssueList } from "@/components/analysis/issue-list";
import { LdSheetCrosscheckPanel } from "@/components/analysis/ld-sheet-crosscheck-panel";
import { MemorialAuditPanel } from "@/components/analysis/memorial-audit-panel";
import { PackageMapPanel } from "@/components/analysis/package-map-panel";
import { PageMapPanel } from "@/components/analysis/page-map-panel";
import { PackageSummaryPanel } from "@/components/analysis/package-summary-panel";
import {
  getAiReview,
  getDetectedSheets,
  getDrawingLists,
  getFooterAudit,
  getLdSheetCrosscheck,
  getMemorialAudit,
  getPackageMap,
  getPageMap,
  getPackageSummary,
  getAnalysis,
  listAnalysisFields,
  listAnalysisIssues,
} from "@/lib/api/analysis";
import { ApiError, extractApiErrorMessage } from "@/lib/api/fetcher";
import type {
  AiReview,
  AnalysisRun,
  DetectedSheets,
  DrawingLists,
  ExtractedField,
  FooterAudit,
  LdSheetCrosscheck,
  MemorialAudit,
  PackageMap,
  PageMap,
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

type ExecutiveMetric = {
  label: string;
  tone?: "danger" | "muted" | "success" | "warning";
  value: string;
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
  let packageMap: PackageMap | null = null;
  let packageMapLoadError: string | null = null;
  let pageMap: PageMap | null = null;
  let pageMapLoadError: string | null = null;
  let aiReview: AiReview | null = null;
  let aiReviewLoadError: string | null = null;
  let footerAudit: FooterAudit | null = null;
  let footerAuditLoadError: string | null = null;
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
      packageMap,
      pageMap,
      aiReview,
      footerAudit,
      drawingLists,
      detectedSheets,
      ldSheetCrosscheck,
      memorialAudit,
    ] = await Promise.all([
      listAnalysisIssues(analysisId),
      listAnalysisFields(analysisId),
      getPackageSummary(analysisId),
      getPackageMap(analysisId),
      getPageMap(analysisId),
      getAiReview(analysisId),
      getFooterAudit(analysisId),
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
    packageMapLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar o mapa do pacote desta analise agora.",
    );
    pageMapLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar o mapa de paginas desta analise agora.",
    );
    aiReviewLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar a leitura inteligente desta analise agora.",
    );
    footerAuditLoadError = extractApiErrorMessage(
      error,
      "Nao foi possivel carregar a auditoria de rodapes desta analise agora.",
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

  const executiveMetrics = buildExecutiveMetrics({
    detectedSheets,
    drawingLists,
    fields,
    issues,
    ldSheetCrosscheck,
    footerAudit,
    memorialAudit,
    packageSummary,
  });

  return (
    <div className="grid gap-5">
      <AnalysisResultHeader
        analysis={analysis}
        attentionCount={attentionCount}
        issueCount={issues.length}
        relevantCount={relevantCount}
      />
      <ExecutiveSummary metrics={executiveMetrics} />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ResultNavigation />

        <div className="grid gap-5">
          <section id="resumo">
            <PackageSummaryPanel
              summary={packageSummary}
              loadError={packageSummaryLoadError}
            />
          </section>
          <section id="mapa">
            <PackageMapPanel map={packageMap} loadError={packageMapLoadError} />
          </section>
          <section id="paginas">
            <PageMapPanel map={pageMap} loadError={pageMapLoadError} />
          </section>
          <section id="leitura">
            <AiReviewPanel review={aiReview} loadError={aiReviewLoadError} />
          </section>
          <section id="ld">
            <LdSheetCrosscheckPanel
              crosscheck={ldSheetCrosscheck}
              loadError={ldSheetCrosscheckLoadError}
            />
          </section>
          <section id="memoriais">
            <MemorialAuditPanel
              audit={memorialAudit}
              loadError={memorialAuditLoadError}
            />
          </section>
          <section id="rodapes">
            <FooterAuditPanel
              audit={footerAudit}
              loadError={footerAuditLoadError}
            />
          </section>
          <section id="detalhes" className="grid gap-5">
            <DrawingListPanel
              drawingLists={drawingLists}
              loadError={drawingListsLoadError}
            />
            <DetectedSheetsPanel
              detectedSheets={detectedSheets}
              loadError={detectedSheetsLoadError}
            />
          </section>
          <section id="evidencias" className="grid gap-5">
            <IssueList
              issues={issues}
              loadError={issuesLoadError}
              status={analysis.status}
            />
            <ExtractedFieldList fields={fields} loadError={fieldsLoadError} />
          </section>
        </div>
      </div>
    </div>
  );
}

function ExecutiveSummary({
  metrics,
}: {
  metrics: ExecutiveMetric[];
}) {
  return (
    <section className="rounded-lg border border-[var(--cp-border)] bg-black/12 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel-soft)] p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
              {metric.label}
            </p>
            <p className={`mt-2 font-mono text-2xl font-semibold ${getMetricTone(metric.tone)}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultNavigation() {
  const links = [
    ["#resumo", "Resumo"],
    ["#mapa", "Mapa"],
    ["#paginas", "Paginas"],
    ["#leitura", "Leitura"],
    ["#ld", "LD x Pranchas"],
    ["#memoriais", "Memoriais"],
    ["#rodapes", "Rodapes"],
    ["#detalhes", "Detalhes"],
    ["#evidencias", "Evidencias"],
  ];

  return (
    <aside className="hidden self-start rounded-lg border border-[var(--cp-border)] bg-black/12 p-3 lg:sticky lg:top-24 lg:block">
      <p className="px-2 pb-3 text-xs uppercase tracking-[0.2em] text-[var(--cp-accent)]">
        Resultado
      </p>
      <nav className="grid gap-1">
        {links.map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-lg px-2 py-2 text-sm text-[var(--cp-muted)] transition-colors hover:bg-white/5 hover:text-[var(--cp-text)]"
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function buildExecutiveMetrics({
  detectedSheets,
  drawingLists,
  fields,
  issues,
  ldSheetCrosscheck,
  footerAudit,
  memorialAudit,
  packageSummary,
}: {
  detectedSheets: DetectedSheets | null;
  drawingLists: DrawingLists | null;
  fields: ExtractedField[];
  issues: AnalysisIssue[];
  ldSheetCrosscheck: LdSheetCrosscheck | null;
  footerAudit: FooterAudit | null;
  memorialAudit: MemorialAudit | null;
  packageSummary: PackageSummary | null;
}): ExecutiveMetric[] {
  const probableIssues =
    (ldSheetCrosscheck?.stats.probable_issue_count ?? 0) +
    (footerAudit?.stats.probable_issue_count ?? 0) +
    (memorialAudit?.stats.probable_issue_count ?? 0) +
    issues.filter((issue) => issue.severity === "relevante").length;
  const reviewPoints =
    (ldSheetCrosscheck?.stats.needs_review_count ?? 0) +
    (footerAudit?.stats.needs_review_count ?? 0) +
    (memorialAudit?.stats.needs_review_count ?? 0) +
    issues.filter((issue) => issue.severity === "atencao").length;

  return [
    {
      label: "Conflitos",
      tone: probableIssues > 0 ? "danger" : "success",
      value: probableIssues.toString().padStart(2, "0"),
    },
    {
      label: "Revisar",
      tone: reviewPoints > 0 ? "warning" : "success",
      value: reviewPoints.toString().padStart(2, "0"),
    },
    {
      label: "Pranchas",
      value: (detectedSheets?.stats.sheet_count ?? 0).toString().padStart(2, "0"),
    },
    {
      label: "Pacote",
      tone: "muted",
      value: `${packageSummary?.stats.document_count ?? 0} pdf / ${drawingLists?.stats.row_count ?? 0} LD / ${fields.length} campos`,
    },
  ];
}

function getMetricTone(tone?: "danger" | "muted" | "success" | "warning") {
  const map = {
    danger: "text-[var(--cp-error)]",
    muted: "text-[var(--cp-muted)]",
    success: "text-[var(--cp-success)]",
    warning: "text-[var(--cp-warning)]",
  };
  return tone ? map[tone] : "text-[var(--cp-text)]";
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
