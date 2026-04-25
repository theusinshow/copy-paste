import type {
  IssueReviewStatus,
  ReviewDecisionCode,
} from "@/lib/analysis/review-decisions";

export type IssueReview = {
  comment: string;
  decision: ReviewDecisionCode | string;
  decision_label: string;
  issue_id: number;
  status: IssueReviewStatus | string;
  status_label: string;
};

export type IssueEvidence = {
  bbox: Record<string, number> | null;
  field_id: number;
  issue_id: number;
  page: number;
  text: string;
};

export type AnalysisIssue = {
  analysis_run_id: number;
  description: string;
  evidences: IssueEvidence[];
  id: number;
  review: IssueReview | null;
  review_status: IssueReviewStatus | string;
  review_status_label: string;
  severity: string;
  type: string;
};

export type IssueBatchReviewResult = {
  comment: string;
  decision: string;
  decision_label: string;
  issue_ids: number[];
  updated_count: number;
};
