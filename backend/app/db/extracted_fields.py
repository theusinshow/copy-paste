from collections.abc import Sequence

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.extracted_field import ExtractedField


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
