"use server";

import { revalidatePath } from "next/cache";

import { createAnalysis, uploadAnalysisFiles } from "@/lib/api/analysis";
import { extractApiErrorMessage } from "@/lib/api/fetcher";
import type { AnalysisRun } from "@/lib/types/analysis";
import type { NewAnalysisActionState } from "@/lib/types/new-analysis-action";

export async function submitNewAnalysis(
  _previousState: NewAnalysisActionState,
  formData: FormData,
): Promise<NewAnalysisActionState> {
  const tipo = String(formData.get("tipo") ?? "").trim();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!tipo) {
    return {
      documents: [],
      message: "Informe o tipo aplicado aos PDFs desta analise.",
      status: "error",
    };
  }

  if (files.length === 0) {
    return {
      documents: [],
      message: "Selecione ao menos um arquivo PDF.",
      status: "error",
    };
  }

  let analysis: AnalysisRun | undefined;

  try {
    analysis = await createAnalysis();
    const documents = await uploadAnalysisFiles(analysis.id, { files, tipo });

    revalidatePath("/");

    return {
      analysis,
      documents,
      message: `Analise #${analysis.id} criada com ${documents.length} arquivo(s).`,
      status: "success",
    };
  } catch (error) {
    const baseMessage = extractApiErrorMessage(
      error,
      "Nao foi possivel concluir a criacao da analise agora.",
    );

    return {
      analysis,
      documents: [],
      message: analysis
        ? `Analise #${analysis.id} criada, mas o upload falhou: ${baseMessage}`
        : baseMessage,
      status: "error",
    };
  }
}
