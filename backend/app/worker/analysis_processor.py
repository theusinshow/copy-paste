from sqlalchemy.orm import Session

from app.db.analysis_runs import (
    ANALYSIS_STATUS_COMPLETED,
    ANALYSIS_STATUS_FAILED,
    ANALYSIS_STATUS_PROCESSING,
    get_analysis_run_by_id,
    set_analysis_run_status,
)
from app.db.document_pages import replace_document_pages
from app.db.extracted_fields import replace_extracted_fields
from app.db.input_documents import list_input_documents_by_analysis_id
from app.db.text_spans import replace_text_spans
from app.models.analysis_run import AnalysisRun
from app.worker.field_extractor import extract_fields_from_pages
from app.worker.pdf_reader import read_pdf_pages


class AnalysisProcessingError(RuntimeError):
    pass


def process_analysis(session: Session, analysis_id: int) -> AnalysisRun:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise LookupError("Analysis not found")

    input_documents = list_input_documents_by_analysis_id(session, analysis_id)
    if not input_documents:
        raise ValueError("Analysis has no input documents")

    set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_PROCESSING)

    try:
        extracted_pages_by_document = [
            (input_document.id, read_pdf_pages(input_document.file_path))
            for input_document in input_documents
        ]
        pages_by_document = [
            (
                document_id,
                [extracted_page.page_number for extracted_page in extracted_pages],
            )
            for document_id, extracted_pages in extracted_pages_by_document
        ]
        document_pages = replace_document_pages(session, pages_by_document)
        document_page_ids = {
            (document_page.document_id, document_page.page_number): document_page.id
            for document_page in document_pages
        }
        replace_text_spans(
            session,
            [
                (
                    document_page_ids[(document_id, extracted_page.page_number)],
                    [
                        {"text": text_span.text, "bbox": text_span.bbox}
                        for text_span in extracted_page.text_spans
                    ],
                )
                for document_id, extracted_pages in extracted_pages_by_document
                for extracted_page in extracted_pages
            ],
        )
        replace_extracted_fields(
            session,
            [input_document.id for input_document in input_documents],
            [
                {
                    "input_document_id": document_id,
                    "document_page_id": candidate.document_page_id,
                    "field_name": candidate.field_name,
                    "raw_value": candidate.raw_value,
                    "normalized_value": candidate.normalized_value,
                    "bbox": candidate.bbox,
                }
                for document_id, extracted_pages in extracted_pages_by_document
                for candidate in extract_fields_from_pages(
                    extracted_pages,
                    {
                        extracted_page.page_number: document_page_ids[
                            (document_id, extracted_page.page_number)
                        ]
                        for extracted_page in extracted_pages
                    },
                )
            ],
        )
        session.commit()
    except (FileNotFoundError, ValueError) as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        raise AnalysisProcessingError(str(exc)) from exc
    except Exception as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        raise AnalysisProcessingError("Analysis processing failed") from exc

    return set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_COMPLETED)
