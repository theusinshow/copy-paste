import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from app.models.input_document import InputDocument
from app.worker.document_sections import build_document_sections, find_scope_id, is_ld_page

LD_ROW_START_PATTERN = re.compile(
    r"(?P<item>\d{2}/\d{2})\s+(?P<document_code>\d{2,4}[_-]\d{2}_[A-Z0-9_]+)",
    re.IGNORECASE,
)
DOCUMENT_PROJECT_CODE_PATTERN = re.compile(r"^(?P<project_code>\d{2,4}[_-]\d{2})")
WHITESPACE_PATTERN = re.compile(r"\s+")


@dataclass(frozen=True)
class _ParsedLdRow:
    description: str
    document_code: str
    item: str
    source_text: str


def build_drawing_lists(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    lists: list[dict[str, Any]] = []

    for document in documents:
        page_texts = page_texts_by_document_id.get(document.id, {})
        sections = build_document_sections(page_texts)
        rows = [
            {
                "description": row.description,
                "document_code": row.document_code,
                "item": row.item,
                "page": page_number,
                "scope_id": find_scope_id(page_number, sections),
                "source_text": row.source_text,
            }
            for page_number, page_text in sorted(page_texts.items())
            if is_ld_page(page_text)
            for row in _extract_ld_rows(page_text)
        ]
        if not rows:
            continue

        lists.append(
            {
                "document_id": document.id,
                "filename": document.original_filename,
                "project_codes": sorted(
                    {
                        _normalize_project_code(code)
                        for row in rows
                        if (code := _extract_project_code(row["document_code"]))
                    }
                ),
                "row_count": len(rows),
                "rows": rows,
                "tipo": document.tipo,
            }
        )

    alerts = _build_alerts(lists, page_texts_by_document_id)

    return {
        "alerts": alerts,
        "lists": lists,
        "stats": {
            "alert_count": len(alerts),
            "document_count": len(lists),
            "row_count": sum(item["row_count"] for item in lists),
        },
    }


def _extract_ld_rows(page_text: str) -> list[_ParsedLdRow]:
    text = _normalize_text(page_text)
    matches = list(LD_ROW_START_PATTERN.finditer(text))
    rows: list[_ParsedLdRow] = []

    for index, match in enumerate(matches):
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        source_text = _clean_source_text(text[match.start() : next_start])
        description = _clean_description(text[match.end() : next_start])
        if not description:
            description = "Sem descricao detectada"

        rows.append(
            _ParsedLdRow(
                description=description,
                document_code=match.group("document_code"),
                item=match.group("item"),
                source_text=source_text,
            )
        )

    return rows


def _clean_description(value: str) -> str:
    value = re.sub(r"\b[A-Z]\b\s*$", "", value)
    value = re.sub(r"\bREV(?:ISAO)?\b.*$", "", value)
    value = re.sub(r"\bEMISSAO\b.*$", "", value)
    value = re.sub(r"\bPREFEITURA\b.*$", "", value)
    value = re.sub(r"\bGOVERNO\b.*$", "", value)
    value = re.sub(r"\bP:\\.*$", "", value)
    value = value.strip(" |:-")
    return value[:180].strip()


def _clean_source_text(value: str) -> str:
    return value.strip(" |")[:260]


def _normalize_project_code(value: str) -> str:
    return value.replace("_", "-")


def _extract_project_code(document_code: str) -> str | None:
    match = DOCUMENT_PROJECT_CODE_PATTERN.search(document_code)
    return match.group("project_code") if match else None


def _build_alerts(
    lists: list[dict[str, Any]],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> list[dict[str, Any]]:
    rows = [row for item in lists for row in item["rows"]]
    main_project_code = _most_common_project_code(rows)
    package_index = _build_package_index(page_texts_by_document_id)
    alerts: list[dict[str, Any]] = []

    for item in lists:
        for row in item["rows"]:
            row_project_code = _extract_project_code(row["document_code"])
            normalized_row_project_code = (
                _normalize_project_code(row_project_code) if row_project_code else None
            )
            if (
                main_project_code
                and normalized_row_project_code
                and normalized_row_project_code != main_project_code
            ):
                alerts.append(
                    _build_alert(
                        filename=item["filename"],
                        message=(
                            f"Item {row['item']} declara projeto "
                            f"{normalized_row_project_code}, diferente do projeto "
                            f"predominante nas LDs ({main_project_code})."
                        ),
                        row=row,
                        severity="atencao",
                        type_="ld_project_code_mismatch",
                    )
                )

            if not _document_code_exists_in_package(
                document_code=row["document_code"],
                package_index=package_index,
                document_id=item["document_id"],
                scope_id=row.get("scope_id"),
            ):
                alerts.append(
                    _build_alert(
                        filename=item["filename"],
                        message=(
                            f"Item {row['item']} ({row['document_code']}) nao teve "
                            "correspondencia textual clara em nenhuma pagina do pacote."
                        ),
                        row=row,
                        severity="atencao",
                        type_="ld_row_without_clear_match",
                    )
                )

    return alerts


def _build_alert(
    filename: str,
    message: str,
    row: dict[str, Any],
    severity: str,
    type_: str,
) -> dict[str, Any]:
    return {
        "description": row["description"],
        "document_code": row["document_code"],
        "filename": filename,
        "item": row["item"],
        "message": message,
        "page": row["page"],
        "severity": severity,
        "source_text": row["source_text"],
        "type": type_,
    }


def _most_common_project_code(rows: list[dict[str, Any]]) -> str | None:
    counts: dict[str, int] = {}
    for row in rows:
        project_code = _extract_project_code(row["document_code"])
        if not project_code:
            continue
        normalized_project_code = _normalize_project_code(project_code)
        counts[normalized_project_code] = counts.get(normalized_project_code, 0) + 1

    if not counts:
        return None
    return max(counts.items(), key=lambda item: item[1])[0]


def _build_package_index(
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[tuple[int, int | None], list[str]]:
    tokens: dict[tuple[int, int | None], list[str]] = {}
    for document_id, page_texts in page_texts_by_document_id.items():
        sections = build_document_sections(page_texts)
        for page_number, page_text in page_texts.items():
            if is_ld_page(page_text):
                continue
            scope_id = find_scope_id(page_number, sections)
            normalized_text = _normalize_text(page_text)
            tokens.setdefault((document_id, scope_id), []).append(normalized_text)
            tokens.setdefault((document_id, scope_id), []).append(
                normalized_text.replace("-", "_")
            )
    return tokens


def _document_code_exists_in_package(
    document_code: str,
    package_index: dict[tuple[int, int | None], list[str]],
    document_id: int,
    scope_id: int | None,
) -> bool:
    normalized_code = _normalize_text(document_code).replace("-", "_")
    scoped_pages = package_index.get((document_id, scope_id), [])
    if any(normalized_code in page_text for page_text in scoped_pages):
        return True
    return any(
        normalized_code in page_text
        for (indexed_document_id, _), page_texts in package_index.items()
        if indexed_document_id != document_id
        for page_text in page_texts
    )


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
