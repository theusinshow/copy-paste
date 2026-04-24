from collections.abc import Sequence

from sqlalchemy import delete
from sqlalchemy.orm import Session

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
