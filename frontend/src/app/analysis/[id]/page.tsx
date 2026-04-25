import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalysisSignoffPanel } from "@/components/analysis/analysis-signoff-panel";
import { AuditSummaryPanel } from "@/components/analysis/audit-summary-panel";
import { AiReviewPanel } from "@/components/analysis/ai-review-panel";
import { AnalysisResultHeader } from "@/components/analysis/analysis-result-header";
import { DetectedSheetsPanel } from "@/components/analysis/detected-sheets-panel";
import { DirectedModePanel } from "@/components/analysis/directed-mode-panel";
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
  getAuditSummary,
  getAiReview,
  getDetectedSheets,
  getDrawingLists,
  getFooterAudit,
  getAnalysisSignoff,
  getLdSheetCrosscheck,
  getMemorialAudit,
  getModeOutput,
  getPackageMap,
  getPageMap,
  getPackageSummary,
  getAnalysis,
  listAnalysisFields,
  listAnalysisIssues,
} from "@/lib/api/analysis";
import { ApiError, extractApiErrorMessage } from "@/lib/api/fetcher";
import type {
  AuditSummary,
  AnalysisSignoff,
  AiReview,
  AnalysisRun,
  DetectedSheets,
  DirectedModeOutput,
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
  let auditSummary: AuditSummary | null = null;
  let auditSummaryLoadError: string | null = null;
  let packageSummary: PackageSummary | null = null;
  let packageSummaryLoadError: string | null = null;
  let signoff: AnalysisSignoff | null = null;
  let signoffLoadError: string | null = null;
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
  let modeOutput: DirectedModeOutput | null = null;
  let modeOutputLoadError: string | null = null;

  const isDirectedMode = [
    "find_text",
    "find_replace",
    "check_address",
    "check_project_number",
    "check_work_name",
  ].includes(analysis.analysis_mode);

  const [
    issuesResult,
    fieldsResult,
    auditSummaryResult,
    packageSummaryResult,
    signoffResult,
    packageMapResult,
    pageMapResult,
    aiReviewResult,
    footerAuditResult,
    drawingListsResult,
    detectedSheetsResult,
    ldSheetCrosscheckResult,
    memorialAuditResult,
    modeOutputResult,
  ] = await Promise.allSettled([
    listAnalysisIssues(analysisId),
    listAnalysisFields(analysisId),
    getAuditSummary(analysisId),
    getPackageSummary(analysisId),
    getAnalysisSignoff(analysisId),
    getPackageMap(analysisId),
    getPageMap(analysisId),
    getAiReview(analysisId),
    getFooterAudit(analysisId),
    getDrawingLists(analysisId),
    getDetectedSheets(analysisId),
    getLdSheetCrosscheck(analysisId),
    getMemorialAudit(analysisId),
    isDirectedMode ? getModeOutput(analysisId) : Promise.resolve(null),
  ]);

  issues = readSettledValue(issuesResult, []);
  issuesLoadError = readSettledError(
    issuesResult,
    "Nao foi possivel carregar as issues desta analise agora.",
  );
  fields = readSettledValue(fieldsResult, []);
  fieldsLoadError = readSettledError(
    fieldsResult,
    "Nao foi possivel carregar os campos extraidos desta analise agora.",
  );
  auditSummary = readSettledValue(auditSummaryResult, null);
  auditSummaryLoadError = readSettledError(
    auditSummaryResult,
    "Nao foi possivel carregar o fechamento desta analise agora.",
  );
  packageSummary = readSettledValue(packageSummaryResult, null);
  packageSummaryLoadError = readSettledError(
    packageSummaryResult,
    "Nao foi possivel carregar o resumo do pacote desta analise agora.",
  );
  signoff = readSettledValue(signoffResult, null);
  signoffLoadError = readSettledError(
    signoffResult,
    "Nao foi possivel carregar a conclusao final desta analise agora.",
  );
  packageMap = readSettledValue(packageMapResult, null);
  packageMapLoadError = readSettledError(
    packageMapResult,
    "Nao foi possivel carregar o mapa do pacote desta analise agora.",
  );
  pageMap = readSettledValue(pageMapResult, null);
  pageMapLoadError = readSettledError(
    pageMapResult,
    "Nao foi possivel carregar o mapa de paginas desta analise agora.",
  );
  aiReview = readSettledValue(aiReviewResult, null);
  aiReviewLoadError = readSettledError(
    aiReviewResult,
    "Nao foi possivel carregar o apoio de leitura desta analise agora.",
  );
  footerAudit = readSettledValue(footerAuditResult, null);
  footerAuditLoadError = readSettledError(
    footerAuditResult,
    "Nao foi possivel carregar a auditoria de rodapes desta analise agora.",
  );
  drawingLists = readSettledValue(drawingListsResult, null);
  drawingListsLoadError = readSettledError(
    drawingListsResult,
    "Nao foi possivel carregar a lista de documentos desta analise agora.",
  );
  detectedSheets = readSettledValue(detectedSheetsResult, null);
  detectedSheetsLoadError = readSettledError(
    detectedSheetsResult,
    "Nao foi possivel carregar as pranchas detectadas desta analise agora.",
  );
  ldSheetCrosscheck = readSettledValue(ldSheetCrosscheckResult, null);
  ldSheetCrosscheckLoadError = readSettledError(
    ldSheetCrosscheckResult,
    "Nao foi possivel carregar a comparacao entre lista e pranchas desta analise agora.",
  );
  memorialAudit = readSettledValue(memorialAuditResult, null);
  memorialAuditLoadError = readSettledError(
    memorialAuditResult,
    "Nao foi possivel carregar a auditoria de memoriais desta analise agora.",
  );
  modeOutput = readSettledValue(modeOutputResult, null);
  modeOutputLoadError = readSettledError(
    modeOutputResult,
    "Nao foi possivel carregar o resultado da busca ou conferencia desta analise agora.",
  );

  const relevantCount =
    auditSummary?.metrics.relevant_count ??
    issues.filter((issue) => issue.severity === "relevante").length;
  const attentionCount =
    auditSummary?.metrics.attention_count ??
    issues.filter((issue) => issue.severity === "atencao").length;

  const executiveMetrics = buildExecutiveMetrics({
    auditSummary,
    detectedSheets,
    drawingLists,
    fields,
    packageSummary,
  });

  return (
    <div className="grid gap-5">
      <AnalysisResultHeader
        analysis={analysis}
        attentionCount={attentionCount}
        auditSummary={auditSummary}
        issueCount={issues.length}
        relevantCount={relevantCount}
      />
      <ExecutiveSummary metrics={executiveMetrics} />

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <ResultNavigation isDirectedMode={isDirectedMode} />

        <div className="grid gap-5">
          <section id="fechamento">
            <AuditSummaryPanel
              analysisId={analysisId}
              summary={auditSummary}
              loadError={auditSummaryLoadError}
            />
          </section>
          <section id="encerramento">
            <AnalysisSignoffPanel
              analysisId={analysisId}
              analysisStatus={analysis.status}
              computedStatusCode={auditSummary?.status.code}
              computedStatusLabel={auditSummary?.status.label}
              signoff={signoff}
            />
            {signoffLoadError ? (
              <div className="mt-3 rounded-lg border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
                {signoffLoadError}
              </div>
            ) : null}
          </section>
          <section id="pontos">
            <IssueList
              analysisId={analysisId}
              issues={issues}
              loadError={issuesLoadError}
              status={analysis.status}
            />
          </section>
          {isDirectedMode ? (
            <section id="busca">
              <DirectedModePanel
                output={modeOutput}
                loadError={modeOutputLoadError}
              />
            </section>
          ) : null}
          <section id="resumo">
            <PackageSummaryPanel
              summary={packageSummary}
              loadError={packageSummaryLoadError}
            />
          </section>
          <section id="lista-pranchas">
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
          <section id="listas-pranchas" className="grid gap-5">
            <DrawingListPanel
              drawingLists={drawingLists}
              loadError={drawingListsLoadError}
            />
            <DetectedSheetsPanel
              detectedSheets={detectedSheets}
              loadError={detectedSheetsLoadError}
            />
          </section>
          <section id="organizacao">
            <PackageMapPanel map={packageMap} loadError={packageMapLoadError} />
          </section>
          <section id="paginas">
            <PageMapPanel map={pageMap} loadError={pageMapLoadError} />
          </section>
          <section id="leitura">
            <AiReviewPanel review={aiReview} loadError={aiReviewLoadError} />
          </section>
          <section id="evidencias">
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

function ResultNavigation({ isDirectedMode }: { isDirectedMode: boolean }) {
  const links = [
    ["#fechamento", "Resumo final"],
    ["#encerramento", "Conclusao final"],
    ["#pontos", "Pontos encontrados"],
    ["#busca", "Busca ou conferencia"],
    ["#resumo", "Visao do pacote"],
    ["#lista-pranchas", "Lista e pranchas"],
    ["#memoriais", "Memoriais"],
    ["#rodapes", "Rodapes"],
    ["#listas-pranchas", "Listas e pranchas"],
    ["#organizacao", "Organizacao dos arquivos"],
    ["#paginas", "Tipos de pagina"],
    ["#leitura", "Apoio de leitura"],
    ["#evidencias", "Trechos separados"],
  ];

  return (
    <aside className="hidden self-start rounded-lg border border-[var(--cp-border)] bg-black/12 p-3 lg:sticky lg:top-24 lg:block">
      <p className="px-2 pb-3 text-xs uppercase tracking-[0.2em] text-[var(--cp-accent)]">
        Navegacao
      </p>
      <nav className="grid gap-1">
        {links
          .filter(([href]) => href !== "#busca" || isDirectedMode)
          .map(([href, label]) => (
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
  auditSummary,
  detectedSheets,
  drawingLists,
  fields,
  packageSummary,
}: {
  auditSummary: AuditSummary | null;
  detectedSheets: DetectedSheets | null;
  drawingLists: DrawingLists | null;
  fields: ExtractedField[];
  packageSummary: PackageSummary | null;
}): ExecutiveMetric[] {
  return [
    {
      label: "Conflitos",
      tone:
        (auditSummary?.metrics.relevant_count ?? 0) > 0 ? "danger" : "success",
      value: (auditSummary?.metrics.relevant_count ?? 0)
        .toString()
        .padStart(2, "0"),
    },
    {
      label: "A revisar",
      tone:
        (auditSummary?.metrics.attention_count ?? 0) +
          (auditSummary?.metrics.pending_review_count ?? 0) >
        0
          ? "warning"
          : "success",
      value: (
        (auditSummary?.metrics.attention_count ?? 0) +
        (auditSummary?.metrics.pending_review_count ?? 0)
      )
        .toString()
        .padStart(2, "0"),
    },
    {
      label: "Pranchas",
      value: (detectedSheets?.stats.sheet_count ?? 0).toString().padStart(2, "0"),
    },
    {
      label: "Arquivos e dados",
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

function readSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

function readSettledError<T>(
  result: PromiseSettledResult<T>,
  fallback: string,
) {
  if (result.status === "fulfilled") {
    return null;
  }

  return extractApiErrorMessage(result.reason, fallback);
}
