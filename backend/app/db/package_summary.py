from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage
from app.models.input_document import InputDocument
from app.models.text_span import TextSpan
from app.worker.package_summary import build_package_summary


def get_package_summary_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> dict:
    documents = list(
        session.scalars(
            select(InputDocument)
            .where(InputDocument.analysis_run_id == analysis_id)
            .order_by(InputDocument.id.asc())
        ).all()
    )

    if not documents:
        return build_package_summary([], {})

    document_ids = [document.id for document in documents]
    rows = session.execute(
        select(
            DocumentPage.document_id,
            DocumentPage.page_number,
            TextSpan.text,
        )
        .join(TextSpan, TextSpan.document_page_id == DocumentPage.id)
        .where(DocumentPage.document_id.in_(document_ids))
        .order_by(DocumentPage.document_id.asc(), DocumentPage.page_number.asc(), TextSpan.id.asc())
    ).all()

    pages_by_document_id: dict[int, dict[int, list[str]]] = {
        document_id: {} for document_id in document_ids
    }
    for row in rows:
        pages_by_document_id.setdefault(row.document_id, {}).setdefault(
            row.page_number,
            [],
        ).append(row.text)

    page_texts_by_document_id = {
        document_id: {
            page_number: " ".join(texts)
            for page_number, texts in pages_by_number.items()
        }
        for document_id, pages_by_number in pages_by_document_id.items()
    }

    return build_package_summary(documents, page_texts_by_document_id)
