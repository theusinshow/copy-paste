import re
import unicodedata
from typing import Any

from app.models.input_document import InputDocument

LD_TITLE_PATTERN = re.compile(r"\bLISTA\s+DE\s+DOCUMENTOS\b", re.IGNORECASE)
SHEET_CODE_PATTERN = re.compile(
    r"\b(?P<sheet_code>\d{2,4}[_-]\d{2}_[A-Z0-9]{2,}_[A-Z0-9_]*?\d{2,4}_[A-Z])\b",
    re.IGNORECASE,
)
BASE_SHEET_CODE_PATTERN = re.compile(
    r"\b(?P<base_code>\d{2,4}[_-]\d{2}_[A-Z0-9]{2,}_[A-Z])\b",
    re.IGNORECASE,
)
FULL_SHEET_ITEM_PATTERN = re.compile(r"\b\d{2}/\d{2}\b")
PARTIAL_SHEET_ITEM_PATTERN = re.compile(r"\b(?P<number>\d{2})/\s*")
SHEET_TOTAL_PATTERN = re.compile(r"\bARQUIVO:\s*(?P<total>\d{2})\b")
WHITESPACE_PATTERN = re.compile(r"\s+")


def build_detected_sheets(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    documents_with_sheets: list[dict[str, Any]] = []

    for document in documents:
        sheets = [
            sheet
            for page_number, page_text in sorted(
                page_texts_by_document_id.get(document.id, {}).items()
            )
            if not _is_ld_page(page_text)
            for sheet in _extract_sheets_from_page(page_number, page_text)
        ]
        if not sheets:
            continue

        documents_with_sheets.append(
            {
                "document_id": document.id,
                "filename": document.original_filename,
                "sheet_count": len(sheets),
                "sheets": sheets,
                "tipo": document.tipo,
            }
        )

    return {
        "documents": documents_with_sheets,
        "stats": {
            "document_count": len(documents_with_sheets),
            "sheet_count": sum(item["sheet_count"] for item in documents_with_sheets),
        },
    }


def _extract_sheets_from_page(page_number: int, page_text: str) -> list[dict[str, Any]]:
    text = _normalize_text(page_text)
    matches = list(SHEET_CODE_PATTERN.finditer(text))
    sheets: list[dict[str, Any]] = []
    seen_codes: set[str] = set()

    for match in matches:
        sheet_code = match.group("sheet_code")
        normalized_sheet_code = sheet_code.replace("-", "_")
        if normalized_sheet_code in seen_codes:
            continue
        seen_codes.add(normalized_sheet_code)

        evidence = _extract_evidence(text, match.start(), match.end())
        sheets.append(
            {
                "description": _extract_description(evidence, sheet_code),
                "item": _extract_item(evidence, sheet_code),
                "page": page_number,
                "sheet_code": normalized_sheet_code,
                "source_text": evidence,
            }
        )

    for match in BASE_SHEET_CODE_PATTERN.finditer(text):
        base_code = match.group("base_code")
        evidence = _extract_evidence(text, match.start(), match.end())
        item = _extract_item(evidence, base_code)
        sheet_code = _build_sheet_code_from_base(base_code, item)
        if not sheet_code or sheet_code in seen_codes:
            continue
        seen_codes.add(sheet_code)

        sheets.append(
            {
                "description": _extract_base_description(evidence, base_code),
                "item": item,
                "page": page_number,
                "sheet_code": sheet_code,
                "source_text": evidence,
            }
        )

    return sheets


def _extract_evidence(text: str, start: int, end: int) -> str:
    left = max(0, start - 220)
    right = min(len(text), end + 180)
    return text[left:right].strip(" |")


def _extract_description(evidence: str, sheet_code: str) -> str | None:
    after_code = evidence.split(sheet_code, 1)
    if len(after_code) < 2:
        before_code = evidence.split(sheet_code, 1)[0]
        match = re.search(r"\bCONTEUDO:\s+PRANCHA:\s+(.+?)\s+[A-Z]{2,5}\s+\d{2}/", before_code)
        return match.group(1).strip(" |:-") if match else None

    description = after_code[1]
    description = FULL_SHEET_ITEM_PATTERN.sub(" ", description)
    description = re.sub(r"\bREV(?:ISAO)?\b.*$", "", description)
    description = re.sub(r"\bEMISSAO\b.*$", "", description)
    description = re.sub(r"\bESCALA\b.*$", "", description)
    description = description.strip(" |:-")
    return description[:160].strip() or None


def _extract_base_description(evidence: str, base_code: str) -> str | None:
    before_code = evidence.split(base_code, 1)[0]
    content_match = re.search(r"\bCONTEUDO:\s+PRANCHA:\s+(.+?)\s+\d{2}/", before_code)
    if not content_match:
        description = _extract_description(evidence, base_code)
        if description and "DIREITOS AUTORAIS" in description:
            return None
        return description

    description = content_match.group(1)
    base_parts = base_code.replace("-", "_").split("_")
    discipline_code = base_parts[-2] if len(base_parts) >= 4 else None
    if discipline_code:
        description = re.sub(rf"\s+{re.escape(discipline_code)}\b.*$", "", description)
    description = re.sub(r"^\d+\s+", "", description)
    description = re.sub(r"\s+\d+$", "", description)
    return description.strip(" |:-") or None


def _extract_item(evidence: str, sheet_code: str) -> str | None:
    before_code = evidence.split(sheet_code, 1)[0]
    before_matches = FULL_SHEET_ITEM_PATTERN.findall(before_code)
    if before_matches:
        return before_matches[-1]

    partial_matches = list(PARTIAL_SHEET_ITEM_PATTERN.finditer(before_code))
    if partial_matches:
        number = partial_matches[-1].group("number")
        total_match = SHEET_TOTAL_PATTERN.search(before_code)
        if total_match:
            return f"{number}/{total_match.group('total')}"

    match = FULL_SHEET_ITEM_PATTERN.search(evidence)
    return match.group(0) if match else None


def _build_sheet_code_from_base(base_code: str, item: str | None) -> str | None:
    if not item:
        return None

    sheet_number = item.split("/", 1)[0]
    base_parts = base_code.replace("-", "_").split("_")
    if len(base_parts) < 4:
        return None

    return "_".join([*base_parts[:-1], sheet_number.zfill(3), base_parts[-1]]).upper()


def _is_ld_page(page_text: str) -> bool:
    return bool(LD_TITLE_PATTERN.search(_normalize_text(page_text)))


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
