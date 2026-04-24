from collections.abc import Sequence

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage


def replace_document_pages(
    session: Session,
    pages_by_document: Sequence[tuple[int, Sequence[int]]],
) -> list[DocumentPage]:
    document_ids = [document_id for document_id, _ in pages_by_document]
    if document_ids:
        session.execute(
            delete(DocumentPage).where(DocumentPage.document_id.in_(document_ids))
        )

    document_pages = [
        DocumentPage(document_id=document_id, page_number=page_number)
        for document_id, page_numbers in pages_by_document
        for page_number in page_numbers
    ]
    session.add_all(document_pages)
    session.commit()

    for document_page in document_pages:
        session.refresh(document_page)

    return document_pages
