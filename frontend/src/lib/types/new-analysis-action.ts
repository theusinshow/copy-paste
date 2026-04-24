import type { AnalysisRun, InputDocument } from "@/lib/types/analysis";

export type NewAnalysisFlowStatus =
  | "idle"
  | "created"
  | "processing"
  | "completed"
  | "failed";

export type NewAnalysisActionState = {
  analysis?: AnalysisRun;
  documents: InputDocument[];
  message: string;
  status: NewAnalysisFlowStatus;
  tone: "default" | "error";
};

export const initialNewAnalysisActionState: NewAnalysisActionState = {
  documents: [],
  message: "",
  status: "idle",
  tone: "default",
};
