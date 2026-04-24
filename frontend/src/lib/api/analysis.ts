import { apiFetch } from "@/lib/api/fetcher";
import type { AnalysisRun, InputDocument } from "@/lib/types/analysis";
import type { AnalysisIssue } from "@/lib/types/issue";

export async function listAnalyses() {
  return apiFetch<AnalysisRun[]>("/api/v1/analysis", {
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

export async function createAnalysis() {
  return apiFetch<AnalysisRun>("/api/v1/analysis", {
    method: "POST",
  });
}

export async function startAnalysis(analysisId: number) {
  return apiFetch<AnalysisRun>(`/api/v1/analysis/${analysisId}/start`, {
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
