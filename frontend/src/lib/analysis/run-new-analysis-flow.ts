import {
  createAnalysis,
  getAnalysis,
  startAnalysis,
  uploadAnalysisFiles,
} from "@/lib/api/analysis";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import type { AnalysisRun, InputDocument } from "@/lib/types/analysis";
import type {
  NewAnalysisActionState,
  NewAnalysisFlowStatus,
} from "@/lib/types/new-analysis-action";

type RunNewAnalysisFlowOptions = {
  files: File[];
  onStateChange?: (state: NewAnalysisActionState) => void | Promise<void>;
  tipo: string;
};

export async function runNewAnalysisFlow({
  files,
  onStateChange,
  tipo,
}: RunNewAnalysisFlowOptions): Promise<NewAnalysisActionState> {
  let analysis: AnalysisRun | undefined;
  let documents: InputDocument[] = [];

  try {
    analysis = await createAnalysis();
    documents = await uploadAnalysisFiles(analysis.id, { files, tipo });

    await emitState(onStateChange, {
      analysis,
      documents,
      message: `Analise #${analysis.id} criada e upload concluido. Iniciando processamento.`,
      status: "created",
      tone: "default",
    });

    await waitForNextTick();

    await emitState(onStateChange, {
      analysis: { ...analysis, status: "processing" },
      documents,
      message: `Analise #${analysis.id} em processamento. Aguarde a conclusao do start sincronico.`,
      status: "processing",
      tone: "default",
    });

    const startedAnalysis = await startAnalysis(analysis.id);
    const finalAnalysis =
      startedAnalysis.status === "created" || startedAnalysis.status === "processing"
        ? await getAnalysis(analysis.id)
        : startedAnalysis;

    const finalState = buildFinalState(finalAnalysis, documents);
    await emitState(onStateChange, finalState);
    return finalState;
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
          ? `Analise #${analysis.id} falhou durante o start: ${fallbackMessage}`
          : fallbackMessage,
      status: nextStatus,
      tone: "error",
    };
    await emitState(onStateChange, failureState);
    return failureState;
  }
}

function buildFinalState(
  analysis: AnalysisRun,
  documents: InputDocument[],
): NewAnalysisActionState {
  if (analysis.status === "completed") {
    return {
      analysis,
      documents,
      message: `Analise #${analysis.id} concluida. O resultado ja esta disponivel para consulta.`,
      status: "completed",
      tone: "default",
    };
  }

  if (analysis.status === "failed") {
    return {
      analysis,
      documents,
      message: `Analise #${analysis.id} falhou durante o processamento.`,
      status: "failed",
      tone: "error",
    };
  }

  return {
    analysis,
    documents,
    message: `Analise #${analysis.id} retornou com status ${analysis.status}.`,
    status: normalizeFlowStatus(analysis.status),
    tone: "default",
  };
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

function waitForNextTick() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function normalizeFlowStatus(status: string): NewAnalysisFlowStatus {
  if (
    status === "created" ||
    status === "processing" ||
    status === "completed" ||
    status === "failed"
  ) {
    return status;
  }

  return "failed";
}
