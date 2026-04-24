import re
from typing import Any

from app.models.input_document import InputDocument
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

    return {
        "contexts": contexts,
        "identity": package_summary["identity"],
        "mode": "structural_context",
        "provider_status": "not_configured",
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
