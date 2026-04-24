from typing import Any

from app.models.input_document import InputDocument
from app.worker.detected_sheets import build_detected_sheets
from app.worker.document_sections import build_document_sections
from app.worker.drawing_list import build_drawing_lists
from app.worker.package_summary import build_package_summary


def build_package_map(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    package_summary = build_package_summary(documents, page_texts_by_document_id)
    drawing_lists = build_drawing_lists(documents, page_texts_by_document_id)
    detected_sheets = build_detected_sheets(documents, page_texts_by_document_id)
    ld_rows_by_document_and_scope = _index_ld_rows(drawing_lists)
    sheets_by_document_and_scope = _index_sheets(detected_sheets)

    mapped_documents = []
    for document in documents:
        page_texts = page_texts_by_document_id.get(document.id, {})
        sections = build_document_sections(page_texts)
        summary_document = _find_summary_document(package_summary, document.id)

        mapped_documents.append(
            {
                "classification": (
                    summary_document.get("classification")
                    if summary_document
                    else "desconhecido"
                ),
                "discipline": summary_document.get("discipline") if summary_document else None,
                "document_id": document.id,
                "filename": document.original_filename,
                "page_count": len(page_texts),
                "sections": [
                    _build_section_payload(
                        document_id=document.id,
                        filename=document.original_filename,
                        section=section,
                        ld_rows=ld_rows_by_document_and_scope.get(
                            (document.id, section.scope_id),
                            [],
                        ),
                        sheets=sheets_by_document_and_scope.get(
                            (document.id, section.scope_id),
                            [],
                        ),
                    )
                    for section in sections
                ],
                "tipo": document.tipo,
                "tomo": summary_document.get("tomo") if summary_document else None,
                "volume": summary_document.get("volume") if summary_document else None,
            }
        )

    return {
        "documents": mapped_documents,
        "identity": package_summary["identity"],
        "stats": {
            "document_count": len(mapped_documents),
            "ld_section_count": sum(
                1
                for document in mapped_documents
                for section in document["sections"]
                if section["ld_page"] is not None
            ),
            "section_count": sum(len(document["sections"]) for document in mapped_documents),
            "sheet_count": sum(
                section["sheet_count"]
                for document in mapped_documents
                for section in document["sections"]
            ),
        },
    }


def _build_section_payload(
    document_id: int,
    filename: str,
    section,
    ld_rows: list[dict[str, Any]],
    sheets: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "document_id": document_id,
        "document_filename": filename,
        "end_page": section.end_page,
        "ld_codes": [row["document_code"] for row in ld_rows],
        "ld_page": section.ld_page,
        "ld_row_count": len(ld_rows),
        "scope_id": section.scope_id,
        "sheet_codes": [sheet["sheet_code"] for sheet in sheets],
        "sheet_count": len(sheets),
        "start_page": section.start_page,
        "title": _build_section_title(section, ld_rows, sheets),
    }


def _build_section_title(
    section,
    ld_rows: list[dict[str, Any]],
    sheets: list[dict[str, Any]],
) -> str:
    if ld_rows:
        first_code = ld_rows[0]["document_code"]
        return f"Secao {section.scope_id} - LD {first_code}"
    if sheets:
        return f"Secao {section.scope_id} - pranchas sem LD detectada"
    return f"Secao {section.scope_id}"


def _index_ld_rows(drawing_lists: dict[str, Any]) -> dict[tuple[int, int | None], list[dict[str, Any]]]:
    index: dict[tuple[int, int | None], list[dict[str, Any]]] = {}
    for drawing_list in drawing_lists["lists"]:
        for row in drawing_list["rows"]:
            index.setdefault(
                (drawing_list["document_id"], row.get("scope_id")),
                [],
            ).append(row)
    return index


def _index_sheets(detected_sheets: dict[str, Any]) -> dict[tuple[int, int | None], list[dict[str, Any]]]:
    index: dict[tuple[int, int | None], list[dict[str, Any]]] = {}
    for document in detected_sheets["documents"]:
        for sheet in document["sheets"]:
            index.setdefault(
                (document["document_id"], sheet.get("scope_id")),
                [],
            ).append(sheet)
    return index


def _find_summary_document(
    package_summary: dict[str, Any],
    document_id: int,
) -> dict[str, Any] | None:
    for document in package_summary["documents"]:
        if document["document_id"] == document_id:
            return document
    return None
