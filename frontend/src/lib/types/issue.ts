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
  severity: string;
  type: string;
};
