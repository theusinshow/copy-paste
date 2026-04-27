import type { AnalysisMode } from "@/lib/analysis/analysis-modes";

export type AnalysisRun = {
  analysis_mode: AnalysisMode;
  config: Record<string, unknown>;
  created_at: string;
  id: number;
  status: string;
};

export type InputDocument = {
  analysis_run_id: number;
  file_hash: string;
  file_path: string;
  id: number;
  original_filename: string;
  tipo: string;
};

export type ExtractedField = {
  bbox: Record<string, number> | null;
  document_filename: string;
  document_page_id: number | null;
  document_tipo: string;
  field_name: string;
  id: number;
  input_document_id: number | null;
  normalized_value: string;
  page: number | null;
  raw_value: string;
};

export type PackageSummary = {
  alerts: PackageSummaryAlert[];
  documents: PackageSummaryDocument[];
  identity: {
    bairro: string | null;
    client: string | null;
    date: string | null;
    disciplines: string[];
    project_code: string | null;
    volumes: string[];
    work_name: string | null;
  };
  stats: {
    document_count: number;
    ld_count: number;
    page_count: number;
    volume_count: number;
  };
};

export type PackageSummaryAlert = {
  message: string;
  severity: string;
};

export type PackageSummaryDocument = {
  classification: string;
  detected_project_codes: string[];
  discipline: string | null;
  document_id: number;
  filename: string;
  ld_pages: number[];
  page_count: number;
  tipo: string;
  tomo: string | null;
  volume: string | null;
};

export type AuditSummary = {
  highlights: AuditSummaryHighlight[];
  metrics: AuditSummaryMetrics;
  sources: AuditSummarySource[];
  status: AuditSummaryStatus;
};

export type AnalysisSignoff = {
  analysis_run_id: number;
  comment: string;
  created_at: string;
  final_status_code: string;
  final_status_label: string;
  reviewer_name: string;
  updated_at: string;
};

export type AuditSummaryStatus = {
  code: string;
  label: string;
  summary: string;
  tone: string;
};

export type AuditSummaryHighlight = {
  message: string;
  tone: string;
};

export type AuditSummaryMetrics = {
  active_issue_count: number;
  attention_count: number;
  dismissed_issue_count: number;
  document_count: number;
  incomplete_count: number;
  inconclusive_issue_count: number;
  issue_count: number;
  ld_row_count: number;
  page_count: number;
  pending_review_count: number;
  relevant_count: number;
  resolved_issue_count: number;
  reviewed_issue_count: number;
  sheet_count: number;
  undeclared_sheet_count: number;
};

export type AuditSummarySource = {
  active_count: number;
  attention_count: number;
  dismissed_count: number;
  incomplete_count: number;
  inconclusive_count: number;
  item_count: number;
  label: string;
  pending_review_count: number;
  relevant_count: number;
  resolved_count: number;
  reviewed_count: number;
  source: string;
  summary: string;
  undeclared_sheet_count: number;
};

export type DirectedModeOutput = {
  entries: DirectedModeEntry[];
  expected: string | null;
  field_label: string | null;
  mode: string;
  query: string | null;
  replace: string | null;
  stats: DirectedModeStats;
  summary: string;
  title: string;
};

export type DirectedModeStats = {
  divergent_count: number;
  document_count: number;
  matching_count: number;
  occurrence_count: number;
  page_count: number;
};

export type DirectedModeEntry = {
  bbox: Record<string, number> | null;
  context: string;
  document_id: number | null;
  expected_value: string | null;
  field_name: string | null;
  filename: string;
  kind: string;
  page: number | null;
  replacement_preview: string | null;
  severity: string;
  value: string;
};

export type PackageMap = {
  documents: PackageMapDocument[];
  identity: PackageSummary["identity"];
  stats: {
    document_count: number;
    ld_section_count: number;
    section_count: number;
    sheet_count: number;
  };
};

export type PackageMapDocument = {
  classification: string;
  discipline: string | null;
  document_id: number;
  filename: string;
  page_count: number;
  sections: PackageMapSection[];
  tipo: string;
  tomo: string | null;
  volume: string | null;
};

export type PackageMapSection = {
  document_id: number;
  document_filename: string;
  end_page: number;
  ld_codes: string[];
  ld_page: number | null;
  ld_row_count: number;
  scope_id: number;
  section_label: string;
  section_type: string;
  sheet_codes: string[];
  sheet_count: number;
  start_page: number;
  title: string;
};

export type AiReview = {
  ai_model: string | null;
  ai_narrative: string | null;
  contexts: AiReviewContext[];
  identity: PackageSummary["identity"];
  mode: string;
  provider_status: string;
  summary: string;
  suggestions: AiReviewSuggestion[];
  stats: {
    context_count: number;
    needs_review_count: number;
    probable_issue_count: number;
    suggestion_count: number;
  };
};

export type AiReviewContext = {
  document_id: number;
  evidence_text: string;
  filename: string;
  kind: string;
  page_end: number;
  page_start: number;
  section_label: string;
  title: string;
};

export type AiReviewSuggestion = {
  category: string;
  message: string;
  reason: string;
  severity: string;
  source: string;
};

export type PageMap = {
  documents: PageMapDocument[];
  stats: {
    document_count: number;
    low_confidence_count: number;
    page_count: number;
    page_type_counts: Record<string, number>;
  };
};

export type PageMapDocument = {
  document_id: number;
  filename: string;
  page_count: number;
  pages: PageMapPage[];
  tipo: string;
};

export type PageMapPage = {
  confidence: string;
  discipline_code: string | null;
  discipline_label: string | null;
  discipline_type: string | null;
  document_id: number;
  evidence_text: string;
  filename: string;
  page: number;
  page_type: string;
  page_type_label: string;
  scope_id: number | null;
  signals: string[];
};

export type FooterAudit = {
  findings: FooterAuditFinding[];
  identity: {
    project_code: string | null;
    work_name: string | null;
  };
  occurrences: FooterAuditOccurrence[];
  stats: {
    document_count: number;
    footer_page_count: number;
    needs_review_count: number;
    occurrence_count: number;
    probable_issue_count: number;
  };
};

export type FooterAuditOccurrence = {
  document_id: number;
  field: string;
  field_label: string;
  filename: string;
  normalized_value: string;
  page: number;
  source_text: string;
  value: string;
};

export type FooterAuditFinding = {
  category: string;
  field: string;
  message: string;
  occurrences: FooterAuditOccurrence[];
  reason: string;
  severity: string;
};

export type DrawingLists = {
  alerts: DrawingListAlert[];
  lists: DrawingListDocument[];
  stats: {
    alert_count: number;
    document_count: number;
    row_count: number;
  };
};

export type DrawingListDocument = {
  document_id: number;
  filename: string;
  project_codes: string[];
  row_count: number;
  rows: DrawingListRow[];
  tipo: string;
};

export type DrawingListRow = {
  description: string;
  document_code: string;
  item: string;
  page: number;
  source_text: string;
};

export type DrawingListAlert = {
  description: string;
  document_code: string;
  filename: string;
  item: string;
  message: string;
  page: number;
  severity: string;
  source_text: string;
  type: string;
};

export type DetectedSheets = {
  documents: DetectedSheetDocument[];
  stats: {
    document_count: number;
    sheet_count: number;
  };
};

export type DetectedSheetDocument = {
  document_id: number;
  filename: string;
  sheet_count: number;
  sheets: DetectedSheet[];
  tipo: string;
};

export type DetectedSheet = {
  description: string | null;
  item: string | null;
  page: number;
  sheet_code: string;
  source_text: string;
};

export type LdSheetCrosscheck = {
  reverse_results: DetectedSheetCrosscheckResult[];
  results: LdSheetCrosscheckResult[];
  stats: {
    attention_count: number;
    compatible_count: number;
    combined_extraction_limit_count: number;
    combined_needs_review_count: number;
    combined_probable_issue_count: number;
    extraction_limit_count: number;
    needs_review_count: number;
    ok_count: number;
    probable_issue_count: number;
    relevant_count: number;
    reverse_extraction_limit_count: number;
    reverse_needs_review_count: number;
    reverse_other_document_count: number;
    reverse_other_section_count: number;
    reverse_probable_issue_count: number;
    reverse_total_count: number;
    total_count: number;
    undeclared_sheet_count: number;
  };
};

export type LdSheetCrosscheckResult = {
  category: string;
  ld_description: string;
  ld_document_code: string;
  ld_filename: string;
  ld_item: string;
  ld_page: number;
  ld_scope_id: number | null;
  ld_source_text: string;
  matched_sheet: LdSheetMatchedSheet | null;
  message: string;
  reason: string;
  severity: string;
  type: string;
};

export type LdSheetMatchedSheet = {
  description: string | null;
  filename: string;
  item: string | null;
  page: number;
  scope_id: number | null;
  sheet_code: string;
  source_text: string;
};

export type LdMatchedRow = {
  description: string;
  document_code: string;
  filename: string;
  item: string;
  page: number;
  scope_id: number | null;
  source_text: string;
};

export type DetectedSheetCrosscheckResult = {
  category: string;
  matched_ld_row: LdMatchedRow | null;
  message: string;
  reason: string;
  severity: string;
  sheet_code: string;
  sheet_description: string | null;
  sheet_filename: string;
  sheet_item: string | null;
  sheet_page: number;
  sheet_scope_id: number | null;
  sheet_source_text: string;
  type: string;
};

export type MemorialAudit = {
  findings: MemorialAuditFinding[];
  identity: {
    bairro: string | null;
    municipality: string | null;
    project_code: string | null;
    work_name: string | null;
  };
  occurrences: MemorialAuditOccurrence[];
  stats: {
    document_count: number;
    extraction_limit_count: number;
    needs_review_count: number;
    occurrence_count: number;
    probable_issue_count: number;
  };
};

export type MemorialAuditOccurrence = {
  document_id: number;
  field: string;
  field_label: string;
  filename: string;
  normalized_value: string;
  page: number;
  source_text: string;
  value: string;
};

export type MemorialAuditFinding = {
  category: string;
  field: string;
  message: string;
  occurrences: MemorialAuditOccurrence[];
  reason: string;
  severity: string;
};
