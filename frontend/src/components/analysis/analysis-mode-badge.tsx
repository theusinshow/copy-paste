import { getAnalysisModeLabel } from "@/lib/analysis/analysis-modes";

export function AnalysisModeBadge({ mode }: { mode: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--cp-border)] bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--cp-muted)]">
      {getAnalysisModeLabel(mode)}
    </span>
  );
}
