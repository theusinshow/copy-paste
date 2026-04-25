"use client";

export function FormSubmitButton({
  pending,
}: {
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-[var(--cp-accent)] px-5 py-3 text-sm font-semibold text-[var(--cp-accent-ink)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending
        ? "Enviando arquivos e iniciando a analise..."
        : "Criar analise e comecar a revisao"}
    </button>
  );
}
