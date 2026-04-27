import {
  createAnalysis,
  getAnalysis,
  uploadAnalysisFiles,
} from "@/lib/api/analysis";
import {
  getAnalysisModeLabel,
  type AnalysisMode,
} from "@/lib/analysis/analysis-modes";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import type { AnalysisRun, InputDocument } from "@/lib/types/analysis";
import type { NewAnalysisActionState } from "@/lib/types/new-analysis-action";

type RunNewAnalysisFlowOptions = {
  analysisMode: AnalysisMode;
  config: Record<string, string>;
  files: File[];
  onStateChange?: (state: NewAnalysisActionState) => void | Promise<void>;
  tipo: string;
};

export async function runNewAnalysisFlow({
  analysisMode,
  config,
  files,
  onStateChange,
  tipo,
}: RunNewAnalysisFlowOptions): Promise<NewAnalysisActionState> {
  let analysis: AnalysisRun | undefined;
  let documents: InputDocument[] = [];
  const modeLabel = getAnalysisModeLabel(analysisMode);

  try {
    analysis = await createAnalysis({
      analysis_mode: analysisMode,
      config,
    });
    documents = await uploadAnalysisFiles(analysis.id, { files, tipo });

    const createdState: NewAnalysisActionState = {
      analysis,
      documents,
      message: `${modeLabel}: analise #${analysis.id} criada e upload concluido. Abrindo acompanhamento do processamento.`,
      status: "created",
      tone: "default",
    };
    await emitState(onStateChange, createdState);
    return createdState;
  } catch (error) {
    const fallbackMessage = extractApiErrorMessage(
      error,
      "Nao foi possivel concluir o processamento da analise agora.",
    );

    if (!analysis) {
      const failureState: NewAnalysisActionState = {
        documents: [],
        message: fallbackMessage,
        status: "failed",
        tone: "error",
      };
      await emitState(onStateChange, failureState);
      return failureState;
    }

    const refreshedAnalysis = await safeGetAnalysis(analysis.id);
    const nextAnalysis = refreshedAnalysis ?? analysis;
    const nextStatus =
      nextAnalysis.status === "completed" || nextAnalysis.status === "failed"
        ? nextAnalysis.status
        : "failed";

    const failureState: NewAnalysisActionState = {
      analysis: { ...nextAnalysis, status: nextStatus },
      documents,
      message:
      nextStatus === "failed"
          ? `${modeLabel}: analise #${analysis.id} falhou durante o start: ${fallbackMessage}`
          : fallbackMessage,
      status: nextStatus,
      tone: "error",
    };
    await emitState(onStateChange, failureState);
    return failureState;
  }
}

async function emitState(
  onStateChange: RunNewAnalysisFlowOptions["onStateChange"],
  state: NewAnalysisActionState,
) {
  await onStateChange?.(state);
}

async function safeGetAnalysis(analysisId: number) {
  try {
    return await getAnalysis(analysisId);
  } catch {
    return null;
  }
}

