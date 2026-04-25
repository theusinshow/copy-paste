"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AnalysisModeConfigPanel } from "@/components/analysis/analysis-mode-config-panel";
import { AnalysisModeSelector } from "@/components/analysis/analysis-mode-selector";
import { AnalysisStartStatus } from "@/components/analysis/analysis-start-status";
import { AnalysisUploadDropzone } from "@/components/analysis/analysis-upload-dropzone";
import { FormSubmitButton } from "@/components/analysis/form-submit-button";
import {
  ANALYSIS_MODE_DEFAULT,
  ANALYSIS_MODES,
  buildAnalysisModeConfig,
  getAnalysisModeDefinition,
  getAnalysisModeDefinitions,
  getInitialConfigValues,
  getLockedTipoForMode,
  type AnalysisMode,
} from "@/lib/analysis/analysis-modes";
import { runNewAnalysisFlow } from "@/lib/analysis/run-new-analysis-flow";
import { initialNewAnalysisActionState } from "@/lib/types/new-analysis-action";

const TIPO_OPTIONS = [
  {
    description: "Quando voce esta enviando um conjunto com tipos mistos de PDF.",
    label: "Pacote misto",
    value: "pacote",
  },
  {
    description: "Quando todos os arquivos enviados forem memoriais.",
    label: "Memorial",
    value: "memorial",
  },
  {
    description: "Quando os arquivos enviados forem pranchas ou plantas.",
    label: "Pranchas",
    value: "prancha",
  },
  {
    description: "Quando o envio trouxer apenas a lista de documentos.",
    label: "Lista de documentos",
    value: "ld",
  },
  {
    description: "Use apenas se nenhuma das opcoes acima servir.",
    label: "Outro",
    value: "outro",
  },
] as const;

type NewAnalysisFormProps = {
  initialConfig?: Record<string, string>;
  initialMode?: string;
};

export function NewAnalysisForm({ initialMode, initialConfig }: NewAnalysisFormProps = {}) {
  const router = useRouter();
  const [state, setState] = useState(initialNewAnalysisActionState);
  const validInitialMode =
    initialMode && ANALYSIS_MODES.includes(initialMode as AnalysisMode)
      ? (initialMode as AnalysisMode)
      : ANALYSIS_MODE_DEFAULT;
  const [selectedMode, setSelectedMode] = useState<AnalysisMode>(validInitialMode);
  const [configValues, setConfigValues] = useState(() => {
    const defaults = getInitialConfigValues(validInitialMode);
    return initialConfig ? { ...defaults, ...initialConfig } : defaults;
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTipoOption, setSelectedTipoOption] = useState("pacote");
  const [customTipo, setCustomTipo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedTipo = getLockedTipoForMode(selectedMode);
  const selectedDefinition = getAnalysisModeDefinition(selectedMode);
  const primaryModes = getAnalysisModeDefinitions([
    "full_check",
    "memorial_only",
    "sheets_only",
    "ld_only",
  ]);
  const textModes = getAnalysisModeDefinitions(["find_text", "find_replace"]);
  const pointCheckModes = getAnalysisModeDefinitions([
    "check_address",
    "check_project_number",
    "check_work_name",
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const tipo =
      lockedTipo ??
      (selectedTipoOption === "outro"
        ? customTipo.trim()
        : selectedTipoOption.trim());
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
        message: "Explique que tipo de arquivo esta sendo enviado.",
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
                Escolha como voce quer revisar os arquivos.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--cp-muted)]">
              Voce escolhe um modo por vez. O card selecionado define a analise
              que sera criada agora.
            </p>
          </div>

          <AnalysisModeSelector
            title="Revisao principal"
            description="Escolha uma opcao para revisar o pacote inteiro ou focar em um tipo especifico de arquivo."
            modes={primaryModes}
            selectedMode={selectedMode}
            onSelect={handleModeSelect}
          />

          <AnalysisModeSelector
            title="Busca textual"
            description="Se voce quer localizar um texto ou revisar uma substituicao, escolha uma das opcoes abaixo."
            modes={textModes}
            selectedMode={selectedMode}
            onSelect={handleModeSelect}
          />

          <AnalysisModeSelector
            title="Verificacao pontual"
            description="Use estas opcoes quando voce ja sabe qual valor quer conferir nos arquivos."
            modes={pointCheckModes}
            selectedMode={selectedMode}
            onSelect={handleModeSelect}
          />

          {selectedDefinition.configFields.length > 0 ? (
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
          ) : (
            <div className="rounded-none border border-[var(--cp-border)] bg-black/10 p-4 text-sm leading-7 text-[var(--cp-muted)]">
              <span className="font-semibold text-[var(--cp-text)]">
                Modo escolhido:
              </span>{" "}
              {selectedDefinition.label}. Esse modo nao precisa de nenhum
              preenchimento extra.
            </div>
          )}
        </section>

        <div className="grid gap-4 rounded-none border border-[var(--cp-border)] bg-black/10 p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cp-accent)]">
              Etapa 3
            </p>
            <h2 className="text-lg font-semibold text-[var(--cp-text)]">
              Como os arquivos devem ser tratados?
            </h2>
            <p className="text-sm leading-6 text-[var(--cp-muted)]">
              Isso ajuda o sistema a entender o que voce esta enviando antes de
              iniciar a leitura dos PDFs.
            </p>
          </div>

          {lockedTipo ? (
            <div className="rounded-xl border border-[var(--cp-accent)]/30 bg-[var(--cp-accent)]/10 p-4">
              <p className="text-sm font-medium text-[var(--cp-text)]">
                Neste modo, os arquivos serao tratados automaticamente como{" "}
                <span className="text-[var(--cp-accent)]">
                  {formatTipoLabel(lockedTipo)}
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {TIPO_OPTIONS.map((option) => {
                const isSelected = selectedTipoOption === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedTipoOption(option.value)}
                    className={`rounded-none border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/12"
                        : "border-[var(--cp-border)] bg-white/4 hover:border-[var(--cp-accent)]/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--cp-text)]">
                      {option.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--cp-muted)]">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {!lockedTipo && selectedTipoOption === "outro" ? (
            <label className="grid gap-2 text-sm text-[var(--cp-muted)]">
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                Descreva o tipo dos arquivos
              </span>
              <input
                value={customTipo}
                onChange={(event) => setCustomTipo(event.target.value)}
                placeholder="Ex.: levantamento, relatorio, conjunto misto"
                className="w-full rounded-lg border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] outline-none transition-colors placeholder:text-[var(--cp-muted)] focus:border-[var(--cp-accent)]"
              />
            </label>
          ) : null}

        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--cp-border)] pt-5">
          <p className="text-xs leading-6 text-[var(--cp-muted)]">
            Os arquivos sao usados para a leitura da analise e nao ficam
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
    pacote: "pacote misto",
    prancha: "pranchas",
  };

  return (labelMap[normalizedValue] ?? value) || "nao definido";
}
