from collections.abc import Sequence

from sqlalchemy import delete
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage
from app.models.text_span import TextSpan


def replace_document_pages(
    session: Session,
    pages_by_document: Sequence[tuple[int, Sequence[int]]],
) -> list[DocumentPage]:
    document_ids = [document_id for document_id, _ in pages_by_document]
    if document_ids:
        existing_page_ids = list(
            session.scalars(
                select(DocumentPage.id).where(DocumentPage.document_id.in_(document_ids))
            ).all()
        )
        if existing_page_ids:
            session.execute(
                delete(TextSpan).where(TextSpan.document_page_id.in_(existing_page_ids))
            )
        session.execute(
            delete(DocumentPage).where(DocumentPage.document_id.in_(document_ids))
        )

    document_pages = [
        DocumentPage(document_id=document_id, page_number=page_number)
        for document_id, page_numbers in pages_by_document
        for page_number in page_numbers
    ]
    session.add_all(document_pages)
    session.flush()

    return document_pages
