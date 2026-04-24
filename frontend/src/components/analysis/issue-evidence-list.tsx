import type { IssueEvidence } from "@/lib/types/issue";

export function IssueEvidenceList({ evidences }: { evidences: IssueEvidence[] }) {
  return (
    <ul className="grid gap-3">
      {evidences.map((evidence) => (
        <li
          key={`${evidence.issue_id}-${evidence.field_id}-${evidence.page}`}
          className="rounded-2xl border border-[var(--cp-border)] bg-black/15 p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
            <span>Pagina {evidence.page}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--cp-accent)]" />
            <span>Field #{evidence.field_id}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--cp-text)]">
            {evidence.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
