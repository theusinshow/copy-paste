import { apiFetch } from "@/lib/api/fetcher";
import type { AnalysisIssue, IssueBatchReviewResult } from "@/lib/types/issue";

export async function getIssue(issueId: number) {
  return apiFetch<AnalysisIssue>(`/api/v1/issues/${issueId}`, {
    cache: "no-store",
  });
}

export async function reviewIssue(
  issueId: number,
  payload: {
    comment?: string;
    decision: string;
  },
) {
  return apiFetch<AnalysisIssue>(`/api/v1/issues/${issueId}/review`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function reviewAnalysisIssuesBatch(
  analysisId: number,
  payload: {
    comment?: string;
    decision: string;
    issue_ids: number[];
  },
) {
  return apiFetch<IssueBatchReviewResult>(
    `/api/v1/analysis/${analysisId}/issues/review-batch`,
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}
