"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AnalysisModeSelector } from "@/components/analysis/analysis-mode-selector";
import { AnalysisStartStatus } from "@/components/analysis/analysis-start-status";
import { AnalysisUploadDropzone } from "@/components/analysis/analysis-upload-dropzone";
import { FormSubmitButton } from "@/components/analysis/form-submit-button";
import {
  ANALYSIS_MODE_DEFAULT,
  ANALYSIS_MODES,
  buildAnalysisModeConfig,
  getAnalysisModeDefinitions,
  getAnalysisModeDefinition,
  getInitialConfigValues,
  getLockedTipoForMode,
  type AnalysisMode,
} from "@/lib/analysis/analysis-modes";
import { runNewAnalysisFlow } from "@/lib/analysis/run-new-analysis-flow";
import { initialNewAnalysisActionState } from "@/lib/types/new-analysis-action";

const PRIMARY_ANALYSIS_MODES: AnalysisMode[] = ["full_check", "memorial_only"];

type NewAnalysisFormProps = {
  initialConfig?: Record<string, string>;
  initialMode?: string;
};

export function NewAnalysisForm({ initialMode, initialConfig }: NewAnalysisFormProps = {}) {
  const router = useRouter();
  const [state, setState] = useState(initialNewAnalysisActionState);
  const validInitialMode =
    initialMode &&
    ANALYSIS_MODES.includes(initialMode as AnalysisMode) &&
    PRIMARY_ANALYSIS_MODES.includes(initialMode as AnalysisMode)
      ? (initialMode as AnalysisMode)
      : ANALYSIS_MODE_DEFAULT;
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>(validInitialMode);
  const [configValues, setConfigValues] = useState(() => {
    const defaults = getInitialConfigValues(validInitialMode);
    return initialConfig ? { ...defaults, ...initialConfig } : defaults;
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedTipo = getLockedTipoForMode(selectedMode);
  const primaryModes = getAnalysisModeDefinitions(PRIMARY_ANALYSIS_MODES);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const tipo = lockedTipo ?? "pacote";
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
      const nextState = await runNewAnalysisFlow({
        analysisMode: selectedMode,
        config,
        files: selectedFiles,
        onStateChange: (nextState) => {
          setState(nextState);
        },
        tipo,
      });
      if (nextState.analysis && nextState.status === "created") {
        router.push(`/analysis/${nextState.analysis.id}/processing`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleModeSelect(mode: AnalysisMode) {
    setSelectedMode(mode);
    setConfigValues(getInitialConfigValues(mode));
  }

  function handleConfigChange(fieldKey: string, value: string) {
    setConfigValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: value,
    }));
  }

  const selectedModeDefinition = getAnalysisModeDefinition(selectedMode);

  return (
    <section
      className="rounded-none border border-[var(--cp-border)] bg-[var(--cp-panel)]/92 p-4 sm:p-5"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <AnalysisUploadDropzone
          files={selectedFiles}
          onFilesChange={setSelectedFiles}
        />

        <section className="grid gap-4 border-t border-[var(--cp-border)] pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cp-accent)]">
                Etapa 2
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--cp-text)]">
                Escolha o tipo de revisão.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--cp-muted)]">
              O fluxo principal foi reduzido ao que o profissional usa no dia a
              dia: volume de projeto ou memorial.
            </p>
          </div>

          <AnalysisModeSelector
      title="Tipo de análise"
            description="Volume de projeto confere capa, separatrizes, LDs e pranchas. Memorial foca a revisão textual do memorial."
            modes={primaryModes}
            selectedMode={selectedMode}
            onSelect={handleModeSelect}
          />
        </section>

        <section className="grid gap-4 border-t border-[var(--cp-border)] pt-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cp-accent)]">
                Etapa 3
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[var(--cp-text)]">
                Informe os dados oficiais.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--cp-muted)]">
              Preencha apenas o que deve ser usado como referência. O motor
              aceita variações próximas e destaca valores completamente
              diferentes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {selectedModeDefinition.configFields.map((field) => (
              <label key={field.key} className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cp-muted)]">
                  {field.label}
                </span>
                <input
                  value={configValues[field.key] ?? ""}
                  onChange={(event) => handleConfigChange(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-none border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] outline-none transition-colors placeholder:text-[var(--cp-muted)] focus:border-[var(--cp-accent)]"
                />
                <span className="text-sm leading-6 text-[var(--cp-muted)]">
                  {field.description}
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="rounded-none border border-[var(--cp-border)] bg-black/10 p-4 text-sm leading-7 text-[var(--cp-muted)]">
          Os arquivos serao tratados como{" "}
          <span className="font-semibold text-[var(--cp-text)]">
            {formatTipoLabel(lockedTipo ?? "pacote")}
          </span>
          . As verificações avançadas continuam disponíveis no motor técnico,
          mas não aparecem neste fluxo principal.
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cp-border)] pt-5">
          <p className="text-xs leading-6 text-[var(--cp-muted)]">
            Os arquivos são usados para a leitura da análise e não ficam
            guardados permanentemente.
          </p>
          <FormSubmitButton pending={isSubmitting} />
        </div>
      </form>

      <AnalysisStartStatus state={state} />
    </section>
  );
}

function formatTipoLabel(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const labelMap: Record<string, string> = {
    ld: "lista de documentos",
    memorial: "memorial",
    pacote: "volume de projeto",
    prancha: "pranchas",
  };

  return (labelMap[normalizedValue] ?? value) || "não definido";
}
