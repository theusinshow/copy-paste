"use client";

import type {
  AnalysisMode,
  AnalysisModeDefinition,
} from "@/lib/analysis/analysis-modes";

export function AnalysisModeSelector(props: {
  description: string;
  modes: AnalysisModeDefinition[];
  onSelect: (mode: AnalysisMode) => void;
  selectedMode: AnalysisMode;
  title: string;
}) {
  return (
    <section className="grid gap-3 rounded-none border border-[var(--cp-border)] bg-black/10 p-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
          {props.title}
        </p>
        <p className="text-sm leading-6 text-[var(--cp-muted)]">
          {props.description}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {props.modes.map((mode) => {
          const isSelected = mode.value === props.selectedMode;

          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => props.onSelect(mode.value)}
              className={`rounded-none border p-4 text-left transition-all ${
                isSelected
                  ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/12 shadow-[0_0_0_1px_var(--cp-accent-glow)]"
                  : "border-[var(--cp-border)] bg-white/4 hover:border-[var(--cp-accent)]/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[var(--cp-text)]">
                    {mode.label}
                  </p>
                  <p className="text-sm leading-6 text-[var(--cp-muted)]">
                    {mode.description}
                  </p>
                </div>
                {isSelected ? (
                  <span className="rounded-none bg-[var(--cp-accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cp-accent-ink)]">
                    Selecionado
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--cp-muted)]">
                {mode.helper}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
