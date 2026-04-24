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
