import re
from typing import Any

from app.models.input_document import InputDocument
from app.worker.groq_client import GROQ_MODEL, call_groq, is_groq_configured
from app.worker.package_map import build_package_map
from app.worker.package_summary import build_package_summary

CONTEXT_TEXT_LIMIT = 900
MAX_CONTEXTS = 18
WHITESPACE_PATTERN = re.compile(r"\s+")


def build_ai_review(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    package_summary = build_package_summary(documents, page_texts_by_document_id)
    package_map = build_package_map(documents, page_texts_by_document_id)
    contexts = _build_contexts(documents, page_texts_by_document_id, package_map)
    suggestions = _build_structural_suggestions(package_summary, package_map, contexts)

    ai_narrative: str | None = None
    ai_model: str | None = None
    provider_status = "not_configured"

    if is_groq_configured():
        try:
            prompt = _build_groq_prompt(package_summary, suggestions, contexts)
            ai_narrative = call_groq(prompt)
            ai_model = GROQ_MODEL
            provider_status = "ok"
        except Exception:
            provider_status = "error"

    return {
        "ai_model": ai_model,
        "ai_narrative": ai_narrative,
        "contexts": contexts,
        "identity": package_summary["identity"],
        "mode": "groq_assisted" if provider_status == "ok" else "structural_context",
        "provider_status": provider_status,
        "summary": _build_summary(package_summary, package_map, contexts),
        "suggestions": suggestions,
        "stats": {
            "context_count": len(contexts),
            "needs_review_count": sum(
                1 for suggestion in suggestions if suggestion["category"] == "needs_review"
            ),
            "probable_issue_count": sum(
                1 for suggestion in suggestions if suggestion["category"] == "probable_issue"
            ),
            "suggestion_count": len(suggestions),
        },
    }


def _build_summary(
    package_summary: dict[str, Any],
    package_map: dict[str, Any],
    contexts: list[dict[str, Any]],
) -> str:
    identity = package_summary["identity"]
    pieces = [
        f"{package_summary['stats']['document_count']} documento(s)",
        f"{package_map['stats']['section_count']} secao(oes)",
        f"{len(contexts)} contexto(s) preparado(s)",
    ]
    if identity.get("work_name"):
        pieces.append(f"obra: {identity['work_name']}")
    if identity.get("project_code"):
        pieces.append(f"projeto: {identity['project_code']}")
    return "Leitura estrutural pronta para revisao assistida: " + "; ".join(pieces) + "."


def _build_contexts(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
    package_map: dict[str, Any],
) -> list[dict[str, Any]]:
    contexts: list[dict[str, Any]] = []

    for document in package_map["documents"]:
        source_document = _find_document(documents, document["document_id"])
        if source_document is None:
            continue

        page_texts = page_texts_by_document_id.get(source_document.id, {})
        first_page = min(page_texts.keys(), default=None)
        if first_page is not None:
            contexts.append(
                _build_context(
                    document=source_document,
                    kind="document_opening",
                    page_start=first_page,
                    page_end=first_page,
                    section_label=document["classification"],
                    title=f"Abertura - {source_document.original_filename}",
                    text=page_texts[first_page],
                )
            )

        for section in document["sections"]:
            context_text = _join_page_range(
                page_texts,
                section["start_page"],
                section["end_page"],
            )
            contexts.append(
                _build_context(
                    document=source_document,
                    kind="section",
                    page_start=section["start_page"],
                    page_end=section["end_page"],
                    section_label=section["section_label"],
                    title=section["title"],
                    text=context_text,
                )
            )

        if len(contexts) >= MAX_CONTEXTS:
            break

    return contexts[:MAX_CONTEXTS]


def _build_context(
    document: InputDocument,
    kind: str,
    page_start: int,
    page_end: int,
    section_label: str,
    title: str,
    text: str,
) -> dict[str, Any]:
    evidence = _clean_text(text)[:CONTEXT_TEXT_LIMIT]
    return {
        "document_id": document.id,
        "evidence_text": evidence,
        "filename": document.original_filename,
        "kind": kind,
        "page_end": page_end,
        "page_start": page_start,
        "section_label": section_label,
        "title": title,
    }


def _build_structural_suggestions(
    package_summary: dict[str, Any],
    package_map: dict[str, Any],
    contexts: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []

    for alert in package_summary["alerts"]:
        suggestions.append(
            {
                "category": "needs_review",
                "message": alert["message"],
                "reason": "package_summary_alert",
                "severity": alert["severity"],
                "source": "package_summary",
            }
        )

    unknown_sections = [
        section
        for document in package_map["documents"]
        for section in document["sections"]
        if section["section_type"] == "desconhecido"
        and (section["sheet_count"] > 0 or section["ld_row_count"] > 0)
    ]
    if unknown_sections:
        suggestions.append(
            {
                "category": "needs_review",
                "message": (
                    "Existem secoes com LD ou pranchas que ainda nao foram "
                    "classificadas por disciplina."
                ),
                "reason": "unclassified_sections_with_content",
                "severity": "atencao",
                "source": "package_map",
            }
        )

    if not contexts:
        suggestions.append(
            {
                "category": "extraction_limit",
                "message": "Nenhum contexto textual foi preparado para leitura assistida.",
                "reason": "no_ai_review_context_available",
                "severity": "atencao",
                "source": "text_extraction",
            }
        )

    return suggestions


def _join_page_range(
    page_texts: dict[int, str],
    page_start: int,
    page_end: int,
) -> str:
    return " ".join(
        page_text
        for page_number, page_text in sorted(page_texts.items())
        if page_start <= page_number <= page_end
    )


def _find_document(
    documents: list[InputDocument],
    document_id: int,
) -> InputDocument | None:
    for document in documents:
        if document.id == document_id:
            return document
    return None


def _clean_text(value: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _build_groq_prompt(
    package_summary: dict[str, Any],
    suggestions: list[dict[str, Any]],
    contexts: list[dict[str, Any]],
) -> str:
    identity = package_summary["identity"]

    lines: list[str] = [
        "Voce e um auditor tecnico especializado em documentacao de obras publicas municipais.",
        "Analise o pacote de documentos abaixo e os problemas ja detectados automaticamente.",
        "",
        "## IDENTIDADE DO PACOTE",
    ]
    if identity.get("project_code"):
        lines.append(f"- Codigo do projeto: {identity['project_code']}")
    if identity.get("municipality"):
        lines.append(f"- Municipio: {identity['municipality']}")
    if identity.get("work_name"):
        lines.append(f"- Obra: {identity['work_name']}")
    if identity.get("bairro"):
        lines.append(f"- Bairro: {identity['bairro']}")
    if identity.get("client"):
        lines.append(f"- Cliente/Orgao: {identity['client']}")

    if suggestions:
        lines += ["", "## PROBLEMAS DETECTADOS PELO SISTEMA"]
        for i, s in enumerate(suggestions, 1):
            severity = s.get("severity", "")
            lines.append(f"{i}. [{severity.upper()}] {s['message']}")

    if contexts:
        lines += ["", "## TRECHOS DOS DOCUMENTOS"]
        for ctx in contexts[:8]:
            lines.append(f"\n### {ctx['title']} (p.{ctx['page_start']})")
            lines.append(ctx["evidence_text"])

    lines += [
        "",
        "## SUA ANALISE",
        "Responda em portugues, de forma direta e tecnica, em ate 5 paragrafos curtos:",
        "1. Resumo executivo do pacote (1 paragrafo)",
        "2. Avaliacao dos problemas detectados — algum esta subestimado ou superestimado?",
        "3. Problemas que o sistema pode ter perdido com base nos trechos apresentados",
        "4. Proximo passo mais importante para o auditor",
    ]

    return "\n".join(lines)
