import { IssueCard } from "@/components/analysis/issue-card";
import type { AnalysisIssue } from "@/lib/types/issue";

type IssueListProps = {
  issues: AnalysisIssue[];
  loadError?: string | null;
  status: string;
};

export function IssueList({ issues, loadError, status }: IssueListProps) {
  return (
    <section
      className="rounded-[2rem] border border-[var(--cp-border)] bg-[var(--cp-panel)]/85 p-6"
      style={{ boxShadow: "var(--cp-shadow)" }}
    >
      <div className="border-b border-[var(--cp-border)] pb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
          Resultado
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--cp-text)]">
          Issues geradas pelo rules engine.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
          A listagem mostra apenas a estrutura textual e a evidencia associada.
          Viewer PDF e highlight visual continuam fora de escopo nesta etapa.
        </p>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-2xl border border-[var(--cp-error)]/40 bg-[var(--cp-error)]/10 p-4 text-sm text-[var(--cp-text)]">
          {loadError}
        </div>
      ) : null}

      {!loadError && issues.length === 0 ? (
        <div className="mt-6 rounded-[1.75rem] border border-[var(--cp-border)] bg-black/15 p-6">
          <p className="text-sm font-medium text-[var(--cp-text)]">
            {status === "completed"
              ? "Nenhuma issue foi gerada para esta analise."
              : "As issues aparecerao aqui quando a analise concluir o processamento."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--cp-muted)]">
            Enquanto isso, a visualizacao continua focada no status tecnico e
            nas evidencias textuais quando elas existirem.
          </p>
        </div>
      ) : null}

      {issues.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
