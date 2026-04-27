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
import { IssuesSectionClient } from "@/components/analysis/issues-section-client";
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
  title: "Resultado da análise",
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
  const isMemorialMode = analysis.analysis_mode === "memorial_only";
  const isProjectVolumeMode = analysis.analysis_mode === "full_check";

  return (
    <div className="grid gap-5">
      <AnalysisResultHeader analysis={analysis} />

      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        <ResultNavigation
          isDirectedMode={isDirectedMode}
          isMemorialMode={isMemorialMode}
          isProjectVolumeMode={isProjectVolumeMode}
        />

        <div className="grid gap-5">
          <Suspense fallback={<PanelSkeleton rows={5} />}>
            <SummarySection analysisId={analysisId} />
          </Suspense>

          <Suspense fallback={<PanelSkeleton rows={6} />}>
            <IssuesSection analysisId={analysisId} status={analysis.status} />
          </Suspense>

          {isDirectedMode ? (
            <Suspense fallback={<PanelSkeleton />}>
              <DirectedSection analysisId={analysisId} />
            </Suspense>
          ) : null}

          {isProjectVolumeMode ? (
            <Suspense fallback={<PanelSkeleton rows={5} />}>
              <ProjectVolumeSection analysisId={analysisId} />
            </Suspense>
          ) : null}

          {isMemorialMode ? (
            <Suspense fallback={<PanelSkeleton rows={5} />}>
              <MemorialReviewSection analysisId={analysisId} />
            </Suspense>
          ) : null}

          <Suspense fallback={<PanelSkeleton rows={4} />}>
            <SignoffSection analysisId={analysisId} analysis={analysis} />
          </Suspense>

          <details
            id="detalhes"
            className="rounded-lg border border-[var(--cp-border)] bg-black/12 p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.18em] text-[var(--cp-muted)] transition-colors hover:text-[var(--cp-text)]">
              Detalhes técnicos
            </summary>
            <div className="mt-5 grid gap-5">
              <Suspense fallback={<PanelSkeleton rows={8} />}>
                <DiagnosticSection analysisId={analysisId} />
              </Suspense>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

async function SummarySection({ analysisId }: { analysisId: number }) {
  const auditSummaryResult = await Promise.allSettled([getAuditSummary(analysisId)]);

  const auditSummary = readSettledValue(auditSummaryResult[0], null);
  const auditSummaryLoadError = readSettledError(
    auditSummaryResult[0],
    "Não foi possível carregar o fechamento desta análise agora.",
  );

  return (
    <section id="resumo-final">
      <AuditSummaryPanel
        analysisId={analysisId}
        summary={auditSummary}
        loadError={auditSummaryLoadError}
      />
    </section>
  );
}

async function SignoffSection({
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
  const signoff = readSettledValue(signoffResult, null);
  const signoffLoadError = readSettledError(
    signoffResult,
    "Não foi possível carregar a conclusão final desta análise agora.",
  );

  return (
    <section id="encerramento">
      <AnalysisSignoffPanel
        key={signoff?.updated_at ?? auditSummary?.status.code ?? "new"}
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
    "Não foi possível carregar os pontos encontrados desta análise agora.",
  );

  return (
    <section id="pontos">
      <IssuesSectionClient
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
    "Não foi possível carregar o resultado da busca ou conferência desta análise agora.",
  );

  return (
    <section id="busca">
      <DirectedModePanel output={modeOutput} loadError={modeOutputLoadError} />
    </section>
  );
}

async function ProjectVolumeSection({ analysisId }: { analysisId: number }) {
  const result = await Promise.allSettled([getLdSheetCrosscheck(analysisId)]);

  return (
    <section id="conferencia-volume">
      <LdSheetCrosscheckPanel
        crosscheck={readSettledValue(result[0], null)}
        loadError={readSettledError(
          result[0],
          "Não foi possível carregar a comparação entre lista e pranchas desta análise agora.",
        )}
      />
    </section>
  );
}

async function MemorialReviewSection({ analysisId }: { analysisId: number }) {
  const result = await Promise.allSettled([getMemorialAudit(analysisId)]);

  return (
    <section id="conferencia-memorial">
      <MemorialAuditPanel
        audit={readSettledValue(result[0], null)}
        loadError={readSettledError(
          result[0],
          "Não foi possível carregar a auditoria de memoriais desta análise agora.",
        )}
      />
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
      <section id="tecnico-resumo">
        <PackageSummaryPanel
          summary={readSettledValue(packageSummaryResult, null)}
          loadError={readSettledError(
            packageSummaryResult,
            "Não foi possível carregar o resumo do pacote desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-cruzamento">
        <LdSheetCrosscheckPanel
          crosscheck={readSettledValue(ldSheetCrosscheckResult, null)}
          loadError={readSettledError(
            ldSheetCrosscheckResult,
            "Não foi possível carregar a comparação entre lista e pranchas desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-memoriais">
        <MemorialAuditPanel
          audit={readSettledValue(memorialAuditResult, null)}
          loadError={readSettledError(
            memorialAuditResult,
            "Não foi possível carregar a auditoria de memoriais desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-rodapes">
        <FooterAuditPanel
          audit={readSettledValue(footerAuditResult, null)}
          loadError={readSettledError(
            footerAuditResult,
            "Não foi possível carregar a auditoria de rodapés desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-listas" className="grid gap-5">
        <DrawingListPanel
          drawingLists={readSettledValue(drawingListsResult, null)}
          loadError={readSettledError(
            drawingListsResult,
            "Não foi possível carregar a lista de documentos desta análise agora.",
          )}
        />
        <DetectedSheetsPanel
          detectedSheets={readSettledValue(detectedSheetsResult, null)}
          loadError={readSettledError(
            detectedSheetsResult,
            "Não foi possível carregar as pranchas detectadas desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-organizacao">
        <PackageMapPanel
          map={readSettledValue(packageMapResult, null)}
          loadError={readSettledError(
            packageMapResult,
            "Não foi possível carregar o mapa do pacote desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-paginas">
        <PageMapPanel
          map={readSettledValue(pageMapResult, null)}
          loadError={readSettledError(
            pageMapResult,
            "Não foi possível carregar o mapa de páginas desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-leitura">
        <AiReviewPanel
          review={readSettledValue(aiReviewResult, null)}
          loadError={readSettledError(
            aiReviewResult,
            "Não foi possível carregar o apoio de leitura desta análise agora.",
          )}
        />
      </section>
      <section id="tecnico-evidencias">
        <ExtractedFieldList
          fields={readSettledValue(fieldsResult, [])}
          loadError={readSettledError(
            fieldsResult,
            "Não foi possível carregar os campos extraídos desta análise agora.",
          )}
        />
      </section>
    </>
  );
}

function ResultNavigation({
  isDirectedMode,
  isMemorialMode,
  isProjectVolumeMode,
}: {
  isDirectedMode: boolean;
  isMemorialMode: boolean;
  isProjectVolumeMode: boolean;
}) {
  const links = [
    ["#resumo-final", "Resumo"],
    ["#pontos", "Pontos encontrados"],
  ["#busca", "Busca / conferência"],
    ["#conferencia-volume", "LD x Pranchas"],
    ["#conferencia-memorial", "Memorial"],
    ["#encerramento", "Conclusão"],
    ["#detalhes", "Detalhes técnicos"],
  ];

  return (
    <aside className="hidden self-start rounded-lg border border-[var(--cp-border)] bg-black/12 p-3 lg:sticky lg:top-24 lg:block">
      <p className="px-2 pb-3 text-xs uppercase tracking-[0.2em] text-[var(--cp-accent)]">
        Navegacao
      </p>
      <nav className="grid gap-1">
        {links
          .filter(([href]) => href !== "#busca" || isDirectedMode)
          .filter(([href]) => href !== "#conferencia-volume" || isProjectVolumeMode)
          .filter(([href]) => href !== "#conferencia-memorial" || isMemorialMode)
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
