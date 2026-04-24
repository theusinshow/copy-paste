from sqlalchemy.orm import Session

from app.db.analysis_runs import (
    ANALYSIS_STATUS_COMPLETED,
    ANALYSIS_STATUS_FAILED,
    ANALYSIS_STATUS_PROCESSING,
    get_analysis_run_by_id,
    set_analysis_run_status,
)
from app.db.document_pages import replace_document_pages
from app.db.input_documents import list_input_documents_by_analysis_id
from app.models.analysis_run import AnalysisRun
from app.worker.pdf_reader import read_pdf_page_numbers


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
        pages_by_document = [
            (input_document.id, read_pdf_page_numbers(input_document.file_path))
            for input_document in input_documents
        ]
        replace_document_pages(session, pages_by_document)
    except (FileNotFoundError, ValueError) as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        raise AnalysisProcessingError(str(exc)) from exc
    except Exception as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        raise AnalysisProcessingError("Analysis processing failed") from exc

    return set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_COMPLETED)
