"use client";

import { useState } from "react";

import { AnalysisModeConfigPanel } from "@/components/analysis/analysis-mode-config-panel";
import { AnalysisModeSelector } from "@/components/analysis/analysis-mode-selector";
import { AnalysisStartStatus } from "@/components/analysis/analysis-start-status";
import { AnalysisUploadDropzone } from "@/components/analysis/analysis-upload-dropzone";
import { FormSubmitButton } from "@/components/analysis/form-submit-button";
import {
  ANALYSIS_MODE_DEFAULT,
  buildAnalysisModeConfig,
  getInitialConfigValues,
  getLockedTipoForMode,
  type AnalysisMode,
} from "@/lib/analysis/analysis-modes";
import { runNewAnalysisFlow } from "@/lib/analysis/run-new-analysis-flow";
import { initialNewAnalysisActionState } from "@/lib/types/new-analysis-action";

export function NewAnalysisForm() {
  const [state, setState] = useState(initialNewAnalysisActionState);
  const [selectedMode, setSelectedMode] =
    useState<AnalysisMode>(ANALYSIS_MODE_DEFAULT);
  const [configValues, setConfigValues] = useState(
    getInitialConfigValues(ANALYSIS_MODE_DEFAULT),
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [manualTipo, setManualTipo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const tipo = getLockedTipoForMode(selectedMode) ?? manualTipo.trim();
    const { config, error: configError } = buildAnalysisModeConfig(
      selectedMode,
      configValues,
    );

    if (configError) {
      setState({
        ...initialNewAnalysisActionState,
        message: configError,
        status: "failed",
        tone: "error",
      });
      return;
    }

    if (!tipo) {
      setState({
        ...initialNewAnalysisActionState,
        message: "Informe o tipo aplicado aos PDFs desta analise.",
        status: "failed",
        tone: "error",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      setState({
        ...initialNewAnalysisActionState,
        message: "Selecione ao menos um arquivo PDF.",
        status: "failed",
        tone: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await runNewAnalysisFlow({
        analysisMode: selectedMode,
        config,
        files: selectedFiles,
        onStateChange: (nextState) => {
          setState(nextState);
        },
        tipo,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/92 p-5 sm:p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <form onSubmit={handleSubmit} className="grid gap-6">
        <AnalysisUploadDropzone
          files={selectedFiles}
          onFilesChange={setSelectedFiles}
        />

        <section className="grid gap-5 border-t border-[var(--cp-border)] pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--cp-accent)]">
                Opcoes de verificacao
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--cp-text)]">
                Escolha como o arquivo deve ser conferido.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--cp-muted)]">
              A verificacao completa segue como padrao.
            </p>
          </div>

          <AnalysisModeSelector
            selectedMode={selectedMode}
            onSelect={(mode) => {
              setSelectedMode(mode);
              setConfigValues(getInitialConfigValues(mode));
            }}
          />

          <AnalysisModeConfigPanel
            selectedMode={selectedMode}
            configValues={configValues}
            onChange={(fieldKey, value) => {
              setConfigValues((currentValues) => ({
                ...currentValues,
                [fieldKey]: value,
              }));
            }}
          />
        </section>

        <div className="grid gap-2">
          <label
            htmlFor="tipo"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cp-muted)]"
          >
            Tipo aplicado aos arquivos
          </label>
          {getLockedTipoForMode(selectedMode) ? (
            <input
              id="tipo"
              value={getLockedTipoForMode(selectedMode) ?? ""}
              readOnly
              className="w-full rounded-lg border border-[var(--cp-border)] bg-white/6 px-4 py-3 text-sm text-[var(--cp-text)] outline-none"
            />
          ) : (
            <input
              id="tipo"
              name="tipo"
              type="text"
              value={manualTipo}
              onChange={(event) => setManualTipo(event.target.value)}
              required
              placeholder="Ex.: planta, memorial, levantamento"
              className="w-full rounded-lg border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] outline-none transition-colors placeholder:text-[var(--cp-muted)] focus:border-[var(--cp-accent)]"
            />
          )}
          <p className="text-sm leading-6 text-[var(--cp-muted)]">
            {getLockedTipoForMode(selectedMode)
              ? "Este modo fixa automaticamente o tipo tecnico enviado ao backend."
              : "O backend atual aplica este tipo a todos os PDFs enviados na mesma submissao."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--cp-border)] pt-5">
          <FormSubmitButton pending={isSubmitting} />
        </div>
      </form>

      <AnalysisStartStatus state={state} />
    </section>
  );
}
