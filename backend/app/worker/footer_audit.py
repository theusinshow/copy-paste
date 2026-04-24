import re
import unicodedata
from collections import Counter
from typing import Any

from app.models.input_document import InputDocument
from app.worker.package_summary import build_package_summary

PROJECT_CODE_PATTERN = re.compile(r"\b\d{2,4}[-_]\d{2}\b")
WHITESPACE_PATTERN = re.compile(r"\s+")


def build_footer_audit(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
    footer_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    package_summary = build_package_summary(documents, page_texts_by_document_id)
    identity = package_summary["identity"]
    expected_project_code = identity.get("project_code")
    occurrences = [
        occurrence
        for document in documents
        for page_number, footer_text in sorted(
            footer_texts_by_document_id.get(document.id, {}).items()
        )
        for occurrence in _extract_footer_occurrences(document, page_number, footer_text)
    ]
    findings = _build_findings(occurrences, expected_project_code)

    return {
        "findings": findings,
        "identity": {
            "project_code": expected_project_code,
            "work_name": identity.get("work_name"),
        },
        "occurrences": occurrences,
        "stats": {
            "document_count": len(documents),
            "footer_page_count": sum(
                len(page_texts) for page_texts in footer_texts_by_document_id.values()
            ),
            "occurrence_count": len(occurrences),
            "probable_issue_count": sum(
                1 for finding in findings if finding["category"] == "probable_issue"
            ),
            "needs_review_count": sum(
                1 for finding in findings if finding["category"] == "needs_review"
            ),
        },
    }


def _extract_footer_occurrences(
    document: InputDocument,
    page_number: int,
    footer_text: str,
) -> list[dict[str, Any]]:
    normalized_footer = _normalize_text(footer_text)
    occurrences = []
    for match in PROJECT_CODE_PATTERN.finditer(normalized_footer):
        value = match.group(0).replace("_", "-")
        occurrences.append(
            {
                "document_id": document.id,
                "field": "project_code",
                "field_label": "Numero do projeto",
                "filename": document.original_filename,
                "normalized_value": _normalize_comparable(value),
                "page": page_number,
                "source_text": footer_text[:260],
                "value": value,
            }
        )
    return _dedupe_occurrences(occurrences)


def _build_findings(
    occurrences: list[dict[str, Any]],
    expected_project_code: str | None,
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    if expected_project_code:
        expected_normalized = _normalize_comparable(expected_project_code)
        for occurrence in occurrences:
            if occurrence["normalized_value"] != expected_normalized:
                findings.append(
                    {
                        "category": "probable_issue",
                        "field": "project_code",
                        "message": (
                            "Rodape com numero de projeto divergente. "
                            f"Esperado: {expected_project_code}. "
                            f"Encontrado: {occurrence['value']}."
                        ),
                        "occurrences": [occurrence],
                        "reason": "footer_project_code_differs_from_package_identity",
                        "severity": "relevante",
                    }
                )

    counts = Counter(
        occurrence["normalized_value"]
        for occurrence in occurrences
        if occurrence["normalized_value"]
    )
    if len(counts) > 1 and not findings:
        dominant_value = counts.most_common(1)[0][0]
        for occurrence in occurrences:
            if occurrence["normalized_value"] != dominant_value:
                findings.append(
                    {
                        "category": "needs_review",
                        "field": "project_code",
                        "message": (
                            "Mais de um numero de projeto foi encontrado em rodapes. "
                            f"Revisar ocorrencia: {occurrence['value']}."
                        ),
                        "occurrences": [occurrence],
                        "reason": "multiple_footer_project_codes_detected",
                        "severity": "atencao",
                    }
                )
    return findings


def _dedupe_occurrences(
    occurrences: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    seen: set[tuple[str, int, str]] = set()
    unique = []
    for occurrence in occurrences:
        key = (
            occurrence["filename"],
            occurrence["page"],
            occurrence["normalized_value"],
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(occurrence)
    return unique


def _normalize_comparable(value: str) -> str:
    return _normalize_text(value).replace("_", "-")


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
