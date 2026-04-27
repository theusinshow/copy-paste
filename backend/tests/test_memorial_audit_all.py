"""
Testes para todos os tipos de finding do audit de memoriais.
(app/worker/memorial_audit.py)

Cobre os tipos:
  Probable issue (relevante):
    - project_code_differs_from_package_identity
    - bairro_differs_from_package_identity
    - work_name_differs_from_package_identity
    - municipality_differs_from_package_identity
    - owner_city_differs_from_memorial_municipality

  Needs review (atencao):
    - multiple_memorial_address_values_detected
    - multiple_memorial_municipality_values_detected
    - multiple_memorial_project_code_values_detected

  Extraction limit (atencao):
    - no_memorial_identity_fields_detected

Notas sobre selecao de documento memorial:
  - Filename contem "MEMORIAL" ou "_MD_"
  - Ou primeiras 2 paginas contem "VOLUME 1" + "MEMORIAL DESCRITIVO"
"""

import unittest

from app.models.input_document import InputDocument
from app.worker.memorial_audit import build_memorial_audit


def make_memorial(document_id: int, filename: str = "MEMORIAL_DESCRITIVO_01.pdf") -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="memorial",
        original_filename=filename,
        file_path=f"/tmp/{filename}",
        file_hash=f"hash-{document_id}",
    )


def make_prancha(document_id: int) -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="prancha",
        original_filename=f"pranchas-{document_id:02d}.pdf",
        file_path=f"/tmp/pranchas-{document_id:02d}.pdf",
        file_hash=f"hash-{document_id}",
    )


def has_finding(findings: list, reason: str) -> bool:
    return any(f["reason"] == reason for f in findings)


def get_finding(findings: list, reason: str) -> dict | None:
    return next((f for f in findings if f["reason"] == reason), None)


# Texto base para estabelecer identidade do pacote (codigo 117-25, bairro CENTRO, municipio CRICIUMA)
IDENTITY_PAGE = (
    "GOVERNO DO MUNICIPIO DE CRICIUMA 117-25 BAIRRO CENTRO VOLUME 1 "
    "UBS NOVA ESPERANCA - PORTE 1 JANEIRO/2026"
)


class ProjectCodeDiffersTests(unittest.TestCase):
    """project_code_differs_from_package_identity:
    Memorial tem codigo diferente do codigo do pacote."""

    def test_codigo_do_memorial_difere_do_pacote(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            1: {1: IDENTITY_PAGE},
            # Memorial com codigo diferente
            2: {1: "PREFEITURA MUNICIPAL DE CRICIUMA PROCESSO 999-01 BAIRRO CENTRO"},
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertTrue(has_finding(result["findings"], "project_code_differs_from_package_identity"))
        finding = get_finding(result["findings"], "project_code_differs_from_package_identity")
        self.assertEqual(finding["category"], "probable_issue")
        self.assertEqual(finding["severity"], "relevante")

    def test_codigo_igual_nao_gera_finding(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            1: {1: IDENTITY_PAGE},
            2: {1: "PREFEITURA MUNICIPAL DE CRICIUMA PROCESSO 117-25 BAIRRO CENTRO"},
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertFalse(has_finding(result["findings"], "project_code_differs_from_package_identity"))


class BairroDiffersTests(unittest.TestCase):
    """bairro_differs_from_package_identity:
    Memorial tem bairro diferente do bairro do pacote."""

    def test_bairro_do_memorial_difere_do_pacote(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            1: {1: IDENTITY_PAGE},  # identidade: CENTRO
            2: {
                1: (
                    "PREFEITURA MUNICIPAL DE CRICIUMA 117-25 "
                    "BAIRRO: NOVA ESPERANCA MUNICIPIO DE CRICIUMA"
                )
            },
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertTrue(has_finding(result["findings"], "bairro_differs_from_package_identity"))


class WorkNameDiffersTests(unittest.TestCase):
    """work_name_differs_from_package_identity:
    Memorial tem nome de obra diferente."""

    def test_nome_obra_difere(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            1: {1: IDENTITY_PAGE},  # identidade: UBS NOVA ESPERANCA - PORTE 1
            2: {
                1: (
                    "PREFEITURA MUNICIPAL DE CRICIUMA 117-25 BAIRRO CENTRO "
                    "UBS CENTRO HISTORICO - PORTE 2 MUNICIPIO DE CRICIUMA"
                )
            },
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertTrue(has_finding(result["findings"], "work_name_differs_from_package_identity"))
        finding = get_finding(result["findings"], "work_name_differs_from_package_identity")
        self.assertEqual(finding["severity"], "relevante")


class MunicipalityDiffersTests(unittest.TestCase):
    """municipality_differs_from_package_identity:
    Memorial tem municipio diferente."""

    def test_municipio_diferente_do_pacote(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            1: {1: IDENTITY_PAGE},  # identidade: CRICIUMA
            2: {
                1: "PREFEITURA MUNICIPAL DE CRICIUMA 117-25 MUNICIPIO DE SANTOS BAIRRO CENTRO"
            },
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertTrue(
            has_finding(result["findings"], "municipality_differs_from_package_identity")
        )


class OwnerCityDiffersTests(unittest.TestCase):
    """owner_city_differs_from_memorial_municipality:
    Cidade do proprietario/cliente difere do municipio do memorial."""

    def test_cidade_do_proprietario_nao_gera_finding_automatico(self) -> None:
        prancha = make_prancha(1)
        memorial = make_memorial(2)
        texts = {
            # Prancha estabelece identidade: municipio CRICIUMA
            1: {1: "PREFEITURA MUNICIPAL DE CRICIUMA 117-25 BAIRRO CENTRO VOLUME 1"},
            # Memorial: proprietario e de SANTOS, mas a obra e em CRICIUMA
            2: {
                1: (
                    "PROPRIETARIO: PREFEITURA MUNICIPAL DE SANTOS "
                    "117-25 MUNICIPIO DE CRICIUMA BAIRRO CENTRO"
                )
            },
        }

        result = build_memorial_audit([prancha, memorial], texts)

        self.assertFalse(
            has_finding(result["findings"], "owner_city_differs_from_memorial_municipality")
        )


class MultipleAddressTests(unittest.TestCase):
    """multiple_memorial_address_values_detected:
    Memorial contem mais de um endereco."""

    def test_dois_enderecos_diferentes(self) -> None:
        memorial = make_memorial(1)
        texts = {
            1: {
                1: "117-25 BAIRRO CENTRO MUNICIPIO DE CRICIUMA RUA DAS FLORES 120",
                2: "AVENIDA PRINCIPAL 500 BAIRRO CENTRO",
            }
        }

        result = build_memorial_audit([memorial], texts)

        self.assertTrue(
            has_finding(result["findings"], "multiple_memorial_address_values_detected")
        )
        finding = get_finding(result["findings"], "multiple_memorial_address_values_detected")
        self.assertEqual(finding["category"], "needs_review")
        self.assertEqual(finding["severity"], "atencao")


class MultipleMunicipalityTests(unittest.TestCase):
    """multiple_memorial_municipality_values_detected:
    Memorial menciona mais de um municipio."""

    def test_dois_municipios_diferentes(self) -> None:
        memorial = make_memorial(1)
        texts = {
            1: {
                1: "117-25 MUNICIPIO DE CRICIUMA BAIRRO CENTRO",
                2: "MUNICIPIO DE SANTOS BAIRRO CENTRO",
            }
        }

        result = build_memorial_audit([memorial], texts)

        self.assertTrue(
            has_finding(result["findings"], "multiple_memorial_municipality_values_detected")
        )


class MultipleProjectCodeTests(unittest.TestCase):
    """multiple_memorial_project_code_values_detected:
    Memorial contem mais de um codigo de projeto."""

    def test_dois_codigos_no_memorial(self) -> None:
        memorial = make_memorial(1)
        texts = {
            1: {
                1: "PREFEITURA MUNICIPAL DE CRICIUMA PROCESSO 117-25 BAIRRO CENTRO",
                2: "REVISAO CONFORME PROCESSO 118-25",
            }
        }

        result = build_memorial_audit([memorial], texts)

        self.assertTrue(
            has_finding(result["findings"], "multiple_memorial_project_code_values_detected")
        )


class NoMemorialFieldsTests(unittest.TestCase):
    """no_memorial_identity_fields_detected:
    Nenhum campo de identidade extraido do memorial."""

    def test_memorial_sem_campos_extraiveis(self) -> None:
        memorial = make_memorial(1)
        # Texto generico sem nenhum padrao reconhecivel
        texts = {1: {1: "PAGINA EM BRANCO SEM CONTEUDO TECNICO"}}

        result = build_memorial_audit([memorial], texts)

        self.assertTrue(
            has_finding(result["findings"], "no_memorial_identity_fields_detected")
        )
        finding = get_finding(result["findings"], "no_memorial_identity_fields_detected")
        self.assertEqual(finding["category"], "extraction_limit")

    def test_nenhum_documento_memorial_selecionado(self) -> None:
        # Documento sem "MEMORIAL" no nome e sem marcadores nas paginas
        apenas_prancha = InputDocument(
            id=1,
            analysis_run_id=1,
            tipo="prancha",
            original_filename="pranchas-arq.pdf",
            file_path="/tmp/pranchas-arq.pdf",
            file_hash="hash-1",
        )
        texts = {1: {1: "01/07 117_25_ARQ_001_A PLANTA BAIXA"}}

        result = build_memorial_audit([apenas_prancha], texts)

        self.assertTrue(
            has_finding(result["findings"], "no_memorial_identity_fields_detected")
        )

    def test_stats_zerados_sem_memorial(self) -> None:
        apenas_prancha = InputDocument(
            id=1,
            analysis_run_id=1,
            tipo="prancha",
            original_filename="pranchas.pdf",
            file_path="/tmp/pranchas.pdf",
            file_hash="hash-1",
        )
        texts = {1: {1: "Texto qualquer"}}

        result = build_memorial_audit([apenas_prancha], texts)

        self.assertEqual(result["stats"]["occurrence_count"], 0)
        self.assertEqual(result["stats"]["document_count"], 0)


class MemorialSelectionTests(unittest.TestCase):
    """Verifica que documentos sao selecionados corretamente como memorial."""

    def test_filename_com_memorial_e_selecionado(self) -> None:
        doc = make_memorial(1, "01_MEMORIAL_DESCRITIVO.pdf")
        texts = {1: {1: "117-25 MUNICIPIO DE CRICIUMA BAIRRO CENTRO"}}
        result = build_memorial_audit([doc], texts)
        self.assertEqual(result["stats"]["document_count"], 1)

    def test_filename_com_md_e_selecionado(self) -> None:
        doc = make_memorial(1, "VOLUME_01_MD_CRICIUMA.pdf")
        texts = {1: {1: "117-25 MUNICIPIO DE CRICIUMA BAIRRO CENTRO"}}
        result = build_memorial_audit([doc], texts)
        self.assertEqual(result["stats"]["document_count"], 1)

    def test_primeira_pagina_com_marcadores_e_selecionado(self) -> None:
        doc = InputDocument(
            id=1,
            analysis_run_id=1,
            tipo="pacote",
            original_filename="pacote-completo.pdf",
            file_path="/tmp/pacote-completo.pdf",
            file_hash="hash-1",
        )
        # Paginas 1 e 2 contem "VOLUME 1" e "MEMORIAL DESCRITIVO"
        texts = {
            1: {
                1: "VOLUME 1 MEMORIAL DESCRITIVO",
                2: "117-25 MUNICIPIO DE CRICIUMA BAIRRO CENTRO",
            }
        }
        result = build_memorial_audit([doc], texts)
        self.assertEqual(result["stats"]["document_count"], 1)


if __name__ == "__main__":
    unittest.main()
