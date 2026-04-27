"""
Testes para todos os tipos de alerta da lista de documentos (LD).
(app/worker/drawing_list.py)

Cobre os tipos:
  - ld_project_code_mismatch    (atencao): linha da LD com codigo de projeto diferente do dominante
  - ld_row_without_clear_match  (atencao): codigo da linha nao encontrado no texto do pacote

Formato de linha LD: "01/15 117_25_ARQ_001_A DESCRICAO"
A pagina e reconhecida como LD quando contem "LISTA DE DOCUMENTOS".
"""

import unittest

from app.models.input_document import InputDocument
from app.worker.drawing_list import build_drawing_lists


def make_document(document_id: int, filename: str = "pacote.pdf") -> InputDocument:
    return InputDocument(
        id=document_id,
        analysis_run_id=1,
        tipo="pacote",
        original_filename=filename,
        file_path=f"/tmp/{filename}",
        file_hash=f"hash-{document_id}",
    )


def has_alert(alerts: list, alert_type: str) -> bool:
    return any(a["type"] == alert_type for a in alerts)


def get_alerts(alerts: list, alert_type: str) -> list:
    return [a for a in alerts if a["type"] == alert_type]


class LdProjectCodeMismatchTests(unittest.TestCase):
    """ld_project_code_mismatch: linha da LD com codigo de projeto diferente do dominante."""

    def test_linha_com_codigo_diferente_gera_alerta(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                # LD com 3 linhas: 2 tem 117_25, 1 tem 999_01 (diferente)
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/03 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/03 117_25_ARQ_002_A CORTE A-A "
                    "03/03 999_01_ARQ_001_A DETALHE"
                )
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertTrue(has_alert(result["alerts"], "ld_project_code_mismatch"))
        alert = get_alerts(result["alerts"], "ld_project_code_mismatch")[0]
        self.assertEqual(alert["severity"], "atencao")
        self.assertIn("999_01", alert["document_code"])

    def test_sem_alerta_quando_todos_os_codigos_iguais(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/02 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/02 117_25_ARQ_002_A CORTE A-A"
                )
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertFalse(has_alert(result["alerts"], "ld_project_code_mismatch"))

    def test_alerta_somente_para_linhas_nao_dominantes(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/04 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/04 117_25_ARQ_002_A CORTE A-A "
                    "03/04 117_25_ARQ_003_A COBERTURA "
                    "04/04 888_99_ARQ_001_A FACHADA"
                )
            }
        }

        result = build_drawing_lists([doc], texts)

        mismatches = get_alerts(result["alerts"], "ld_project_code_mismatch")
        # Somente a linha 888_99 deve gerar alerta
        self.assertEqual(len(mismatches), 1)
        self.assertIn("888_99", mismatches[0]["document_code"])


class LdRowWithoutClearMatchTests(unittest.TestCase):
    """ld_row_without_clear_match: codigo da linha nao encontrado no texto das paginas de conteudo."""

    def test_codigo_sem_correspondencia_no_pacote(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                # Pagina 1: LD declara ARQ_001 e ARQ_002
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/02 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/02 117_25_ARQ_002_A CORTE A-A"
                ),
                # Pagina 2: contem ARQ_001 mas NAO ARQ_002
                2: "01/02 117_25_ARQ_001_A PLANTA BAIXA",
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertTrue(has_alert(result["alerts"], "ld_row_without_clear_match"))
        sem_match = get_alerts(result["alerts"], "ld_row_without_clear_match")
        codigos = [a["document_code"] for a in sem_match]
        self.assertTrue(any("ARQ_002" in c for c in codigos))

    def test_sem_alerta_quando_todos_codigos_encontrados(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/02 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/02 117_25_ARQ_002_A CORTE A-A"
                ),
                2: "01/02 117_25_ARQ_001_A PLANTA BAIXA",
                3: "02/02 117_25_ARQ_002_A CORTE A-A",
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertFalse(has_alert(result["alerts"], "ld_row_without_clear_match"))


class DrawingListStatsTests(unittest.TestCase):
    """Verifica contadores do stats da lista de documentos."""

    def test_stats_com_linhas_extraidas(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/03 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/03 117_25_ARQ_002_A CORTE A-A "
                    "03/03 117_25_ARQ_003_A COBERTURA"
                )
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertEqual(result["stats"]["document_count"], 1)
        self.assertEqual(result["stats"]["row_count"], 3)

    def test_pagina_sem_lista_de_documentos_nao_e_processada(self) -> None:
        doc = make_document(1)
        # Pagina tem linhas no formato de LD, mas sem o titulo "LISTA DE DOCUMENTOS"
        texts = {
            1: {
                1: (
                    "01/02 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/02 117_25_ARQ_002_A CORTE A-A"
                )
            }
        }

        result = build_drawing_lists([doc], texts)

        self.assertEqual(result["stats"]["row_count"], 0)
        self.assertEqual(result["stats"]["document_count"], 0)

    def test_dois_documentos_com_listas_separadas(self) -> None:
        doc1 = make_document(1, "lista-arq.pdf")
        doc2 = make_document(2, "lista-est.pdf")
        texts = {
            1: {1: "LISTA DE DOCUMENTOS 01/01 117_25_ARQ_001_A PLANTA BAIXA"},
            2: {1: "LISTA DE DOCUMENTOS 01/01 117_25_EST_001_A FUNDACOES"},
        }

        result = build_drawing_lists([doc1, doc2], texts)

        self.assertEqual(result["stats"]["document_count"], 2)
        self.assertEqual(result["stats"]["row_count"], 2)


class DrawingListAlertsMultipleTests(unittest.TestCase):
    """Cenarios com multiplos alertas simultaneos."""

    def test_linha_sem_match_e_com_codigo_diferente(self) -> None:
        doc = make_document(1)
        texts = {
            1: {
                1: (
                    "LISTA DE DOCUMENTOS "
                    "01/03 117_25_ARQ_001_A PLANTA BAIXA "
                    "02/03 117_25_ARQ_002_A CORTE A-A "
                    # Linha 3: codigo diferente E sem correspondencia no pacote
                    "03/03 999_01_ARQ_001_A DETALHE ESPECIAL"
                ),
                2: "01/03 117_25_ARQ_001_A PLANTA BAIXA",
                3: "02/03 117_25_ARQ_002_A CORTE A-A",
                # Nota: 999_01_ARQ_001_A NAO aparece em nenhuma pagina de conteudo
            }
        }

        result = build_drawing_lists([doc], texts)

        tipos = {a["type"] for a in result["alerts"]}
        self.assertIn("ld_project_code_mismatch", tipos)
        self.assertIn("ld_row_without_clear_match", tipos)


if __name__ == "__main__":
    unittest.main()
