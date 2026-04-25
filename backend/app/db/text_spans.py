from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage
from app.models.input_document import InputDocument
from app.models.text_span import TextSpan


def replace_text_spans(
    session: Session,
    spans_by_page: Sequence[tuple[int, Sequence[dict]]],
) -> list[TextSpan]:
    document_page_ids = [document_page_id for document_page_id, _ in spans_by_page]
    if document_page_ids:
        session.execute(
            delete(TextSpan).where(TextSpan.document_page_id.in_(document_page_ids))
        )

    text_spans = [
        TextSpan(
            document_page_id=document_page_id,
            text=span["text"],
            bbox=span["bbox"],
        )
        for document_page_id, spans in spans_by_page
        for span in spans
    ]
    session.add_all(text_spans)
    session.flush()
    return text_spans


def list_text_spans_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> list[dict]:
    rows = session.execute(
        select(
            TextSpan.id,
            TextSpan.text,
            TextSpan.bbox,
            DocumentPage.page_number,
            InputDocument.id.label("document_id"),
            InputDocument.original_filename,
        )
        .join(DocumentPage, DocumentPage.id == TextSpan.document_page_id)
        .join(InputDocument, InputDocument.id == DocumentPage.document_id)
        .where(InputDocument.analysis_run_id == analysis_id)
        .order_by(
            InputDocument.id.asc(),
            DocumentPage.page_number.asc(),
            TextSpan.id.asc(),
        )
    ).all()

    return [
        {
            "bbox": row.bbox,
            "document_id": row.document_id,
            "filename": row.original_filename,
            "id": row.id,
            "page": row.page_number,
            "text": row.text,
        }
        for row in rows
    ]
