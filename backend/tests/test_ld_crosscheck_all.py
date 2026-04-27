"""
Testes para todos os tipos de resultado do cruzamento LD × Pranchas.
(app/worker/ld_sheet_crosscheck.py)

Cobre os tipos de resultado:
  Forward (LD -> Prancha):
    - matched_code_item_and_description    (compatible / ok)
    - sheet_code_not_detected_in_ld_section  (extraction_limit)
    - sheet_item_mismatch                    (probable_issue)
    - description_mismatch                   (needs_review)
    - sheet_description_low_confidence       (extraction_limit)
    - sheet_code_found_outside_ld_section    (probable_issue)
    - sheet_code_found_in_other_document_context (needs_review)

  Reverse (Prancha -> LD):
    - detected_sheet_missing_from_ld         (probable_issue)
    - detected_sheet_declared_in_other_section (probable_issue)
    - detected_sheet_declared_in_other_document (needs_review)
"""

import unittest

from app.models.input_document import InputDocument
from app.worker.ld_sheet_crosscheck import build_ld_sheet_crosscheck

PROJECT = "117_25"
CODE_ARQ_001 = f"{PROJECT}_ARQ_001_A"
CODE_ARQ_002 = f"{PROJECT}_ARQ_002_A"
CODE_ARQ_003 = f"{PROJECT}_ARQ_003_A"


def make_document(document_id: int, filename: str) -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="pacote",
        original_filename=filename,
        file_path=f"/tmp/{filename}",
        file_hash=f"hash-{document_id}",
    )


def has_result(results: list, reason: str) -> bool:
    return any(r["reason"] == reason for r in results)


def get_result(results: list, reason: str) -> dict | None:
    return next((r for r in results if r["reason"] == reason), None)


class MatchedCodeTests(unittest.TestCase):
    """matched_code_item_and_description: LD e prancha com codigo, item e descricao compativeis."""

    def test_match_perfeito_codigo_item_descricao(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                1: f"LISTA DE DOCUMENTOS 01/07 {CODE_ARQ_001} PLANTA BAIXA TERREO",
                2: f"01/07 {CODE_ARQ_001} PLANTA BAIXA TERREO",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertEqual(len(result["results"]), 1)
        self.assertEqual(result["results"][0]["category"], "compatible")
        self.assertEqual(result["results"][0]["reason"], "matched_code_item_and_description")
        self.assertEqual(result["stats"]["compatible_count"], 1)


class SheetCodeNotDetectedTests(unittest.TestCase):
    """sheet_code_not_detected_in_ld_section: codigo declarado na LD mas sem prancha detectada."""

    def test_codigo_na_ld_sem_prancha(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # LD declara o codigo, mas nenhuma outra pagina tem o carimbo
                1: f"LISTA DE DOCUMENTOS 01/07 {CODE_ARQ_001} PLANTA BAIXA",
                2: "Texto sem nenhum codigo de prancha",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(has_result(result["results"], "sheet_code_not_detected_in_ld_section"))
        r = get_result(result["results"], "sheet_code_not_detected_in_ld_section")
        self.assertEqual(r["category"], "extraction_limit")
        self.assertEqual(r["severity"], "atencao")


class SheetItemMismatchTests(unittest.TestCase):
    """sheet_item_mismatch: codigo encontrado mas item XX/YY difere entre LD e prancha."""

    def test_item_diferente_entre_ld_e_prancha(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # LD diz 01/07; prancha real diz 02/07
                1: f"LISTA DE DOCUMENTOS 01/07 {CODE_ARQ_001} PLANTA BAIXA",
                2: f"02/07 {CODE_ARQ_001} PLANTA BAIXA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(has_result(result["results"], "sheet_item_mismatch"))
        r = get_result(result["results"], "sheet_item_mismatch")
        self.assertEqual(r["category"], "probable_issue")
        self.assertEqual(r["severity"], "relevante")


class DescriptionMismatchTests(unittest.TestCase):
    """description_mismatch: codigo e item ok mas descricao diverge."""

    def test_descricao_diferente_gera_needs_review(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # LD: "PLANTA BAIXA TERREO"; prancha: "COBERTURA" (sobreposicao < 60%)
                1: f"LISTA DE DOCUMENTOS 01/07 {CODE_ARQ_001} PLANTA BAIXA TERREO",
                2: f"01/07 {CODE_ARQ_001} COBERTURA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(has_result(result["results"], "description_mismatch"))
        r = get_result(result["results"], "description_mismatch")
        self.assertEqual(r["category"], "needs_review")


class SheetDescriptionLowConfidenceTests(unittest.TestCase):
    """sheet_description_low_confidence: carimbo so tem metadados, sem descricao util."""

    def test_carimbo_so_com_metadados_gera_extraction_limit(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                1: f"LISTA DE DOCUMENTOS 01/07 {CODE_ARQ_001} PLANTA BAIXA TERREO",
                # Pagina 2: carimbo sem descricao real, so metadados
                2: f"01/07 {CODE_ARQ_001} DATA 22/04/2026 DISCIPLINA ARQ ARQUIVO 07",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(has_result(result["results"], "sheet_description_low_confidence"))
        r = get_result(result["results"], "sheet_description_low_confidence")
        self.assertEqual(r["category"], "extraction_limit")


class SheetCodeFoundOutsideLdSectionTests(unittest.TestCase):
    """sheet_code_found_outside_ld_section: prancha encontrada em secao diferente da LD."""

    def test_prancha_em_secao_diferente_da_ld(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # Secao 1: LD declara ARQ_001
                1: f"LISTA DE DOCUMENTOS 01/04 {CODE_ARQ_001} PLANTA BAIXA",
                # Secao 2: nova LD (nova secao)
                2: f"LISTA DE DOCUMENTOS 01/03 {CODE_ARQ_002} CORTE A-A",
                # Pagina 3 pertence a secao 2, mas contem carimbo de ARQ_001 (da secao 1)
                3: f"01/04 {CODE_ARQ_001} PLANTA BAIXA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(
            has_result(result["results"], "sheet_code_found_outside_ld_section")
            or has_result(result["reverse_results"], "detected_sheet_declared_in_other_section")
        )


class SheetCodeFoundInOtherDocumentTests(unittest.TestCase):
    """sheet_code_found_in_other_document_context: prancha encontrada em outro documento."""

    def test_prancha_encontrada_em_documento_diferente(self) -> None:
        doc1 = make_document(1, "lista-documentos.pdf")
        doc2 = make_document(2, "pranchas-arq.pdf")
        texts = {
            # doc1 tem a LD com ARQ_001
            1: {1: f"LISTA DE DOCUMENTOS 01/05 {CODE_ARQ_001} PLANTA BAIXA"},
            # doc2 tem o carimbo de ARQ_001 (outro documento)
            2: {1: f"01/05 {CODE_ARQ_001} PLANTA BAIXA"},
        }
        result = build_ld_sheet_crosscheck([doc1, doc2], texts)
        # A prancha esta no doc2, mas a LD e do doc1
        self.assertTrue(
            has_result(result["results"], "sheet_code_found_in_other_document_context")
            or has_result(result["reverse_results"], "detected_sheet_declared_in_other_document")
        )


class DetectedSheetMissingFromLdTests(unittest.TestCase):
    """detected_sheet_missing_from_ld: prancha detectada mas sem entrada na LD."""

    def test_prancha_detectada_sem_ld(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # Pagina 1 tem LD com so ARQ_001
                1: f"LISTA DE DOCUMENTOS 01/01 {CODE_ARQ_001} PLANTA BAIXA",
                # Pagina 2 tem carimbo de ARQ_001 (ok)
                2: f"01/01 {CODE_ARQ_001} PLANTA BAIXA",
                # Pagina 3 tem carimbo de ARQ_002 que NAO esta na LD
                3: f"01/01 {CODE_ARQ_002} PLANTA DE COBERTURA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(has_result(result["reverse_results"], "detected_sheet_missing_from_ld"))
        r = get_result(result["reverse_results"], "detected_sheet_missing_from_ld")
        self.assertEqual(r["category"], "probable_issue")
        self.assertEqual(r["severity"], "relevante")
        self.assertEqual(result["stats"]["undeclared_sheet_count"], 1)

    def test_multiplas_pranchas_sem_ld(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                1: f"LISTA DE DOCUMENTOS 01/01 {CODE_ARQ_001} PLANTA BAIXA",
                2: f"01/01 {CODE_ARQ_001} PLANTA BAIXA",
                3: f"01/01 {CODE_ARQ_002} CORTE TRANSVERSAL",
                4: f"01/01 {CODE_ARQ_003} FACHADA PRINCIPAL",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        missing = [
            r for r in result["reverse_results"] if r["reason"] == "detected_sheet_missing_from_ld"
        ]
        self.assertEqual(len(missing), 2)
        self.assertEqual(result["stats"]["undeclared_sheet_count"], 2)

    def test_sem_ld_nao_marca_pranchas_como_sem_declaracao(self) -> None:
        docs = [make_document(1, "pranchas-sem-ld.pdf")]
        texts = {
            1: {
                1: f"01/01 {CODE_ARQ_001} PLANTA BAIXA",
                2: f"02/02 {CODE_ARQ_002} PLANTA DE COBERTURA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertEqual(result["results"], [])
        self.assertEqual(result["reverse_results"], [])
        self.assertEqual(result["stats"]["undeclared_sheet_count"], 0)
        self.assertEqual(result["stats"]["combined_probable_issue_count"], 0)


class DetectedSheetDeclaredInOtherSectionTests(unittest.TestCase):
    """detected_sheet_declared_in_other_section: prancha pertence a uma secao mas LD e de outra."""

    def test_prancha_em_secao_errada(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                # Secao 1 declara ARQ_001 na sua LD (pagina 1)
                1: f"LISTA DE DOCUMENTOS 01/02 {CODE_ARQ_001} PLANTA BAIXA",
                2: "Pagina de conteudo da secao 1",
                # Secao 2 comeca com nova LD (pagina 3)
                3: f"LISTA DE DOCUMENTOS 01/02 {CODE_ARQ_002} PLANTA DE COBERTURA",
                # Pagina 4: carimbo de ARQ_001 aparece na secao 2 (errado)
                4: f"01/02 {CODE_ARQ_001} PLANTA BAIXA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        self.assertTrue(
            has_result(result["reverse_results"], "detected_sheet_declared_in_other_section")
            or has_result(result["results"], "sheet_code_found_outside_ld_section")
        )


class StatsConsistencyTests(unittest.TestCase):
    """Verifica contadores no stats do resultado do cruzamento."""

    def test_stats_combined_counts(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                1: f"LISTA DE DOCUMENTOS 01/01 {CODE_ARQ_001} PLANTA BAIXA",
                2: f"01/01 {CODE_ARQ_001} PLANTA BAIXA",
                3: f"01/01 {CODE_ARQ_002} PLANTA DE COBERTURA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        stats = result["stats"]
        self.assertGreaterEqual(stats["total_count"], 1)
        self.assertGreaterEqual(stats["reverse_total_count"], 1)

    def test_pacote_limpo_sem_issues(self) -> None:
        docs = [make_document(1, "pacote.pdf")]
        texts = {
            1: {
                1: f"LISTA DE DOCUMENTOS 01/02 {CODE_ARQ_001} PLANTA BAIXA 02/02 {CODE_ARQ_002} COBERTURA",
                2: f"01/02 {CODE_ARQ_001} PLANTA BAIXA",
                3: f"02/02 {CODE_ARQ_002} COBERTURA",
            }
        }
        result = build_ld_sheet_crosscheck(docs, texts)
        probable = result["stats"]["combined_probable_issue_count"]
        self.assertEqual(probable, 0)


if __name__ == "__main__":
    unittest.main()
