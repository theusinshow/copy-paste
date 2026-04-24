"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[var(--cp-accent)] px-5 py-3 text-sm font-semibold text-[var(--cp-accent-ink)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Criar analise e enviar PDFs"}
    </button>
  );
}
