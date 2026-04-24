import { formatHash } from "@/lib/formatters";
import type { InputDocument } from "@/lib/types/analysis";

export function UploadedDocumentsList({
  documents,
}: {
  documents: InputDocument[];
}) {
  return (
    <div className="mt-4 grid gap-3">
      {documents.map((document) => (
        <article
          key={document.id}
          className="rounded-2xl border border-[var(--cp-border)] bg-black/10 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--cp-text)]">
                {document.original_filename}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--cp-muted)]">
                Tipo: {document.tipo}
              </p>
            </div>
            <p className="font-mono text-xs text-[var(--cp-muted)]">
              {formatHash(document.file_hash)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
