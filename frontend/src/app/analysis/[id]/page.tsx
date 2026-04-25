import { Suspense } from "react";
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
import { PanelSkeleton } from "@/components/analysis/panel-skeleton";
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
import type { AnalysisRun } from "@/lib/types/analysis";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado da analise",
};

type AnalysisResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const DIRECTED_MODES = new Set([
  "find_text",
  "find_replace",
  "check_address",
  "check_project_number",
  "check_work_name",
]);

export default async function AnalysisResultPage({
  params,
}: AnalysisResultPageProps) {
  const { id } = await params;
  const analysisId = Number(id);

  if (!Number.isInteger(analysisId) || analysisId <= 0) {
    notFound();
  }

  const analysis = await loadAnalysisOrNotFound(analysisId);
  const isDirectedMode = DIRECTED_MODES.has(analysis.analysis_mode);

  return (
    <div className="grid gap-5">
      <AnalysisResultHeader analysis={analysis} />

      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        <ResultNavigation isDirectedMode={isDirectedMode} />

        <div className="grid gap-5">
          <Suspense fallback={<PanelSkeleton rows={5} />}>
            <ClosureSection analysisId={analysisId} analysis={analysis} />
          </Suspense>

          <Suspense fallback={<PanelSkeleton rows={6} />}>
            <IssuesSection analysisId={analysisId} status={analysis.status} />
          </Suspense>

          {isDirectedMode ? (
            <Suspense fallback={<PanelSkeleton />}>
              <DirectedSection analysisId={analysisId} />
            </Suspense>
          ) : null}

          <div className="border-t border-[var(--cp-border)] pt-2">
            <p className="px-1 text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
              Diagnostico
            </p>
          </div>

          <Suspense fallback={<PanelSkeleton rows={8} />}>
            <DiagnosticSection analysisId={analysisId} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function ClosureSection({
  analysisId,
  analysis,
}: {
  analysisId: number;
  analysis: AnalysisRun;
}) {
  const [auditSummaryResult, signoffResult] = await Promise.allSettled([
    getAuditSummary(analysisId),
    getAnalysisSignoff(analysisId),
  ]);

  const auditSummary = readSettledValue(auditSummaryResult, null);
  const auditSummaryLoadError = readSettledError(
    auditSummaryResult,
    "Nao foi possivel carregar o fechamento desta analise agora.",
  );
  const signoff = readSettledValue(signoffResult, null);
  const signoffLoadError = readSettledError(
    signoffResult,
    "Nao foi possivel carregar a conclusao final desta analise agora.",
  );

  return (
    <>
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
    </>
  );
}

async function IssuesSection({
  analysisId,
  status,
}: {
  analysisId: number;
  status: string;
}) {
  const issuesResult = await Promise.allSettled([listAnalysisIssues(analysisId)]);
  const issues = readSettledValue(issuesResult[0], []);
  const issuesLoadError = readSettledError(
    issuesResult[0],
    "Nao foi possivel carregar as issues desta analise agora.",
  );

  return (
    <section id="pontos">
      <IssueList
        analysisId={analysisId}
        issues={issues}
        loadError={issuesLoadError}
        status={status}
      />
    </section>
  );
}

async function DirectedSection({ analysisId }: { analysisId: number }) {
  const modeOutputResult = await Promise.allSettled([getModeOutput(analysisId)]);
  const modeOutput = readSettledValue(modeOutputResult[0], null);
  const modeOutputLoadError = readSettledError(
    modeOutputResult[0],
    "Nao foi possivel carregar o resultado da busca ou conferencia desta analise agora.",
  );

  return (
    <section id="busca">
      <DirectedModePanel output={modeOutput} loadError={modeOutputLoadError} />
    </section>
  );
}

async function DiagnosticSection({ analysisId }: { analysisId: number }) {
  const [
    packageSummaryResult,
    ldSheetCrosscheckResult,
    memorialAuditResult,
    footerAuditResult,
    drawingListsResult,
    detectedSheetsResult,
    packageMapResult,
    pageMapResult,
    aiReviewResult,
    fieldsResult,
  ] = await Promise.allSettled([
    getPackageSummary(analysisId),
    getLdSheetCrosscheck(analysisId),
    getMemorialAudit(analysisId),
    getFooterAudit(analysisId),
    getDrawingLists(analysisId),
    getDetectedSheets(analysisId),
    getPackageMap(analysisId),
    getPageMap(analysisId),
    getAiReview(analysisId),
    listAnalysisFields(analysisId),
  ]);

  return (
    <>
      <section id="resumo">
        <PackageSummaryPanel
          summary={readSettledValue(packageSummaryResult, null)}
          loadError={readSettledError(
            packageSummaryResult,
            "Nao foi possivel carregar o resumo do pacote desta analise agora.",
          )}
        />
      </section>
      <section id="cruzamento">
        <LdSheetCrosscheckPanel
          crosscheck={readSettledValue(ldSheetCrosscheckResult, null)}
          loadError={readSettledError(
            ldSheetCrosscheckResult,
            "Nao foi possivel carregar a comparacao entre lista e pranchas desta analise agora.",
          )}
        />
      </section>
      <section id="memoriais">
        <MemorialAuditPanel
          audit={readSettledValue(memorialAuditResult, null)}
          loadError={readSettledError(
            memorialAuditResult,
            "Nao foi possivel carregar a auditoria de memoriais desta analise agora.",
          )}
        />
      </section>
      <section id="rodapes">
        <FooterAuditPanel
          audit={readSettledValue(footerAuditResult, null)}
          loadError={readSettledError(
            footerAuditResult,
            "Nao foi possivel carregar a auditoria de rodapes desta analise agora.",
          )}
        />
      </section>
      <section id="listas" className="grid gap-5">
        <DrawingListPanel
          drawingLists={readSettledValue(drawingListsResult, null)}
          loadError={readSettledError(
            drawingListsResult,
            "Nao foi possivel carregar a lista de documentos desta analise agora.",
          )}
        />
        <DetectedSheetsPanel
          detectedSheets={readSettledValue(detectedSheetsResult, null)}
          loadError={readSettledError(
            detectedSheetsResult,
            "Nao foi possivel carregar as pranchas detectadas desta analise agora.",
          )}
        />
      </section>
      <section id="organizacao">
        <PackageMapPanel
          map={readSettledValue(packageMapResult, null)}
          loadError={readSettledError(
            packageMapResult,
            "Nao foi possivel carregar o mapa do pacote desta analise agora.",
          )}
        />
      </section>
      <section id="paginas">
        <PageMapPanel
          map={readSettledValue(pageMapResult, null)}
          loadError={readSettledError(
            pageMapResult,
            "Nao foi possivel carregar o mapa de paginas desta analise agora.",
          )}
        />
      </section>
      <section id="leitura">
        <AiReviewPanel
          review={readSettledValue(aiReviewResult, null)}
          loadError={readSettledError(
            aiReviewResult,
            "Nao foi possivel carregar o apoio de leitura desta analise agora.",
          )}
        />
      </section>
      <section id="evidencias">
        <ExtractedFieldList
          fields={readSettledValue(fieldsResult, [])}
          loadError={readSettledError(
            fieldsResult,
            "Nao foi possivel carregar os campos extraidos desta analise agora.",
          )}
        />
      </section>
    </>
  );
}

function ResultNavigation({ isDirectedMode }: { isDirectedMode: boolean }) {
  const links = [
    ["#fechamento", "Resumo final"],
    ["#encerramento", "Conclusao"],
    ["#pontos", "Pontos encontrados"],
    ["#busca", "Busca / conferencia"],
    ["#resumo", "Visao do pacote"],
    ["#cruzamento", "LD × Pranchas"],
    ["#memoriais", "Memoriais"],
    ["#rodapes", "Rodapes"],
    ["#listas", "Listas e deteccoes"],
    ["#organizacao", "Organizacao"],
    ["#paginas", "Tipos de pagina"],
    ["#leitura", "Apoio de leitura"],
    ["#evidencias", "Evidencias"],
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
              className="rounded-lg px-2 py-1.5 text-sm text-[var(--cp-muted)] transition-colors hover:bg-white/5 hover:text-[var(--cp-text)]"
            >
              {label}
            </a>
          ))}
      </nav>
    </aside>
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
