import unittest

from app.core.review_decisions import (
    REVIEW_STATUS_ACTIVE,
    REVIEW_STATUS_INCONCLUSIVE,
    REVIEW_STATUS_PENDING,
)
from app.models.input_document import InputDocument
from app.worker.audit_summary import build_audit_summary
from app.worker.ld_sheet_crosscheck import build_ld_sheet_crosscheck


def make_document(document_id: int, filename: str) -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="pacote",
        original_filename=filename,
        file_path=f"/tmp/{filename}",
        file_hash=f"hash-{document_id}",
    )


class AuditSummaryTests(unittest.TestCase):
    def test_audit_summary_prioritizes_relevant_status_and_pending_review(self) -> None:
        summary = build_audit_summary(
            issues=[
                {
                    "id": 1,
                    "review": None,
                    "review_status": REVIEW_STATUS_PENDING,
                    "severity": "relevante",
                }
            ],
            package_summary={"stats": {"document_count": 2, "page_count": 6}},
            drawing_lists={"alerts": [], "stats": {"row_count": 1}},
            detected_sheets={"stats": {"sheet_count": 2}},
            ld_sheet_crosscheck={
                "results": [],
                "reverse_results": [
                    {
                        "category": "probable_issue",
                        "reason": "detected_sheet_missing_from_ld",
                    }
                ],
            },
            memorial_audit={"findings": [], "stats": {"occurrence_count": 0}},
            footer_audit={"findings": [], "stats": {"occurrence_count": 0}},
        )

        self.assertEqual(summary["status"]["code"], "relevant_issue")
        self.assertEqual(summary["metrics"]["pending_review_count"], 1)
        self.assertEqual(summary["metrics"]["undeclared_sheet_count"], 1)

    def test_audit_summary_treats_unreviewed_relevant_issue_as_pending(self) -> None:
        summary = build_audit_summary(
            issues=[
                {
                    "id": 1,
                    "review": None,
                    "review_status": REVIEW_STATUS_PENDING,
                    "severity": "relevante",
                }
            ],
            package_summary={"stats": {"document_count": 1, "page_count": 3}},
            drawing_lists={"alerts": [], "stats": {"row_count": 0}},
            detected_sheets={"stats": {"sheet_count": 1}},
            ld_sheet_crosscheck={"results": [], "reverse_results": []},
            memorial_audit={"findings": [], "stats": {"occurrence_count": 0}},
            footer_audit={"findings": [], "stats": {"occurrence_count": 0}},
        )

        self.assertEqual(summary["status"]["code"], "needs_review")
        self.assertEqual(summary["metrics"]["relevant_count"], 0)
        self.assertEqual(summary["metrics"]["pending_review_count"], 1)

    def test_audit_summary_marks_sem_evidencia_as_incomplete(self) -> None:
        summary = build_audit_summary(
            issues=[
                {
                    "id": 1,
                    "review": {"decision": "sem_evidencia"},
                    "review_status": REVIEW_STATUS_INCONCLUSIVE,
                    "severity": "relevante",
                }
            ],
            package_summary={"stats": {"document_count": 1, "page_count": 3}},
            drawing_lists={"alerts": [], "stats": {"row_count": 0}},
            detected_sheets={"stats": {"sheet_count": 1}},
            ld_sheet_crosscheck={"results": [], "reverse_results": []},
            memorial_audit={"findings": [], "stats": {"occurrence_count": 0}},
            footer_audit={"findings": [], "stats": {"occurrence_count": 0}},
        )

        self.assertEqual(summary["status"]["code"], "incomplete")
        self.assertEqual(summary["metrics"]["inconclusive_issue_count"], 1)
        self.assertEqual(summary["metrics"]["incomplete_count"], 1)

    def test_audit_summary_counts_confirmed_issue_as_active(self) -> None:
        summary = build_audit_summary(
            issues=[
                {
                    "id": 1,
                    "review": {"decision": "confirmada"},
                    "review_status": REVIEW_STATUS_ACTIVE,
                    "severity": "relevante",
                }
            ],
            package_summary={"stats": {"document_count": 1, "page_count": 3}},
            drawing_lists={"alerts": [], "stats": {"row_count": 0}},
            detected_sheets={"stats": {"sheet_count": 1}},
            ld_sheet_crosscheck={"results": [], "reverse_results": []},
            memorial_audit={"findings": [], "stats": {"occurrence_count": 0}},
            footer_audit={"findings": [], "stats": {"occurrence_count": 0}},
        )

        self.assertEqual(summary["status"]["code"], "relevant_issue")
        self.assertEqual(summary["metrics"]["active_issue_count"], 1)
        self.assertEqual(summary["metrics"]["relevant_count"], 1)


class LdSheetCrosscheckTests(unittest.TestCase):
    def test_crosscheck_flags_detected_sheet_missing_from_ld(self) -> None:
        documents = [make_document(1, "pacote-arquitetura.pdf")]
        page_texts_by_document_id = {
            1: {
                1: "LISTA DE DOCUMENTOS 01/01 117_25_ARQ_001_A PLANTA BAIXA",
                2: "01/01 117_25_ARQ_001_A PLANTA BAIXA",
                3: "02/02 117_25_ARQ_002_A DETALHE EXTRA",
            }
        }

        crosscheck = build_ld_sheet_crosscheck(documents, page_texts_by_document_id)

        self.assertEqual(len(crosscheck["results"]), 1)
        self.assertEqual(len(crosscheck["reverse_results"]), 1)
        self.assertEqual(
            crosscheck["reverse_results"][0]["reason"],
            "detected_sheet_missing_from_ld",
        )
        self.assertEqual(crosscheck["stats"]["undeclared_sheet_count"], 1)


if __name__ == "__main__":
    unittest.main()
