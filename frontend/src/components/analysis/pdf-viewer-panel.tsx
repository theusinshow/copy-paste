"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import type { AnalysisDocument } from "@/lib/api/analysis";
import { getDocumentFileUrl } from "@/lib/api/analysis";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfViewerPanelProps = {
  analysisId: number;
  documents: AnalysisDocument[];
  targetDocumentId?: number | null;
  targetPage?: number | null;
  onClose: () => void;
};

export function PdfViewerPanel({
  analysisId,
  documents,
  targetDocumentId,
  targetPage,
  onClose,
}: PdfViewerPanelProps) {
  const [activeDocId, setActiveDocId] = useState<number>(
    targetDocumentId ?? documents[0]?.id ?? 0,
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(targetPage ?? 1);
  const [containerWidth, setContainerWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(Math.floor(width) - 2);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const fileUrl = getDocumentFileUrl(analysisId, activeDocId);

  const goTo = useCallback(
    (page: number) => setCurrentPage(Math.max(1, Math.min(page, numPages))),
    [numPages],
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col border-t border-[var(--cp-border)] bg-[var(--cp-bg)] shadow-2xl"
      style={{ maxHeight: "60vh" }}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--cp-border)] px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setActiveDocId(doc.id); setCurrentPage(1); }}
              className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeDocId === doc.id
                  ? "bg-[var(--cp-accent)] text-[var(--cp-accent-ink)]"
                  : "text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
              }`}
            >
              {doc.filename}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded px-2 py-1 text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] disabled:opacity-30"
          >
            ‹ Anterior
          </button>
          <span className="font-mono text-xs text-[var(--cp-muted)]">
            {currentPage} / {numPages || "—"}
          </span>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="rounded px-2 py-1 text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)] disabled:opacity-30"
          >
            Próxima ›
          </button>
          <button
            onClick={onClose}
            className="ml-2 rounded px-2 py-1 text-xs text-[var(--cp-muted)] hover:text-[var(--cp-text)]"
          >
            ✕ Fechar
          </button>
        </div>
      </div>

      {/* PDF area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto flex justify-center bg-[#111]">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<PdfLoading />}
          error={<PdfError />}
        >
          <Page
            pageNumber={currentPage}
            width={containerWidth}
            renderTextLayer
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}

function PdfLoading() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-[var(--cp-muted)]">
      Carregando PDF…
    </div>
  );
}

function PdfError() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-[var(--cp-error)]">
      Não foi possível carregar o PDF.
    </div>
  );
}
