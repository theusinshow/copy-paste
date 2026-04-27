"""
Testes para todas as regras MVP (app/rules/mvp_rules.py).

Cobre os tipos de issue:
  - campo_obrigatorio_ausente
  - nome_obra_divergente
  - numero_projeto_divergente
  - bairro_divergente
  - endereco_diferente_do_esperado
  - numero_projeto_diferente_do_esperado
  - nome_obra_diferente_do_esperado
"""

import unittest

from app.rules.engine import evaluate_rules
from app.rules.types import RuleExtractedField, RuleInputDocument

DOC_A = RuleInputDocument(id=1)
DOC_B = RuleInputDocument(id=2)
BBOX = {"x0": 0.0, "top": 0.0, "x1": 100.0, "bottom": 10.0}


def make_field(
    field_id: int,
    doc_id: int,
    field_name: str,
    value: str,
    page: int = 1,
) -> RuleExtractedField:
    return RuleExtractedField(
        id=field_id,
        input_document_id=doc_id,
        field_name=field_name,
        raw_value=value,
        normalized_value=value.upper(),
        page=page,
        bbox=BBOX,
    )


class CampoObrigatorioAusenteTests(unittest.TestCase):
    """campo_obrigatorio_ausente: campo presente em doc A mas ausente em doc B."""

    def test_nome_obra_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS EXEMPLO - PORTE 1"),
            # DOC_B nao tem nome_obra
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_numero_projeto_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
            # DOC_B nao tem numero_projeto
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_endereco_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "endereco", "RUA DAS FLORES 120"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_bairro_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "bairro", "CENTRO"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_municipio_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "municipio", "CRICIUMA"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_orgao_cliente_ausente_em_um_documento(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "orgao_cliente", "PREFEITURA MUNICIPAL DE CRICIUMA"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("campo_obrigatorio_ausente", types)

    def test_sem_issue_quando_campo_presente_em_todos(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS EXEMPLO"),
            make_field(2, DOC_B.id, "nome_obra", "UBS EXEMPLO"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertNotIn("campo_obrigatorio_ausente", types)

    def test_sem_issue_quando_campo_ausente_em_todos(self) -> None:
        # Se nenhum documento tem o campo, nao e uma divergencia de ausencia
        fields: list[RuleExtractedField] = []
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertNotIn("campo_obrigatorio_ausente", types)


class NomeObraDivergenteTests(unittest.TestCase):
    """nome_obra_divergente: valores distintos entre documentos."""

    def test_nomes_divergentes_entre_dois_documentos(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS NOVA ESPERANCA - PORTE 1"),
            make_field(2, DOC_B.id, "nome_obra", "UBS CENTRO HISTORICO - PORTE 2"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("nome_obra_divergente", types)

    def test_nomes_identicos_nao_geram_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS NOVA ESPERANCA"),
            make_field(2, DOC_B.id, "nome_obra", "UBS NOVA ESPERANCA"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertNotIn("nome_obra_divergente", types)

    def test_nome_unico_nao_gera_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS NOVA ESPERANCA"),
        ]
        issues = evaluate_rules([DOC_A], fields)
        types = [i.type for i in issues]
        self.assertNotIn("nome_obra_divergente", types)

    def test_evidencias_incluem_todos_os_documentos(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS NOVA ESPERANCA"),
            make_field(2, DOC_B.id, "nome_obra", "UBS CENTRO HISTORICO"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        divergente = next(i for i in issues if i.type == "nome_obra_divergente")
        self.assertEqual(len(divergente.evidences), 2)


class NumeroProjeto_DivergenteTests(unittest.TestCase):
    """numero_projeto_divergente: codigos distintos entre documentos."""

    def test_codigos_distintos_geram_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
            make_field(2, DOC_B.id, "numero_projeto", "118-25"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("numero_projeto_divergente", types)

    def test_codigos_identicos_nao_geram_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
            make_field(2, DOC_B.id, "numero_projeto", "117-25"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertNotIn("numero_projeto_divergente", types)

    def test_tres_documentos_com_dois_codigos_diferentes(self) -> None:
        DOC_C = RuleInputDocument(id=3)
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
            make_field(2, DOC_B.id, "numero_projeto", "117-25"),
            make_field(3, DOC_C.id, "numero_projeto", "999-01"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B, DOC_C], fields)
        types = [i.type for i in issues]
        self.assertIn("numero_projeto_divergente", types)


class BairroDivergenteTests(unittest.TestCase):
    """bairro_divergente: bairros distintos apos normalizacao."""

    def test_bairros_distintos_geram_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "bairro", "CENTRO"),
            make_field(2, DOC_B.id, "bairro", "NOVA ESPERANCA"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertIn("bairro_divergente", types)

    def test_bairros_com_parentese_normalizados_iguais_nao_geram_issue(self) -> None:
        # "CENTRO (SC)" e "CENTRO" devem ser iguais apos normalizacao de bairro
        fields = [
            make_field(1, DOC_A.id, "bairro", "CENTRO (SC)"),
            make_field(2, DOC_B.id, "bairro", "CENTRO"),
        ]
        issues = evaluate_rules([DOC_A, DOC_B], fields)
        types = [i.type for i in issues]
        self.assertNotIn("bairro_divergente", types)


class VerificacaoPontualTests(unittest.TestCase):
    """
    {field}_diferente_do_esperado: valores extraidos divergem do esperado no config.
    Modos: check_address, check_project_number, check_work_name.
    """

    def test_endereco_diferente_do_esperado(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "endereco", "RUA ANTIGA 200"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="check_address",
            config={"expected": "RUA NOVA 100"},
        )
        types = [i.type for i in issues]
        self.assertIn("endereco_diferente_do_esperado", types)

    def test_endereco_igual_ao_esperado_nao_gera_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "endereco", "RUA DAS FLORES 120"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="check_address",
            config={"expected": "RUA DAS FLORES 120"},
        )
        types = [i.type for i in issues]
        self.assertNotIn("endereco_diferente_do_esperado", types)

    def test_numero_projeto_diferente_do_esperado(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
            make_field(2, DOC_B.id, "numero_projeto", "117-25"),
        ]
        issues = evaluate_rules(
            [DOC_A, DOC_B],
            fields,
            analysis_mode="check_project_number",
            config={"expected": "999-01"},
        )
        types = [i.type for i in issues]
        self.assertIn("numero_projeto_diferente_do_esperado", types)

    def test_numero_projeto_igual_ao_esperado_nao_gera_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "numero_projeto", "117-25"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="check_project_number",
            config={"expected": "117-25"},
        )
        types = [i.type for i in issues]
        self.assertNotIn("numero_projeto_diferente_do_esperado", types)

    def test_nome_obra_diferente_do_esperado(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "nome_obra", "UBS CENTRO"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="check_work_name",
            config={"expected": "UBS NOVA ESPERANCA"},
        )
        types = [i.type for i in issues]
        self.assertIn("nome_obra_diferente_do_esperado", types)

    def test_config_sem_expected_nao_gera_issue(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "endereco", "RUA QUALQUER 1"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="check_address",
            config={},
        )
        types = [i.type for i in issues]
        self.assertNotIn("endereco_diferente_do_esperado", types)

    def test_modo_full_check_nao_executa_verificacao_pontual(self) -> None:
        fields = [
            make_field(1, DOC_A.id, "endereco", "RUA ERRADA 99"),
        ]
        issues = evaluate_rules(
            [DOC_A],
            fields,
            analysis_mode="full_check",
            config={"expected": "RUA CERTA 1"},
        )
        types = [i.type for i in issues]
        self.assertNotIn("endereco_diferente_do_esperado", types)


if __name__ == "__main__":
    unittest.main()
