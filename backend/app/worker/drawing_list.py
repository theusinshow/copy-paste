import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from app.models.input_document import InputDocument

LD_TITLE_PATTERN = re.compile(r"\bLISTA\s+DE\s+DOCUMENTOS\b", re.IGNORECASE)
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
        rows = [
            {
                "description": row.description,
                "document_code": row.document_code,
                "item": row.item,
                "page": page_number,
                "source_text": row.source_text,
            }
            for page_number, page_text in sorted(page_texts.items())
            if _is_ld_page(page_text)
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

    return {
        "lists": lists,
        "stats": {
            "document_count": len(lists),
            "row_count": sum(item["row_count"] for item in lists),
        },
    }


def _is_ld_page(page_text: str) -> bool:
    return bool(LD_TITLE_PATTERN.search(_normalize_text(page_text)))


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
    value = value.strip(" |:-")
    return value[:180].strip()


def _clean_source_text(value: str) -> str:
    return value.strip(" |")[:260]


def _normalize_project_code(value: str) -> str:
    return value.replace("_", "-")


def _extract_project_code(document_code: str) -> str | None:
    match = DOCUMENT_PROJECT_CODE_PATTERN.search(document_code)
    return match.group("project_code") if match else None


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
