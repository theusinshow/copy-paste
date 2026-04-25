export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-5">
      <div className="h-2.5 w-20 rounded-sm bg-[var(--cp-border)]" />
      <div className="mt-3 h-5 w-2/5 rounded-sm bg-[var(--cp-border)]" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded-sm bg-[var(--cp-border)]"
            style={{ width: `${55 + (i % 3) * 14}%`, opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}
