import Link from "next/link";

export function AnalysisEmptyState() {
  return (
    <div
      className="rounded-none border border-dashed border-[var(--cp-border)] bg-black/10 p-10 text-center"
      style={{ boxShadow: "var(--cp-shadow-soft)" }}
    >
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--cp-accent)]">
        Nenhuma análise ainda
      </p>
      <h3 className="mt-4 text-2xl font-semibold text-[var(--cp-text)]">
        Comece criando a primeira análise.
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--cp-muted)]">
        A base atual do frontend cobre a criação da análise e o upload inicial
        de PDFs. Viewer, processamento e revisão entram na próxima etapa.
      </p>
      <Link
        href="/analysis/new"
        className="mt-6 inline-flex items-center justify-center rounded-none bg-[var(--cp-accent)] px-5 py-3 text-sm font-semibold text-[var(--cp-accent-ink)]"
      >
        Nova análise
      </Link>
    </div>
  );
}
