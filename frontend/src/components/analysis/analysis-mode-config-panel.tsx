"use client";

import {
  getAnalysisModeDefinition,
  type AnalysisMode,
  type AnalysisModeConfigValues,
} from "@/lib/analysis/analysis-modes";

export function AnalysisModeConfigPanel(props: {
  configValues: AnalysisModeConfigValues;
  onChange: (fieldKey: string, value: string) => void;
  selectedMode: AnalysisMode;
}) {
  const definition = getAnalysisModeDefinition(props.selectedMode);

  return (
    <section className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
          Configuracao do modo
        </p>
        <h2 className="text-xl font-semibold text-[var(--cp-text)]">
          {definition.label}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
          {definition.helper}
        </p>
      </div>

      {definition.configFields.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--cp-border)] bg-white/3 p-4 text-sm leading-6 text-[var(--cp-muted)]">
          Este modo nao exige configuracao adicional. O contrato sera enviado
          com config vazio e `analysis_mode = {definition.value}`.
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {definition.configFields.map((field) => (
            <label key={field.key} className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--cp-muted)]">
                {field.label}
              </span>
              <input
                value={props.configValues[field.key] ?? ""}
                onChange={(event) => props.onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-[var(--cp-border)] bg-black/20 px-4 py-3 text-sm text-[var(--cp-text)] outline-none transition-colors placeholder:text-[var(--cp-muted)] focus:border-[var(--cp-accent)]"
              />
              <span className="text-sm leading-6 text-[var(--cp-muted)]">
                {field.description}
              </span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
