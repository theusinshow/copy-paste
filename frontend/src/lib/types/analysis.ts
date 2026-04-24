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

export type DrawingLists = {
  lists: DrawingListDocument[];
  stats: {
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
