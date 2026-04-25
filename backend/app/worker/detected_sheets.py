import re
import unicodedata
from typing import Any

from app.models.input_document import InputDocument
from app.worker.document_sections import build_document_sections, find_scope_id, is_ld_page

SHEET_CODE_PATTERN = re.compile(
    r"\b(?P<sheet_code>\d{2,4}[_-]\d{2}_[A-Z0-9]{2,}_[A-Z0-9_]*?\d{2,4}_[A-Z])\b",
    re.IGNORECASE,
)
BASE_SHEET_CODE_PATTERN = re.compile(
    r"\b(?P<base_code>\d{2,4}[_-]\d{2}_[A-Z0-9]{2,}_[A-Z])\b",
    re.IGNORECASE,
)
CONTENT_LABEL_PATTERN = re.compile(r"\bCONTEUDO:\s+PRANCHA:\s+")
FULL_SHEET_ITEM_PATTERN = re.compile(r"\b\d{2}/\d{2}\b")
PARTIAL_SHEET_ITEM_PATTERN = re.compile(r"\b(?P<number>\d{2})/\s*")
SHEET_TOTAL_PATTERN = re.compile(r"\bARQUIVO:\s*(?P<total>\d{2})\b")
WHITESPACE_PATTERN = re.compile(r"\s+")
STAMP_DISCIPLINE_CODES = {
    "ARQ",
    "AUT",
    "DRE",
    "ELE",
    "EST",
    "FND",
    "HID",
    "INC",
    "MEC",
    "SAN",
    "TEL",
    "URB",
}
STAMP_NOISE_TOKENS = {
    *STAMP_DISCIPLINE_CODES,
    "ARQUIVO",
    "DATA",
    "DISC",
    "DISCIPLINA",
    "EMISSAO",
    "ESCALA",
    "RESP",
    "RESPONSAVEL",
    "REV",
    "REVISAO",
    "TECNICO",
}
STAMP_NOISE_TAIL_PATTERNS = (
    re.compile(r"\bDATA\b.*$"),
    re.compile(r"\bARQUIVO\s*:?\s*[A-Z0-9._/-]*\d[A-Z0-9._/-]*\b.*$"),
    re.compile(r"\bDISC(?:IPLINA)?\s*:?\s*[A-Z]{2,5}\b.*$"),
    re.compile(r"\bESCALA\s*:?\s*(?:\d+(?::\d+)?|S/E)\b.*$"),
    re.compile(r"\bEMISSAO\b.*$"),
    re.compile(r"\bREV(?:ISAO)?\s*:?\s*[A-Z0-9._/-]*\b.*$"),
    re.compile(r"\bRESP(?:ONSAVEL)?(?:\s+TECNICO)?\b.*$"),
)
STAMP_DISCIPLINE_SUFFIX_PATTERN = re.compile(
    rf"\b(?:{'|'.join(sorted(STAMP_DISCIPLINE_CODES))})\s+\d{{2}}/\d{{2}}\b.*$"
)


def build_detected_sheets(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    documents_with_sheets: list[dict[str, Any]] = []

    for document in documents:
        page_texts = page_texts_by_document_id.get(document.id, {})
        sections = build_document_sections(page_texts)
        sheets = [
            {
                **sheet,
                "scope_id": find_scope_id(page_number, sections),
            }
            for page_number, page_text in sorted(
                page_texts.items()
            )
            if not is_ld_page(page_text)
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
        item = _extract_item(evidence, sheet_code)
        description = _extract_stamp_description(
            evidence=evidence,
            code=sheet_code,
            item=item,
        )
        sheets.append(
            {
                "description": description,
                "item": item,
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
                "description": _extract_stamp_description(
                    evidence=evidence,
                    code=base_code,
                    item=item,
                ),
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


def _extract_stamp_description(
    evidence: str,
    code: str,
    item: str | None,
) -> str | None:
    before_code = evidence.split(code, 1)[0]
    discipline_code = _extract_discipline_code(code)
    description = (
        _extract_description_from_content_label(before_code, discipline_code, item)
        or _extract_description_before_sheet_marker(before_code, discipline_code)
        or _extract_description(evidence, code)
    )
    return _clean_stamp_description(description)


def _extract_description_from_content_label(
    before_code: str,
    discipline_code: str | None,
    item: str | None,
) -> str | None:
    matches = list(CONTENT_LABEL_PATTERN.finditer(before_code))
    if not matches:
        return None

    segment = before_code[matches[-1].end() :]
    if item:
        item_number = item.split("/", 1)[0]
        segment = re.sub(rf"\s+\d*\s*{re.escape(item_number)}/.*$", "", segment)
    if discipline_code:
        segment = re.sub(rf"\s+{re.escape(discipline_code)}\b.*$", "", segment)

    return segment


def _extract_description_before_sheet_marker(
    before_code: str,
    discipline_code: str | None,
) -> str | None:
    if not discipline_code:
        return None

    marker_matches = list(
        re.finditer(rf"\s+{re.escape(discipline_code)}\b.*?\d{{2}}/", before_code)
    )
    if not marker_matches:
        return None

    segment = before_code[: marker_matches[-1].start()]
    content_label_matches = list(CONTENT_LABEL_PATTERN.finditer(segment))
    if content_label_matches:
        segment = segment[content_label_matches[-1].end() :]
    else:
        segment = _keep_tail_words(segment, max_words=10)

    return segment


def _clean_stamp_description(description: str | None) -> str | None:
    if not description:
        return None

    description = re.sub(r"\bDIREITOS AUTORAIS\b.*$", "", description)
    description = re.sub(r"\bP:\\.*$", "", description)
    description = STAMP_DISCIPLINE_SUFFIX_PATTERN.sub("", description)
    for pattern in STAMP_NOISE_TAIL_PATTERNS:
        description = pattern.sub("", description)
    description = re.sub(r"^\d+\s+", "", description)
    description = re.sub(r"\s+\d+$", "", description)
    description = description.strip(" |:-")

    if not description or "DIREITOS AUTORAIS" in description:
        return None
    if not _has_meaningful_stamp_description(description):
        return None
    return description[:160]


def _extract_discipline_code(code: str) -> str | None:
    parts = code.replace("-", "_").split("_")
    return parts[2] if len(parts) >= 4 else None


def _keep_tail_words(value: str, max_words: int) -> str:
    words = value.strip(" |:-").split()
    return " ".join(words[-max_words:])


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


def _has_meaningful_stamp_description(description: str) -> bool:
    tokens = re.findall(r"[A-Z0-9]+", description)
    meaningful_tokens = [
        token
        for token in tokens
        if len(token) > 2 and not token.isdigit() and token not in STAMP_NOISE_TOKENS
    ]
    return len(meaningful_tokens) > 0


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
