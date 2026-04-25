from collections import defaultdict
import re
from typing import Any

from app.core.analysis_modes import (
    ANALYSIS_MODE_CHECK_ADDRESS,
    ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
    ANALYSIS_MODE_CHECK_WORK_NAME,
    ANALYSIS_MODE_FIND_REPLACE,
    ANALYSIS_MODE_FIND_TEXT,
)

LINE_TOP_TOLERANCE = 3.0
WHITESPACE_PATTERN = re.compile(r"\s+")

FIELD_LABELS = {
    "endereco": "Endereco",
    "nome_obra": "Nome da obra",
    "numero_projeto": "Numero do projeto",
}


def build_mode_output(
    analysis_mode: str,
    config: dict[str, Any],
    text_rows: list[dict[str, Any]],
    extracted_fields: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if analysis_mode == ANALYSIS_MODE_FIND_TEXT:
        return _build_find_text_output(config, text_rows)

    if analysis_mode == ANALYSIS_MODE_FIND_REPLACE:
        return _build_find_replace_output(config, text_rows)

    if analysis_mode in {
        ANALYSIS_MODE_CHECK_ADDRESS,
        ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
        ANALYSIS_MODE_CHECK_WORK_NAME,
    }:
        return _build_expected_value_output(analysis_mode, config, extracted_fields)

    return None


def _build_find_text_output(
    config: dict[str, Any],
    text_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    query = str(config.get("query", "")).strip()
    normalized_query = query.casefold()
    line_rows = _build_line_rows(text_rows)
    matching_lines = [
        line_row
        for line_row in line_rows
        if normalized_query and normalized_query in line_row["text"].casefold()
    ]

    summary = (
        f"{len(matching_lines)} ocorrencia(s) de '{query}' detectada(s) em "
        f"{len({entry['page_key'] for entry in matching_lines})} pagina(s)."
        if matching_lines
        else f"Nenhuma ocorrencia de '{query}' foi localizada na carga analisada."
    )

    return {
        "entries": [
            {
                "bbox": entry["bbox"],
                "context": entry["text"],
                "document_id": entry["document_id"],
                "expected_value": None,
                "field_name": None,
                "filename": entry["filename"],
                "kind": "text_match",
                "page": entry["page"],
                "replacement_preview": None,
                "severity": "info",
                "value": entry["text"],
            }
            for entry in matching_lines
        ],
        "expected": None,
        "field_label": None,
        "mode": ANALYSIS_MODE_FIND_TEXT,
        "query": query,
        "replace": None,
        "stats": {
            "divergent_count": 0,
            "document_count": len({entry["document_id"] for entry in matching_lines}),
            "matching_count": len(matching_lines),
            "occurrence_count": len(matching_lines),
            "page_count": len({entry["page_key"] for entry in matching_lines}),
        },
        "summary": summary,
        "title": "Busca textual",
    }


def _build_find_replace_output(
    config: dict[str, Any],
    text_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    find_value = str(config.get("find", "")).strip()
    replace_value = str(config.get("replace", ""))
    normalized_find = find_value.casefold()
    line_rows = _build_line_rows(text_rows)
    matching_lines = [
        line_row
        for line_row in line_rows
        if normalized_find and normalized_find in line_row["text"].casefold()
    ]

    summary = (
        f"{len(matching_lines)} ocorrencia(s) de '{find_value}' foram listada(s) "
        "para substituicao sugerida, sem alterar o PDF original."
        if matching_lines
        else f"Nenhuma ocorrencia de '{find_value}' foi localizada para substituicao."
    )

    return {
        "entries": [
            {
                "bbox": entry["bbox"],
                "context": entry["text"],
                "document_id": entry["document_id"],
                "expected_value": None,
                "field_name": None,
                "filename": entry["filename"],
                "kind": "find_replace_match",
                "page": entry["page"],
                "replacement_preview": replace_value,
                "severity": "info",
                "value": entry["text"],
            }
            for entry in matching_lines
        ],
        "expected": None,
        "field_label": None,
        "mode": ANALYSIS_MODE_FIND_REPLACE,
        "query": find_value,
        "replace": replace_value,
        "stats": {
            "divergent_count": 0,
            "document_count": len({entry["document_id"] for entry in matching_lines}),
            "matching_count": len(matching_lines),
            "occurrence_count": len(matching_lines),
            "page_count": len({entry["page_key"] for entry in matching_lines}),
        },
        "summary": summary,
        "title": "Busca e substituicao",
    }


def _build_expected_value_output(
    analysis_mode: str,
    config: dict[str, Any],
    extracted_fields: list[dict[str, Any]],
) -> dict[str, Any]:
    field_name = {
        ANALYSIS_MODE_CHECK_ADDRESS: "endereco",
        ANALYSIS_MODE_CHECK_PROJECT_NUMBER: "numero_projeto",
        ANALYSIS_MODE_CHECK_WORK_NAME: "nome_obra",
    }[analysis_mode]
    expected = str(config.get("expected", "")).strip()
    expected_normalized = _normalize_value(expected)
    matching_fields = [
        field for field in extracted_fields if field.get("field_name") == field_name
    ]

    entries = []
    matching_count = 0
    divergent_count = 0
    for field in matching_fields:
        value = field.get("raw_value", "")
        is_match = _normalize_value(value) == expected_normalized
        if is_match:
            matching_count += 1
        else:
            divergent_count += 1

        entries.append(
            {
                "bbox": field.get("bbox"),
                "context": field.get("document_filename", ""),
                "document_id": field.get("input_document_id"),
                "expected_value": expected,
                "field_name": field_name,
                "filename": field.get("document_filename", ""),
                "kind": "field_match" if is_match else "field_mismatch",
                "page": field.get("page"),
                "replacement_preview": None,
                "severity": "info" if is_match else "relevante",
                "value": value,
            }
        )

    if not matching_fields:
        summary = (
            f"Nenhuma evidencia do campo {FIELD_LABELS[field_name].lower()} foi extraida "
            "nesta analise. A ausencia nao gera incongruencia automaticamente."
        )
    elif divergent_count == 0:
        summary = (
            f"Todas as {matching_count} evidencia(s) extraidas de "
            f"{FIELD_LABELS[field_name].lower()} conferem com o valor esperado."
        )
    else:
        summary = (
            f"{divergent_count} evidencia(s) de {FIELD_LABELS[field_name].lower()} "
            f"divergem do valor esperado '{expected}'."
        )

    return {
        "entries": entries,
        "expected": expected,
        "field_label": FIELD_LABELS[field_name],
        "mode": analysis_mode,
        "query": None,
        "replace": None,
        "stats": {
            "divergent_count": divergent_count,
            "document_count": len(
                {field.get("input_document_id") for field in matching_fields}
            ),
            "matching_count": matching_count,
            "occurrence_count": len(entries),
            "page_count": len(
                {
                    (field.get("input_document_id"), field.get("page"))
                    for field in matching_fields
                }
            ),
        },
        "summary": summary,
        "title": f"Verificacao dirigida de {FIELD_LABELS[field_name].lower()}",
    }


def _build_line_rows(text_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped_rows: dict[tuple[int, int], list[dict[str, Any]]] = defaultdict(list)
    for text_row in text_rows:
        page_key = (text_row["document_id"], text_row["page"])
        grouped_rows[page_key].append(text_row)

    line_rows: list[dict[str, Any]] = []
    for page_rows in grouped_rows.values():
        ordered_page_rows = sorted(
            page_rows,
            key=lambda row: (
                row["bbox"]["top"] if row.get("bbox") is not None else 0.0,
                row["bbox"]["x0"] if row.get("bbox") is not None else 0.0,
                row["id"],
            ),
        )
        current_line_rows: list[dict[str, Any]] = []
        current_top: float | None = None

        for row in ordered_page_rows:
            bbox = row.get("bbox")
            if bbox is None:
                if current_line_rows:
                    line_rows.append(_create_line_row(current_line_rows))
                    current_line_rows = []
                    current_top = None
                line_rows.append(_create_line_row([row]))
                continue

            row_top = bbox["top"]
            if current_top is None or abs(row_top - current_top) <= LINE_TOP_TOLERANCE:
                current_line_rows.append(row)
                if current_top is None:
                    current_top = row_top
                continue

            line_rows.append(_create_line_row(current_line_rows))
            current_line_rows = [row]
            current_top = row_top

        if current_line_rows:
            line_rows.append(_create_line_row(current_line_rows))

    return line_rows


def _create_line_row(rows: list[dict[str, Any]]) -> dict[str, Any]:
    ordered_rows = sorted(
        rows,
        key=lambda row: row["bbox"]["x0"] if row.get("bbox") is not None else 0.0,
    )
    first_row = ordered_rows[0]
    text = " ".join(row["text"].strip() for row in ordered_rows if row["text"].strip())
    bboxes = [row["bbox"] for row in ordered_rows if row.get("bbox") is not None]

    return {
        "bbox": _merge_bboxes(bboxes),
        "document_id": first_row["document_id"],
        "filename": first_row["filename"],
        "page": first_row["page"],
        "page_key": (first_row["document_id"], first_row["page"]),
        "text": _normalize_whitespace(text),
    }


def _merge_bboxes(
    bboxes: list[dict[str, float]],
) -> dict[str, float] | None:
    if not bboxes:
        return None

    return {
        "bottom": max(bbox["bottom"] for bbox in bboxes),
        "top": min(bbox["top"] for bbox in bboxes),
        "x0": min(bbox["x0"] for bbox in bboxes),
        "x1": max(bbox["x1"] for bbox in bboxes),
    }


def _normalize_value(value: str) -> str:
    return _normalize_whitespace(value).casefold()


def _normalize_whitespace(value: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", str(value)).strip()
