import json
import re

from app.models.input_document import InputDocument
from app.rules.types import RuleIssueCandidate
from app.worker.groq_client import call_groq, is_groq_configured

DOCUMENT_CHAR_LIMIT = 6000
AI_ISSUE_MAX_TOKENS = 2500
AI_ISSUE_TIMEOUT = 60

_TYPE_PATTERN = re.compile(r"[^a-z0-9_]")
_JSON_PATTERN = re.compile(r"\{.*\}", re.DOTALL)


def detect_issues_with_ai(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> list[RuleIssueCandidate]:
    if not is_groq_configured() or not documents:
        return []

    prompt = _build_prompt(documents, page_texts_by_document_id)

    try:
        response = call_groq(prompt, max_tokens=AI_ISSUE_MAX_TOKENS, timeout=AI_ISSUE_TIMEOUT)
        return _parse_issues(response)
    except Exception:
        return []


def _build_prompt(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> str:
    lines = [
        "Voce e um auditor tecnico especializado em documentacao de obras publicas municipais brasileiras.",
        "Analise os documentos abaixo e identifique TODOS os problemas tecnicos encontrados.",
        "",
        "## DOCUMENTOS DO PACOTE",
    ]

    for doc in documents:
        page_texts = page_texts_by_document_id.get(doc.id, {})
        full_text = " ".join(
            text for _, text in sorted(page_texts.items())
        )[:DOCUMENT_CHAR_LIMIT]
        if not full_text.strip():
            continue
        lines += [
            f"\n### {doc.original_filename}",
            full_text,
        ]

    lines += [
        "",
        "## O QUE VERIFICAR",
        "1. Consistencia de identidade entre todos os documentos: nome da obra, numero do projeto, endereco, bairro, municipio, cliente/orgao",
        "2. Sequencia e totalizacao de folhas (ex: folha 3/10) — verifique se a numeracao e consistente entre documentos",
        "3. Datas de emissao: se sao coerentes entre documentos, se nao sao futuras, se nao estao desatualizadas (mais de 2 anos)",
        "4. Completude do memorial descritivo: introducao, especificacoes tecnicas, responsavel tecnico, ART",
        "5. Consistencia entre memorial e pranchas: dados tecnicos, endereco, nome da obra devem coincidir",
        "6. Campos obrigatorios ausentes em qualquer documento",
        "7. Inconsistencias, contradicoes ou informacoes incompletas no texto",
        "8. Qualquer outro problema relevante para auditoria tecnica municipal",
        "",
        "## FORMATO DE RESPOSTA",
        "Responda APENAS com JSON valido, sem nenhum texto antes ou depois:",
        '{"issues": [{"type": "tipo_snake_case", "description": "Descricao clara do problema", "severity": "relevante", "document": "arquivo.pdf"}]}',
        "",
        "- severity: 'relevante' para problemas serios, 'atencao' para pontos de atencao",
        "- type: string snake_case descrevendo o tipo (ex: nome_obra_divergente, data_emissao_ausente)",
        "- description: descricao objetiva citando os valores encontrados quando possivel",
        "- document: nome do arquivo onde o problema foi encontrado, ou null se for entre multiplos documentos",
        'Se nao encontrar problemas, retorne: {"issues": []}',
    ]

    return "\n".join(lines)


def _parse_issues(response: str) -> list[RuleIssueCandidate]:
    match = _JSON_PATTERN.search(response)
    if not match:
        return []

    try:
        data = json.loads(match.group())
    except (json.JSONDecodeError, ValueError):
        return []

    raw_issues = data.get("issues", [])
    if not isinstance(raw_issues, list):
        return []

    candidates: list[RuleIssueCandidate] = []
    for issue in raw_issues:
        if not isinstance(issue, dict):
            continue
        description = str(issue.get("description", "")).strip()
        if not description:
            continue
        severity = issue.get("severity", "atencao")
        if severity not in ("relevante", "atencao"):
            severity = "atencao"
        raw_type = str(issue.get("type", "ai_issue")).lower()
        issue_type = "ai_" + _TYPE_PATTERN.sub("_", raw_type).strip("_")
        candidates.append(
            RuleIssueCandidate(
                type=issue_type,
                severity=severity,
                description=description,
                evidences=[],
            )
        )

    return candidates
