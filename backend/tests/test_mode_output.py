import unittest

from app.core.audit_closure import get_audit_status_label, normalize_audit_status
from app.worker.analysis_export import (
    build_analysis_export_html,
    build_analysis_export_markdown,
    build_analysis_export_payload,
)
from app.worker.mode_output import build_mode_output


class ModeOutputTests(unittest.TestCase):
    def test_find_text_output_groups_matches_by_line(self) -> None:
        output = build_mode_output(
            analysis_mode="find_text",
            config={"query": "concreto"},
            text_rows=[
                {
                    "bbox": {"bottom": 12.0, "top": 10.0, "x0": 10.0, "x1": 90.0},
                    "document_id": 1,
                    "filename": "memorial.pdf",
                    "id": 1,
                    "page": 2,
                    "text": "estrutura em concreto armado",
                }
            ],
            extracted_fields=[],
        )

        self.assertIsNotNone(output)
        assert output is not None
        self.assertEqual(output["stats"]["occurrence_count"], 1)
        self.assertEqual(output["entries"][0]["kind"], "text_match")

    def test_expected_value_output_marks_divergence(self) -> None:
        output = build_mode_output(
            analysis_mode="check_project_number",
            config={"expected": "24-1087"},
            text_rows=[],
            extracted_fields=[
                {
                    "bbox": None,
                    "document_filename": "planta.pdf",
                    "field_name": "numero_projeto",
                    "input_document_id": 2,
                    "page": 1,
                    "raw_value": "99-0001",
                }
            ],
        )

        self.assertIsNotNone(output)
        assert output is not None
        self.assertEqual(output["stats"]["divergent_count"], 1)
        self.assertEqual(output["entries"][0]["kind"], "field_mismatch")
        self.assertEqual(output["entries"][0]["severity"], "relevante")


class AuditClosureTests(unittest.TestCase):
    def test_audit_closure_label_and_normalization(self) -> None:
        self.assertEqual(normalize_audit_status("clean"), "clean")
        self.assertEqual(
            get_audit_status_label("needs_review"),
            "Com pontos para revisar",
        )

    def test_markdown_export_includes_signoff_section(self) -> None:
        payload = build_analysis_export_payload(
            analysis_id=12,
            analysis_status="completed",
            package_summary={"identity": {}, "stats": {}},
            audit_summary={
                "highlights": [],
                "metrics": {},
                "sources": [],
                "status": {
                    "code": "clean",
                    "label": "Sem incongruencia relevante",
                    "summary": "Sem conflito ativo.",
                    "tone": "success",
                },
            },
            issues=[],
            ld_sheet_crosscheck={"reverse_results": []},
            signoff={
                "comment": "Pacote revisado e encerrado.",
                "final_status_label": "Sem incongruencia relevante",
                "reviewer_name": "Matheus",
                "updated_at": "2026-04-25T01:00:00+00:00",
            },
            mode_output=None,
        )

        report = build_analysis_export_markdown(payload)

        self.assertIn("## Encerramento formal", report)
        self.assertIn("Matheus", report)
        self.assertIn("Pacote revisado e encerrado.", report)

    def test_html_export_includes_directed_mode_section(self) -> None:
        payload = build_analysis_export_payload(
            analysis_id=18,
            analysis_status="completed",
            package_summary={"identity": {}, "stats": {}},
            audit_summary={
                "highlights": [],
                "metrics": {},
                "sources": [],
                "status": {
                    "code": "needs_review",
                    "label": "Com pontos de atencao",
                    "summary": "Ha itens dirigidos para revisar.",
                    "tone": "warning",
                },
            },
            issues=[],
            ld_sheet_crosscheck={"reverse_results": []},
            signoff=None,
            mode_output={
                "entries": [
                    {
                        "context": "Rua antiga 120",
                        "document_id": 3,
                        "expected_value": None,
                        "filename": "memorial.pdf",
                        "kind": "find_replace_match",
                        "page": 4,
                        "replacement_preview": "Avenida nova 120",
                        "severity": "info",
                        "value": "Rua antiga 120",
                    }
                ],
                "expected": None,
                "field_label": None,
                "mode": "find_replace",
                "query": "Rua antiga",
                "replace": "Avenida nova 120",
                "stats": {
                    "divergent_count": 0,
                    "document_count": 1,
                    "matching_count": 1,
                    "occurrence_count": 1,
                    "page_count": 1,
                },
                "summary": "Uma ocorrencia listada para substituicao sugerida.",
                "title": "Busca e substituicao",
            },
        )

        report = build_analysis_export_html(payload)

        self.assertIn("Busca e substituicao", report)
        self.assertIn("Rua antiga 120", report)
        self.assertIn("Avenida nova 120", report)


if __name__ == "__main__":
    unittest.main()
