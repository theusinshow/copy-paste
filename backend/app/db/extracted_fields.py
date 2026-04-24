from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage
from app.models.extracted_field import ExtractedField
from app.models.input_document import InputDocument


def replace_extracted_fields(
    session: Session,
    input_document_ids: Sequence[int],
    extracted_fields: Sequence[dict],
) -> list[ExtractedField]:
    if input_document_ids:
        session.execute(
            delete(ExtractedField).where(
                ExtractedField.input_document_id.in_(input_document_ids)
            )
        )

    fields = [
        ExtractedField(
            input_document_id=field["input_document_id"],
            document_page_id=field["document_page_id"],
            field_name=field["field_name"],
            raw_value=field["raw_value"],
            normalized_value=field["normalized_value"],
            bbox=field["bbox"],
        )
        for field in extracted_fields
    ]
    session.add_all(fields)
    session.flush()
    return fields


def list_extracted_fields_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> list[dict]:
    rows = session.execute(
        select(
            ExtractedField.id,
            ExtractedField.input_document_id,
            ExtractedField.document_page_id,
            ExtractedField.field_name,
            ExtractedField.raw_value,
            ExtractedField.normalized_value,
            ExtractedField.bbox,
            DocumentPage.page_number,
            InputDocument.original_filename,
            InputDocument.tipo,
        )
        .join(InputDocument, InputDocument.id == ExtractedField.input_document_id)
        .join(DocumentPage, DocumentPage.id == ExtractedField.document_page_id)
        .where(InputDocument.analysis_run_id == analysis_id)
        .order_by(
            ExtractedField.field_name.asc(),
            InputDocument.id.asc(),
            DocumentPage.page_number.asc(),
            ExtractedField.id.asc(),
        )
    ).all()

    return [
        {
            "id": row.id,
            "input_document_id": row.input_document_id,
            "document_page_id": row.document_page_id,
            "field_name": row.field_name,
            "raw_value": row.raw_value,
            "normalized_value": row.normalized_value,
            "bbox": row.bbox,
            "page": row.page_number,
            "document_filename": row.original_filename,
            "document_tipo": row.tipo,
        }
        for row in rows
    ]
