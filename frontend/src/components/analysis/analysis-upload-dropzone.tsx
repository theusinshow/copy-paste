"use client";

import { useRef, useState } from "react";

type AnalysisUploadDropzoneProps = {
  files: File[];
  onFilesChange: (files: File[]) => void;
};

export function AnalysisUploadDropzone({
  files,
  onFilesChange,
}: AnalysisUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section className="grid gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onFilesChange(mergeFiles(files, Array.from(event.dataTransfer.files)));
        }}
        className={`rounded-none border border-dashed p-5 transition-colors sm:p-6 ${
          isDragging
            ? "border-[var(--cp-accent)] bg-[var(--cp-accent)]/10"
            : "border-[var(--cp-border)] bg-black/10 hover:border-[var(--cp-accent)]/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={(event) => {
            onFilesChange(mergeFiles(files, Array.from(event.target.files ?? [])));
            event.currentTarget.value = "";
          }}
          className="hidden"
        />

        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cp-accent)]">
            Etapa 1
          </p>
          <h3 className="text-xl font-semibold text-[var(--cp-text)] sm:text-2xl">
            Arraste os PDFs aqui ou clique para selecionar.
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-[var(--cp-muted)]">
        Envie um ou mais arquivos para iniciar a revisão. Você pode montar
            um pacote completo ou mandar apenas o material que quer conferir.
          </p>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="grid gap-3">
          {files.map((file) => (
            <article
              key={buildFileKey(file)}
            className="rounded-lg border border-[var(--cp-border)] bg-black/10 p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--cp-text)]">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--cp-muted)]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onFilesChange(files.filter((item) => buildFileKey(item) !== buildFileKey(file)))
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--cp-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cp-muted)] transition-colors hover:border-[var(--cp-error)] hover:text-[var(--cp-error)]"
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function mergeFiles(currentFiles: File[], nextFiles: File[]) {
  const fileMap = new Map<string, File>();

  for (const file of [...currentFiles, ...nextFiles]) {
    fileMap.set(buildFileKey(file), file);
  }

  return Array.from(fileMap.values());
}

function buildFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}
