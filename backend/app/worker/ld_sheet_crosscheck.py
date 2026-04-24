import re
import unicodedata
from typing import Any

from app.models.input_document import InputDocument
from app.worker.detected_sheets import build_detected_sheets
from app.worker.drawing_list import build_drawing_lists

WHITESPACE_PATTERN = re.compile(r"\s+")
MEANINGLESS_TOKENS = {
    "A",
    "AS",
    "COM",
    "DA",
    "DAS",
    "DE",
    "DO",
    "DOS",
    "E",
    "EM",
    "O",
    "OS",
    "PARA",
    "POR",
}


def build_ld_sheet_crosscheck(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    drawing_lists = build_drawing_lists(documents, page_texts_by_document_id)
    detected_sheets = build_detected_sheets(documents, page_texts_by_document_id)
    sheets_by_code = _index_sheets_by_code(detected_sheets)
    results: list[dict[str, Any]] = []

    for drawing_list in drawing_lists["lists"]:
        for row in drawing_list["rows"]:
            ld_code = _normalize_code(row["document_code"])
            matching_sheets = sheets_by_code.get(ld_code, [])
            results.append(
                _compare_ld_row_with_sheets(
                    ld_filename=drawing_list["filename"],
                    ld_row=row,
                    matching_sheets=matching_sheets,
                )
            )

    return {
        "results": results,
        "stats": {
            "attention_count": sum(
                1 for result in results if result["severity"] == "atencao"
            ),
            "ok_count": sum(1 for result in results if result["severity"] == "ok"),
            "relevant_count": sum(
                1 for result in results if result["severity"] == "relevante"
            ),
            "total_count": len(results),
        },
    }


def _index_sheets_by_code(detected_sheets: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for document in detected_sheets["documents"]:
        for sheet in document["sheets"]:
            enriched_sheet = {
                **sheet,
                "filename": document["filename"],
            }
            index.setdefault(_normalize_code(sheet["sheet_code"]), []).append(enriched_sheet)
    return index


def _compare_ld_row_with_sheets(
    ld_filename: str,
    ld_row: dict[str, Any],
    matching_sheets: list[dict[str, Any]],
) -> dict[str, Any]:
    base_result = {
        "ld_description": ld_row["description"],
        "ld_document_code": ld_row["document_code"],
        "ld_filename": ld_filename,
        "ld_item": ld_row["item"],
        "ld_page": ld_row["page"],
        "ld_source_text": ld_row["source_text"],
        "matched_sheet": None,
    }

    if not matching_sheets:
        return {
            **base_result,
            "message": (
                f"{ld_row['document_code']} esta declarado na LD, mas nao foi "
                "detectado em nenhuma prancha fora das paginas de LD."
            ),
            "severity": "atencao",
            "type": "ld_sheet_missing_sheet",
        }

    best_sheet = _select_best_sheet(ld_row, matching_sheets)
    matched_sheet = {
        "description": best_sheet.get("description"),
        "filename": best_sheet["filename"],
        "item": best_sheet.get("item"),
        "page": best_sheet["page"],
        "sheet_code": best_sheet["sheet_code"],
        "source_text": best_sheet["source_text"],
    }

    if best_sheet.get("item") and best_sheet["item"] != ld_row["item"]:
        return {
            **base_result,
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a folha da LD "
                f"({ld_row['item']}) diverge da prancha ({best_sheet['item']})."
            ),
            "severity": "relevante",
            "type": "ld_sheet_item_mismatch",
        }

    description_status = _compare_descriptions(
        ld_row["description"],
        best_sheet.get("description"),
    )
    if description_status == "different":
        return {
            **base_result,
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a descricao da LD "
                "parece diferente da descricao proxima na prancha."
            ),
            "severity": "atencao",
            "type": "ld_sheet_description_attention",
        }

    if description_status == "unknown":
        return {
            **base_result,
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a descricao da "
                "prancha nao foi detectada com confianca."
            ),
            "severity": "atencao",
            "type": "ld_sheet_description_unknown",
        }

    return {
        **base_result,
        "matched_sheet": matched_sheet,
        "message": f"{ld_row['document_code']} foi encontrado com folha e descricao compativeis.",
        "severity": "ok",
        "type": "ld_sheet_match",
    }


def _select_best_sheet(
    ld_row: dict[str, Any],
    matching_sheets: list[dict[str, Any]],
) -> dict[str, Any]:
    with_same_item = [
        sheet for sheet in matching_sheets if sheet.get("item") == ld_row["item"]
    ]
    if with_same_item:
        return with_same_item[0]
    return matching_sheets[0]


def _compare_descriptions(
    ld_description: str,
    sheet_description: str | None,
) -> str:
    ld_tokens = _meaningful_tokens(ld_description)
    sheet_tokens = _meaningful_tokens(sheet_description or "")

    if not ld_tokens or not sheet_tokens:
        return "unknown"

    if ld_tokens.issubset(sheet_tokens) or sheet_tokens.issubset(ld_tokens):
        return "compatible"

    overlap = len(ld_tokens & sheet_tokens)
    smaller_size = min(len(ld_tokens), len(sheet_tokens))
    if smaller_size and overlap / smaller_size >= 0.6:
        return "compatible"

    return "different"


def _meaningful_tokens(value: str) -> set[str]:
    normalized_value = _normalize_text(value)
    return {
        token
        for token in re.split(r"[^A-Z0-9]+", normalized_value)
        if len(token) > 2 and token not in MEANINGLESS_TOKENS
    }


def _normalize_code(value: str) -> str:
    return _normalize_text(value).replace("-", "_")


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
