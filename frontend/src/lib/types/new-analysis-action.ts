import type { AnalysisRun, InputDocument } from "@/lib/types/analysis";

export type NewAnalysisActionState = {
  analysis?: AnalysisRun;
  documents: InputDocument[];
  message: string;
  status: "idle" | "success" | "error";
};

export const initialNewAnalysisActionState: NewAnalysisActionState = {
  documents: [],
  message: "",
  status: "idle",
};
