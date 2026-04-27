import re
import unicodedata
from typing import Any

from app.models.input_document import InputDocument
from app.worker.detected_sheets import build_detected_sheets
from app.worker.drawing_list import build_drawing_lists

WHITESPACE_PATTERN = re.compile(r"\s+")
MEANINGLESS_TOKENS = {
    "A",
    "ARQ",
    "ARQUIVO",
    "AS",
    "COM",
    "DATA",
    "DA",
    "DAS",
    "DE",
    "DISC",
    "DISCIPLINA",
    "DRE",
    "DO",
    "DOS",
    "ELE",
    "EMISSAO",
    "E",
    "EM",
    "ESCALA",
    "EST",
    "FND",
    "HID",
    "INC",
    "MEC",
    "O",
    "OS",
    "PARA",
    "POR",
    "RESP",
    "RESPONSAVEL",
    "REV",
    "REVISAO",
    "SAN",
    "TEL",
    "TECNICO",
    "URB",
}


def build_ld_sheet_crosscheck(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    drawing_lists = build_drawing_lists(documents, page_texts_by_document_id)
    if not any(drawing_list["rows"] for drawing_list in drawing_lists["lists"]):
        return {
            "results": [],
            "reverse_results": [],
            "stats": _empty_stats(),
        }

    detected_sheets = build_detected_sheets(documents, page_texts_by_document_id)
    sheets_by_code = _index_sheets_by_code(detected_sheets)
    rows_by_code = _index_ld_rows_by_code(drawing_lists)
    results: list[dict[str, Any]] = []
    reverse_results: list[dict[str, Any]] = []

    for drawing_list in drawing_lists["lists"]:
        for row in drawing_list["rows"]:
            ld_code = _normalize_code(row["document_code"])
            matching_sheets = sheets_by_code.get(ld_code, [])
            results.append(
                _compare_ld_row_with_sheets(
                    ld_document_id=drawing_list["document_id"],
                    ld_filename=drawing_list["filename"],
                    ld_row=row,
                    matching_sheets=matching_sheets,
                )
            )

    for document in detected_sheets["documents"]:
        for sheet in document["sheets"]:
            sheet_code = _normalize_code(sheet["sheet_code"])
            matching_rows = rows_by_code.get(sheet_code, [])
            reverse_result = _compare_sheet_with_ld_rows(
                sheet_document_id=document["document_id"],
                sheet_filename=document["filename"],
                sheet=sheet,
                matching_ld_rows=matching_rows,
            )
            if reverse_result is not None:
                reverse_results.append(reverse_result)

    forward_probable_issue_count = sum(
        1 for result in results if result["category"] == "probable_issue"
    )
    forward_needs_review_count = sum(
        1 for result in results if result["category"] == "needs_review"
    )
    forward_extraction_limit_count = sum(
        1 for result in results if result["category"] == "extraction_limit"
    )
    reverse_probable_issue_count = sum(
        1 for result in reverse_results if result["category"] == "probable_issue"
    )
    reverse_needs_review_count = sum(
        1 for result in reverse_results if result["category"] == "needs_review"
    )
    reverse_extraction_limit_count = sum(
        1 for result in reverse_results if result["category"] == "extraction_limit"
    )

    return {
        "results": results,
        "reverse_results": reverse_results,
        "stats": {
            "attention_count": sum(
                1 for result in results if result["severity"] == "atencao"
            ),
            "compatible_count": sum(
                1 for result in results if result["category"] == "compatible"
            ),
            "combined_extraction_limit_count": (
                forward_extraction_limit_count + reverse_extraction_limit_count
            ),
            "combined_needs_review_count": (
                forward_needs_review_count + reverse_needs_review_count
            ),
            "combined_probable_issue_count": (
                forward_probable_issue_count + reverse_probable_issue_count
            ),
            "extraction_limit_count": forward_extraction_limit_count,
            "needs_review_count": forward_needs_review_count,
            "ok_count": sum(1 for result in results if result["severity"] == "ok"),
            "probable_issue_count": forward_probable_issue_count,
            "relevant_count": sum(
                1 for result in results if result["severity"] == "relevante"
            ),
            "reverse_extraction_limit_count": reverse_extraction_limit_count,
            "reverse_needs_review_count": reverse_needs_review_count,
            "reverse_other_document_count": sum(
                1
                for result in reverse_results
                if result["reason"] == "detected_sheet_declared_in_other_document"
            ),
            "reverse_other_section_count": sum(
                1
                for result in reverse_results
                if result["reason"] == "detected_sheet_declared_in_other_section"
            ),
            "reverse_probable_issue_count": reverse_probable_issue_count,
            "reverse_total_count": len(reverse_results),
            "total_count": len(results),
            "undeclared_sheet_count": sum(
                1
                for result in reverse_results
                if result["reason"] == "detected_sheet_missing_from_ld"
            ),
        },
    }


def _empty_stats() -> dict[str, int]:
    return {
        "attention_count": 0,
        "compatible_count": 0,
        "combined_extraction_limit_count": 0,
        "combined_needs_review_count": 0,
        "combined_probable_issue_count": 0,
        "extraction_limit_count": 0,
        "needs_review_count": 0,
        "ok_count": 0,
        "probable_issue_count": 0,
        "relevant_count": 0,
        "reverse_extraction_limit_count": 0,
        "reverse_needs_review_count": 0,
        "reverse_other_document_count": 0,
        "reverse_other_section_count": 0,
        "reverse_probable_issue_count": 0,
        "reverse_total_count": 0,
        "total_count": 0,
        "undeclared_sheet_count": 0,
    }


def _index_sheets_by_code(detected_sheets: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for document in detected_sheets["documents"]:
        for sheet in document["sheets"]:
            enriched_sheet = {
                **sheet,
                "document_id": document["document_id"],
                "filename": document["filename"],
            }
            index.setdefault(_normalize_code(sheet["sheet_code"]), []).append(enriched_sheet)
    return index


def _index_ld_rows_by_code(drawing_lists: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    index: dict[str, list[dict[str, Any]]] = {}
    for drawing_list in drawing_lists["lists"]:
        for row in drawing_list["rows"]:
            enriched_row = {
                **row,
                "document_id": drawing_list["document_id"],
                "filename": drawing_list["filename"],
            }
            index.setdefault(_normalize_code(row["document_code"]), []).append(enriched_row)
    return index


def _compare_ld_row_with_sheets(
    ld_document_id: int,
    ld_filename: str,
    ld_row: dict[str, Any],
    matching_sheets: list[dict[str, Any]],
) -> dict[str, Any]:
    ld_scope_id = ld_row.get("scope_id")
    base_result = {
        "ld_description": ld_row["description"],
        "ld_document_code": ld_row["document_code"],
        "ld_filename": ld_filename,
        "ld_item": ld_row["item"],
        "ld_page": ld_row["page"],
        "ld_scope_id": ld_scope_id,
        "ld_source_text": ld_row["source_text"],
        "matched_sheet": None,
    }

    scoped_matching_sheets = _filter_scope_candidates(
        ld_document_id=ld_document_id,
        ld_row=ld_row,
        matching_sheets=matching_sheets,
    )
    if not scoped_matching_sheets:
        out_of_scope_sheet = _select_out_of_scope_sheet(
            ld_document_id=ld_document_id,
            ld_row=ld_row,
            matching_sheets=matching_sheets,
        )
        if out_of_scope_sheet:
            matched_sheet = _build_matched_sheet(out_of_scope_sheet)
            if out_of_scope_sheet.get("document_id") == ld_document_id:
                return {
                    **base_result,
                    "category": "probable_issue",
                    "matched_sheet": matched_sheet,
                    "message": (
                        f"{ld_row['document_code']} esta declarado na LD da secao "
                        f"{ld_scope_id}, mas foi encontrado em outra secao do mesmo PDF "
                        f"(pagina {out_of_scope_sheet['page']})."
                    ),
                    "reason": "sheet_code_found_outside_ld_section",
                    "severity": "relevante",
                    "type": "ld_sheet_outside_section",
                }

            return {
                **base_result,
                "category": "needs_review",
                "matched_sheet": matched_sheet,
                "message": (
                    f"{ld_row['document_code']} nao foi confirmado na secao da LD, "
                    "mas apareceu em outro documento do pacote."
                ),
                "reason": "sheet_code_found_in_other_document_context",
                "severity": "atencao",
                "type": "ld_sheet_other_document_context",
            }

        return {
            **base_result,
            "category": "extraction_limit",
            "message": (
                f"{ld_row['document_code']} esta declarado na LD, mas nao foi "
                "confirmado em nenhuma prancha dentro da mesma secao do mapa do pacote."
            ),
            "reason": "sheet_code_not_detected_in_ld_section",
            "severity": "atencao",
            "type": "ld_sheet_missing_sheet",
        }

    best_sheet = _select_best_sheet(scoped_matching_sheets, ld_row)
    matched_sheet = _build_matched_sheet(best_sheet)

    if best_sheet.get("item") and best_sheet["item"] != ld_row["item"]:
        return {
            **base_result,
            "category": "probable_issue",
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a folha da LD "
                f"({ld_row['item']}) diverge da prancha ({best_sheet['item']})."
            ),
            "reason": "sheet_item_mismatch",
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
            "category": "needs_review",
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a descricao da LD "
                "parece diferente da descricao proxima na prancha."
            ),
            "reason": "description_mismatch",
            "severity": "atencao",
            "type": "ld_sheet_description_attention",
        }

    if description_status == "unknown":
        return {
            **base_result,
            "category": "extraction_limit",
            "matched_sheet": matched_sheet,
            "message": (
                f"{ld_row['document_code']} foi encontrado, mas a descricao da "
                "prancha nao foi detectada com confianca."
            ),
            "reason": "sheet_description_low_confidence",
            "severity": "atencao",
            "type": "ld_sheet_description_unknown",
        }

    return {
        **base_result,
        "category": "compatible",
        "matched_sheet": matched_sheet,
        "message": f"{ld_row['document_code']} foi encontrado com folha e descricao compativeis.",
        "reason": "matched_code_item_and_description",
        "severity": "ok",
        "type": "ld_sheet_match",
    }


def _select_best_sheet(
    matching_sheets: list[dict[str, Any]],
    ld_row: dict[str, Any],
) -> dict[str, Any]:
    with_same_item = [
        sheet for sheet in matching_sheets if sheet.get("item") == ld_row["item"]
    ]
    if with_same_item:
        return with_same_item[0]
    return matching_sheets[0]


def _filter_scope_candidates(
    ld_document_id: int,
    ld_row: dict[str, Any],
    matching_sheets: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    same_document_sheets = [
        sheet for sheet in matching_sheets if sheet.get("document_id") == ld_document_id
    ]
    if not same_document_sheets:
        return matching_sheets

    ld_scope_id = ld_row.get("scope_id")
    if not ld_scope_id:
        return same_document_sheets

    return [
        sheet
        for sheet in same_document_sheets
        if sheet.get("scope_id") == ld_scope_id
    ]


def _select_out_of_scope_sheet(
    ld_document_id: int,
    ld_row: dict[str, Any],
    matching_sheets: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not matching_sheets:
        return None

    ld_scope_id = ld_row.get("scope_id")
    same_document_other_scope = [
        sheet
        for sheet in matching_sheets
        if sheet.get("document_id") == ld_document_id
        and sheet.get("scope_id") != ld_scope_id
    ]
    if same_document_other_scope:
        return _select_best_sheet(same_document_other_scope, ld_row)

    other_document_sheets = [
        sheet for sheet in matching_sheets if sheet.get("document_id") != ld_document_id
    ]
    if other_document_sheets:
        return _select_best_sheet(other_document_sheets, ld_row)

    return None


def _build_matched_sheet(sheet: dict[str, Any]) -> dict[str, Any]:
    return {
        "description": sheet.get("description"),
        "filename": sheet["filename"],
        "item": sheet.get("item"),
        "page": sheet["page"],
        "scope_id": sheet.get("scope_id"),
        "sheet_code": sheet["sheet_code"],
        "source_text": sheet["source_text"],
    }


def _compare_sheet_with_ld_rows(
    sheet_document_id: int,
    sheet_filename: str,
    sheet: dict[str, Any],
    matching_ld_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    sheet_scope_id = sheet.get("scope_id")
    base_result = {
        "matched_ld_row": None,
        "sheet_code": sheet["sheet_code"],
        "sheet_description": sheet.get("description"),
        "sheet_filename": sheet_filename,
        "sheet_item": sheet.get("item"),
        "sheet_page": sheet["page"],
        "sheet_scope_id": sheet_scope_id,
        "sheet_source_text": sheet["source_text"],
    }

    scoped_matching_rows = _filter_sheet_scope_candidates(
        sheet_document_id=sheet_document_id,
        sheet=sheet,
        matching_ld_rows=matching_ld_rows,
    )
    if scoped_matching_rows:
        return None

    out_of_scope_row = _select_sheet_out_of_scope_row(
        sheet_document_id=sheet_document_id,
        sheet=sheet,
        matching_ld_rows=matching_ld_rows,
    )
    if out_of_scope_row:
        matched_ld_row = _build_matched_ld_row(out_of_scope_row)
        if out_of_scope_row.get("document_id") == sheet_document_id:
            return {
                **base_result,
                "category": "probable_issue",
                "matched_ld_row": matched_ld_row,
                "message": (
                    f"{sheet['sheet_code']} foi detectada na secao {sheet_scope_id}, "
                    "mas esta declarada na LD de outra secao do mesmo PDF."
                ),
                "reason": "detected_sheet_declared_in_other_section",
                "severity": "relevante",
                "type": "detected_sheet_other_section_ld",
            }

        return {
            **base_result,
            "category": "needs_review",
            "matched_ld_row": matched_ld_row,
            "message": (
                f"{sheet['sheet_code']} foi detectada neste PDF, mas a LD "
                "correspondente apareceu em outro documento do pacote."
            ),
            "reason": "detected_sheet_declared_in_other_document",
            "severity": "atencao",
            "type": "detected_sheet_other_document_ld",
        }

    return {
        **base_result,
        "category": "probable_issue",
        "message": (
            f"{sheet['sheet_code']} foi detectada fora das LDs, mas nao apareceu "
            "em nenhuma Lista de Documentos do pacote."
        ),
        "reason": "detected_sheet_missing_from_ld",
        "severity": "relevante",
        "type": "detected_sheet_missing_from_ld",
    }


def _filter_sheet_scope_candidates(
    sheet_document_id: int,
    sheet: dict[str, Any],
    matching_ld_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    same_document_rows = [
        row for row in matching_ld_rows if row.get("document_id") == sheet_document_id
    ]
    if not same_document_rows:
        return []

    sheet_scope_id = sheet.get("scope_id")
    if not sheet_scope_id:
        return same_document_rows

    return [
        row
        for row in same_document_rows
        if row.get("scope_id") == sheet_scope_id
    ]


def _select_sheet_out_of_scope_row(
    sheet_document_id: int,
    sheet: dict[str, Any],
    matching_ld_rows: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not matching_ld_rows:
        return None

    sheet_scope_id = sheet.get("scope_id")
    same_document_other_scope = [
        row
        for row in matching_ld_rows
        if row.get("document_id") == sheet_document_id
        and row.get("scope_id") != sheet_scope_id
    ]
    if same_document_other_scope:
        return _select_best_ld_row(same_document_other_scope, sheet)

    other_document_rows = [
        row for row in matching_ld_rows if row.get("document_id") != sheet_document_id
    ]
    if other_document_rows:
        return _select_best_ld_row(other_document_rows, sheet)

    return None


def _select_best_ld_row(
    matching_ld_rows: list[dict[str, Any]],
    sheet: dict[str, Any],
) -> dict[str, Any]:
    with_same_item = [
        row for row in matching_ld_rows if row.get("item") == sheet.get("item")
    ]
    if with_same_item:
        return with_same_item[0]
    return matching_ld_rows[0]


def _build_matched_ld_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "description": row["description"],
        "document_code": row["document_code"],
        "filename": row["filename"],
        "item": row["item"],
        "page": row["page"],
        "scope_id": row.get("scope_id"),
        "source_text": row["source_text"],
    }


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
