"use client";

import { useEffect, useState } from "react";

import { IssueList } from "@/components/analysis/issue-list";
import { PdfViewerPanel } from "@/components/analysis/pdf-viewer-panel";
import { listAnalysisDocuments } from "@/lib/api/analysis";
import type { AnalysisDocument } from "@/lib/api/analysis";
import type { AnalysisIssue } from "@/lib/types/issue";

type IssuesSectionClientProps = {
  analysisId: number;
  issues: AnalysisIssue[];
  loadError?: string | null;
  status: string;
};

export function IssuesSectionClient({
  analysisId,
  issues,
  loadError,
  status,
}: IssuesSectionClientProps) {
  const [documents, setDocuments] = useState<AnalysisDocument[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [targetDocId, setTargetDocId] = useState<number | null>(null);
  const [targetPage, setTargetPage] = useState<number | null>(null);

  useEffect(() => {
    listAnalysisDocuments(analysisId)
      .then(setDocuments)
      .catch(() => {});
  }, [analysisId]);

  function handleOpenPdf(documentId: number | null, page: number) {
    setTargetDocId(documentId);
    setTargetPage(page);
    setPdfOpen(true);
  }

  return (
    <>
      <IssueList
        analysisId={analysisId}
        issues={issues}
        loadError={loadError}
        status={status}
        onOpenPdf={documents.length > 0 ? handleOpenPdf : undefined}
      />
      {pdfOpen && documents.length > 0 ? (
        <PdfViewerPanel
          analysisId={analysisId}
          documents={documents}
          targetDocumentId={targetDocId}
          targetPage={targetPage}
          onClose={() => setPdfOpen(false)}
        />
      ) : null}
    </>
  );
}
