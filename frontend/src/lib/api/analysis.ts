import { apiFetch } from "@/lib/api/fetcher";
import { buildApiUrl } from "@/lib/api/config";
import type { AnalysisMode } from "@/lib/analysis/analysis-modes";
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
  InputDocument,
  LdSheetCrosscheck,
  MemorialAudit,
  PackageMap,
  PageMap,
  PackageSummary,
} from "@/lib/types/analysis";
import type { AnalysisIssue } from "@/lib/types/issue";

export async function listAnalyses(params?: {
  limit?: number;
  mode?: string;
  offset?: number;
  status?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.mode) qs.set("mode", params.mode);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiFetch<AnalysisRun[]>(`/api/v1/analysis${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
}

export async function getAnalysis(analysisId: number) {
  return apiFetch<AnalysisRun>(`/api/v1/analysis/${analysisId}`, {
    cache: "no-store",
  });
}

export async function listAnalysisIssues(analysisId: number) {
  return apiFetch<AnalysisIssue[]>(`/api/v1/analysis/${analysisId}/issues`, {
    cache: "no-store",
  });
}

export async function listAnalysisFields(analysisId: number) {
  return apiFetch<ExtractedField[]>(`/api/v1/analysis/${analysisId}/fields`, {
    cache: "no-store",
  });
}

export async function getAuditSummary(analysisId: number) {
  return apiFetch<AuditSummary>(`/api/v1/analysis/${analysisId}/audit-summary`, {
    cache: "no-store",
  });
}

export async function getAnalysisSignoff(analysisId: number) {
  return apiFetch<AnalysisSignoff | null>(`/api/v1/analysis/${analysisId}/signoff`, {
    cache: "no-store",
  });
}

export async function upsertAnalysisSignoff(
  analysisId: number,
  payload: {
    comment?: string;
    final_status_code: string;
    reviewer_name: string;
  },
) {
  return apiFetch<AnalysisSignoff>(`/api/v1/analysis/${analysisId}/signoff`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function getPackageSummary(analysisId: number) {
  return apiFetch<PackageSummary>(
    `/api/v1/analysis/${analysisId}/package-summary`,
    {
      cache: "no-store",
    },
  );
}

export async function getPackageMap(analysisId: number) {
  return apiFetch<PackageMap>(`/api/v1/analysis/${analysisId}/package-map`, {
    cache: "no-store",
  });
}

export async function getFooterAudit(analysisId: number) {
  return apiFetch<FooterAudit>(`/api/v1/analysis/${analysisId}/footer-audit`, {
    cache: "no-store",
  });
}

export async function getAiReview(analysisId: number) {
  return apiFetch<AiReview>(`/api/v1/analysis/${analysisId}/ai-review`, {
    cache: "no-store",
  });
}

export async function getPageMap(analysisId: number) {
  return apiFetch<PageMap>(`/api/v1/analysis/${analysisId}/page-map`, {
    cache: "no-store",
  });
}

export async function getDrawingLists(analysisId: number) {
  return apiFetch<DrawingLists>(`/api/v1/analysis/${analysisId}/drawing-lists`, {
    cache: "no-store",
  });
}

export async function getDetectedSheets(analysisId: number) {
  return apiFetch<DetectedSheets>(
    `/api/v1/analysis/${analysisId}/detected-sheets`,
    {
      cache: "no-store",
    },
  );
}

export async function getLdSheetCrosscheck(analysisId: number) {
  return apiFetch<LdSheetCrosscheck>(
    `/api/v1/analysis/${analysisId}/ld-sheet-crosscheck`,
    {
      cache: "no-store",
    },
  );
}

export async function getMemorialAudit(analysisId: number) {
  return apiFetch<MemorialAudit>(
    `/api/v1/analysis/${analysisId}/memorial-audit`,
    {
      cache: "no-store",
    },
  );
}

export async function getModeOutput(analysisId: number) {
  return apiFetch<DirectedModeOutput | null>(
    `/api/v1/analysis/${analysisId}/mode-output`,
    {
      cache: "no-store",
    },
  );
}

export async function createAnalysis(payload?: {
  analysis_mode?: AnalysisMode;
  config?: Record<string, string>;
}) {
  return apiFetch<AnalysisRun>("/api/v1/analysis", {
    body: payload ? JSON.stringify(payload) : undefined,
    method: "POST",
  });
}

export async function startAnalysis(analysisId: number) {
  return apiFetch<AnalysisRun>(`/api/v1/analysis/${analysisId}/start`, {
    method: "POST",
  });
}

export async function cancelAnalysis(analysisId: number) {
  return apiFetch<AnalysisRun>(`/api/v1/analysis/${analysisId}/cancel`, {
    method: "POST",
  });
}

export async function uploadAnalysisFiles(
  analysisId: number,
  payload: {
    files: File[];
    tipo: string;
  },
) {
  const formData = new FormData();
  formData.set("tipo", payload.tipo);

  for (const file of payload.files) {
    formData.append("files", file, file.name);
  }

  return apiFetch<InputDocument[]>(`/api/v1/analysis/${analysisId}/files`, {
    body: formData,
    method: "POST",
  });
}

export type AnalysisDocument = {
  id: number;
  filename: string;
  tipo: string;
};

export async function listAnalysisDocuments(analysisId: number) {
  return apiFetch<AnalysisDocument[]>(`/api/v1/analysis/${analysisId}/documents`, {
    cache: "no-store",
  });
}

export function getDocumentFileUrl(analysisId: number, documentId: number) {
  return buildApiUrl(`/api/v1/analysis/${analysisId}/documents/${documentId}/file`);
}
