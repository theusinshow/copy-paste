"""
Testes para todos os tipos de finding do audit de rodapes.
(app/worker/footer_audit.py)

Cobre os tipos:
  - footer_project_code_differs_from_package_identity  (probable_issue / relevante)
  - multiple_footer_project_codes_detected             (needs_review / atencao)
  - Sem finding quando rodape e consistente com identidade
"""

import unittest

from app.models.input_document import InputDocument
from app.worker.footer_audit import build_footer_audit


def make_document(document_id: int, filename: str) -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="pacote",
        original_filename=filename,
        file_path=f"/tmp/{filename}",
        file_hash=f"hash-{document_id}",
    )


def has_finding(findings: list, reason: str) -> bool:
    return any(f["reason"] == reason for f in findings)


def get_finding(findings: list, reason: str) -> dict | None:
    return next((f for f in findings if f["reason"] == reason), None)


class FooterCodeDiffersFromIdentityTests(unittest.TestCase):
    """footer_project_code_differs_from_package_identity:
    Rodape contem codigo diferente do codigo principal do pacote."""

    def test_rodape_com_codigo_divergente(self) -> None:
        doc = make_document(1, "pacote.pdf")
        # Pagina 1 tem texto com codigo principal 117-25
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25 BAIRRO CENTRO"}}
        # Rodape da pagina 2 tem codigo diferente: 999-01
        footer_texts = {1: {2: "PREFEITURA MUNICIPAL DE CRICIUMA PROC. 999-01 DATA 2026"}}

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertTrue(
            has_finding(result["findings"], "footer_project_code_differs_from_package_identity")
        )
        finding = get_finding(
            result["findings"], "footer_project_code_differs_from_package_identity"
        )
        self.assertEqual(finding["category"], "probable_issue")
        self.assertEqual(finding["severity"], "relevante")

    def test_multiplas_paginas_com_codigos_divergentes(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25"}}
        footer_texts = {
            1: {
                2: "PROC. 999-01 / CRICIUMA",
                3: "PROC. 888-01 / CRICIUMA",
            }
        }

        result = build_footer_audit([doc], page_texts, footer_texts)

        divergentes = [
            f for f in result["findings"]
            if f["reason"] == "footer_project_code_differs_from_package_identity"
        ]
        self.assertGreaterEqual(len(divergentes), 1)

    def test_rodape_sem_codigo_nao_gera_finding(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25"}}
        footer_texts = {1: {1: "PREFEITURA MUNICIPAL DE CRICIUMA OBRA NOVA"}}

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertFalse(
            has_finding(result["findings"], "footer_project_code_differs_from_package_identity")
        )


class MultipleFooterCodesDetectedTests(unittest.TestCase):
    """multiple_footer_project_codes_detected:
    Mais de um codigo encontrado nos rodapes, sem identidade para comparar."""

    def test_dois_codigos_distintos_sem_identidade(self) -> None:
        doc = make_document(1, "pacote.pdf")
        # Sem codigo de projeto na identidade (sem texto estruturado com codigo)
        page_texts = {1: {1: "PREFEITURA MUNICIPAL DE CRICIUMA BAIRRO CENTRO"}}
        footer_texts = {
            1: {
                1: "RODAPE DOC 117-25",
                2: "RODAPE DOC 118-25",
            }
        }

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertTrue(
            has_finding(result["findings"], "multiple_footer_project_codes_detected")
        )
        finding = get_finding(result["findings"], "multiple_footer_project_codes_detected")
        self.assertEqual(finding["category"], "needs_review")
        self.assertEqual(finding["severity"], "atencao")

    def test_codigo_unico_nos_rodapes_nao_gera_finding(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "PREFEITURA MUNICIPAL DE CRICIUMA BAIRRO CENTRO"}}
        footer_texts = {
            1: {
                1: "RODAPE 117-25",
                2: "RODAPE 117-25",
                3: "RODAPE 117-25",
            }
        }

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertFalse(
            has_finding(result["findings"], "multiple_footer_project_codes_detected")
        )

    def test_sem_rodape_sem_finding(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25"}}
        footer_texts: dict = {}

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertEqual(result["findings"], [])
        self.assertEqual(result["stats"]["occurrence_count"], 0)


class FooterConsistenteTests(unittest.TestCase):
    """Rodapes consistentes com a identidade nao geram findings."""

    def test_rodape_com_mesmo_codigo_da_identidade(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25 BAIRRO CENTRO"}}
        footer_texts = {1: {1: "PROC. 117-25 CRICIUMA 2026", 2: "PROC. 117-25 CRICIUMA 2026"}}

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertEqual(result["findings"], [])
        self.assertEqual(result["stats"]["probable_issue_count"], 0)
        self.assertEqual(result["stats"]["needs_review_count"], 0)

    def test_stats_contam_ocorrencias_corretamente(self) -> None:
        doc = make_document(1, "pacote.pdf")
        page_texts = {1: {1: "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25"}}
        footer_texts = {
            1: {
                1: "117-25",
                2: "117-25",
                3: "999-01",
            }
        }

        result = build_footer_audit([doc], page_texts, footer_texts)

        self.assertEqual(result["stats"]["footer_page_count"], 3)
        self.assertGreaterEqual(result["stats"]["occurrence_count"], 2)


if __name__ == "__main__":
    unittest.main()
