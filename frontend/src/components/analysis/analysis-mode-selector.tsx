"use client";

import {
  ANALYSIS_MODE_GROUPS,
  type AnalysisMode,
} from "@/lib/analysis/analysis-modes";

export function AnalysisModeSelector(props: {
  onSelect: (mode: AnalysisMode) => void;
  selectedMode: AnalysisMode;
}) {
  return (
    <section className="grid gap-5">
      {ANALYSIS_MODE_GROUPS.map((group) => (
        <div
          key={group.title}
          className="rounded-[1.5rem] border border-[var(--cp-border)] bg-black/10 p-5"
        >
          <div className="mb-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--cp-accent)]">
              {group.title}
            </p>
            <p className="text-sm leading-6 text-[var(--cp-muted)]">
              {group.description}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {group.modes.map((mode) => {
              const isSelected = mode.value === props.selectedMode;

              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => props.onSelect(mode.value)}
                  className={`rounded-[1.25rem] border p-4 text-left transition-all ${
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
                      <span className="rounded-full bg-[var(--cp-accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--cp-accent-ink)]">
                        Ativo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
                    {mode.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
