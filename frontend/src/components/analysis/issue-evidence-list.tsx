import type { IssueEvidence } from "@/lib/types/issue";

type IssueEvidenceListProps = {
  evidences: IssueEvidence[];
  onOpenPdf?: (documentId: number | null, page: number) => void;
};

export function IssueEvidenceList({ evidences, onOpenPdf }: IssueEvidenceListProps) {
  return (
    <ul className="grid gap-3">
      {evidences.map((evidence) => (
        <li
          key={`${evidence.issue_id}-${evidence.field_id}-${evidence.page}`}
          className="rounded-2xl border border-[var(--cp-border)] bg-black/15 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--cp-muted)]">
          <span>Página {evidence.page}</span>
              <span className="h-1 w-1 rounded-none bg-[var(--cp-accent)]" />
              <span>Field #{evidence.field_id}</span>
            </div>
            {onOpenPdf ? (
              <button
                onClick={() => onOpenPdf(evidence.document_id, evidence.page)}
                className="rounded border border-[var(--cp-accent)]/30 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--cp-accent)] transition-colors hover:bg-[var(--cp-accent)]/10"
              >
                Ver p.{evidence.page}
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--cp-text)]">
            {evidence.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
