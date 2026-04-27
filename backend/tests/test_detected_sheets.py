import unittest

from app.models.input_document import InputDocument
from app.worker.detected_sheets import build_detected_sheets
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


class DetectedSheetsTests(unittest.TestCase):
    def test_detected_sheet_extracts_title_before_discipline_marker(self) -> None:
        documents = [make_document(1, "pranchas.pdf")]
        page_texts_by_document_id = {
            1: {
                1: "PLANTA DE COBERTURA ARQ 01/07 117_25_ARQ_001_A",
            }
        }

        result = build_detected_sheets(documents, page_texts_by_document_id)

        self.assertEqual(result["stats"]["sheet_count"], 1)
        self.assertEqual(
            result["documents"][0]["sheets"][0]["description"],
            "PLANTA DE COBERTURA",
        )

    def test_detected_sheet_uses_content_label_without_colons(self) -> None:
        documents = [make_document(1, "pranchas.pdf")]
        page_texts_by_document_id = {
            1: {
                1: "CONTEUDO PRANCHA PLANTA DE SITUACAO ARQ 01/07 117_25_ARQ_001_A",
            }
        }

        result = build_detected_sheets(documents, page_texts_by_document_id)

        self.assertEqual(result["stats"]["sheet_count"], 1)
        self.assertEqual(
            result["documents"][0]["sheets"][0]["description"],
            "PLANTA DE SITUACAO",
        )

    def test_detected_sheet_trims_metadata_suffix_from_stamp_text(self) -> None:
        documents = [make_document(1, "pranchas.pdf")]
        page_texts_by_document_id = {
            1: {
                1: (
                    "01/07 117_25_ARQ_001_A PLANTA BAIXA TERREO "
                    "DATA 22/04/2026 DISCIPLINA ARQ ARQUIVO 07"
                ),
            }
        }

        result = build_detected_sheets(documents, page_texts_by_document_id)

        self.assertEqual(
            result["documents"][0]["sheets"][0]["description"],
            "PLANTA BAIXA TERREO",
        )

    def test_crosscheck_marks_metadata_only_stamp_as_extraction_limit(self) -> None:
        documents = [make_document(1, "pacote.pdf")]
        page_texts_by_document_id = {
            1: {
                1: "LISTA DE DOCUMENTOS 01/07 117_25_ARQ_001_A PLANTA BAIXA TERREO",
                2: "01/07 117_25_ARQ_001_A DATA 22/04/2026 DISCIPLINA ARQ ARQUIVO 07",
            }
        }

        result = build_ld_sheet_crosscheck(documents, page_texts_by_document_id)

        self.assertEqual(len(result["results"]), 1)
        self.assertEqual(result["results"][0]["category"], "extraction_limit")
        self.assertEqual(result["results"][0]["reason"], "sheet_description_low_confidence")


if __name__ == "__main__":
    unittest.main()
