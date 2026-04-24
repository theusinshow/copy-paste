from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_page import DocumentPage
from app.models.input_document import InputDocument
from app.models.text_span import TextSpan
from app.worker.footer_audit import build_footer_audit


def get_footer_audit_by_analysis_id(
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
        return build_footer_audit([], {}, {})

    document_ids = [document.id for document in documents]
    rows = session.execute(
        select(
            DocumentPage.document_id,
            DocumentPage.page_number,
            TextSpan.text,
            TextSpan.bbox,
        )
        .join(TextSpan, TextSpan.document_page_id == DocumentPage.id)
        .where(DocumentPage.document_id.in_(document_ids))
        .order_by(DocumentPage.document_id.asc(), DocumentPage.page_number.asc(), TextSpan.id.asc())
    ).all()

    page_texts_by_document_id: dict[int, dict[int, list[str]]] = {
        document_id: {} for document_id in document_ids
    }
    span_rows_by_document_and_page: dict[tuple[int, int], list[tuple[str, dict | None]]] = {}
    for row in rows:
        page_texts_by_document_id.setdefault(row.document_id, {}).setdefault(
            row.page_number,
            [],
        ).append(row.text)
        span_rows_by_document_and_page.setdefault(
            (row.document_id, row.page_number),
            [],
        ).append((row.text, row.bbox))

    page_texts = {
        document_id: {
            page_number: " ".join(texts)
            for page_number, texts in pages_by_number.items()
        }
        for document_id, pages_by_number in page_texts_by_document_id.items()
    }
    footer_texts = _extract_footer_texts(span_rows_by_document_and_page)

    return build_footer_audit(documents, page_texts, footer_texts)


def _extract_footer_texts(
    span_rows_by_document_and_page: dict[tuple[int, int], list[tuple[str, dict | None]]],
) -> dict[int, dict[int, str]]:
    footer_texts: dict[int, dict[int, str]] = {}
    for (document_id, page_number), spans in span_rows_by_document_and_page.items():
        positioned_spans = [
            (text, bbox)
            for text, bbox in spans
            if bbox and bbox.get("top") is not None and bbox.get("bottom") is not None
        ]
        if not positioned_spans:
            continue

        max_bottom = max(float(bbox["bottom"]) for _, bbox in positioned_spans)
        footer_top = max_bottom * 0.78
        footer_spans = [
            (text, bbox)
            for text, bbox in positioned_spans
            if float(bbox["top"]) >= footer_top
        ]
        if not footer_spans:
            continue

        footer_spans.sort(key=lambda item: (float(item[1]["top"]), float(item[1].get("x0", 0))))
        footer_text = " ".join(text for text, _ in footer_spans).strip()
        if footer_text:
            footer_texts.setdefault(document_id, {})[page_number] = footer_text

    return footer_texts
