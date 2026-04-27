import threading

from sqlalchemy.orm import Session

from app.db.analysis_runs import (
    ANALYSIS_STATUS_CANCELLED,
    ANALYSIS_STATUS_COMPLETED,
    ANALYSIS_STATUS_FAILED,
    ANALYSIS_STATUS_PROCESSING,
    emit_analysis_progress,
    get_analysis_run_by_id,
    set_analysis_run_status,
)
from app.db.document_pages import replace_document_pages
from app.db.extracted_fields import replace_extracted_fields
from app.db.input_documents import list_input_documents_by_analysis_id
from app.db.issues import replace_analysis_issues
from app.db.text_spans import replace_text_spans
from app.worker.email_notify import send_analysis_notification
from app.models.analysis_run import AnalysisRun
from app.rules import evaluate_rules
from app.rules.types import RuleExtractedField, RuleInputDocument
from app.worker.analysis_mode_dispatcher import build_analysis_execution_plan
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
    emit_analysis_progress(analysis_id, 5)

    try:
        if _is_cancelled(session, analysis_run):
            return analysis_run

        execution_plan = build_analysis_execution_plan(analysis_run, input_documents)
        extracted_pages_by_document = []
        doc_count = len(input_documents)
        for i, input_document in enumerate(input_documents):
            if _is_cancelled(session, analysis_run):
                return analysis_run
            extracted_pages_by_document.append(
                (input_document.id, read_pdf_pages(input_document.file_path))
            )
            emit_analysis_progress(analysis_id, 5 + round((i + 1) / doc_count * 55))

        if _is_cancelled(session, analysis_run):
            return analysis_run

        pages_by_document = [
            (
                document_id,
                [extracted_page.page_number for extracted_page in extracted_pages],
            )
            for document_id, extracted_pages in extracted_pages_by_document
        ]
        document_pages = replace_document_pages(session, pages_by_document)
        if _is_cancelled(session, analysis_run):
            return analysis_run

        document_page_ids = {
            (document_page.document_id, document_page.page_number): document_page.id
            for document_page in document_pages
        }
        page_numbers_by_document_page_id = {
            document_page.id: document_page.page_number
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
        emit_analysis_progress(analysis_id, 72)
        if _is_cancelled(session, analysis_run):
            return analysis_run

        extracted_fields = replace_extracted_fields(
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
        emit_analysis_progress(analysis_id, 85)
        if _is_cancelled(session, analysis_run):
            return analysis_run

        if execution_plan.run_rules:
            evaluation_document_ids = {
                input_document.id for input_document in execution_plan.evaluation_documents
            }
            replace_analysis_issues(
                session,
                analysis_id,
                evaluate_rules(
                    [
                        RuleInputDocument(id=input_document.id)
                        for input_document in execution_plan.evaluation_documents
                    ],
                    [
                        RuleExtractedField(
                            id=field.id,
                            input_document_id=field.input_document_id,
                            field_name=field.field_name,
                            raw_value=field.raw_value,
                            normalized_value=field.normalized_value,
                            page=page_numbers_by_document_page_id.get(field.document_page_id),
                            bbox=field.bbox,
                        )
                        for field in extracted_fields
                        if field.input_document_id in evaluation_document_ids
                    ],
                    analysis_mode=analysis_run.analysis_mode,
                    config=analysis_run.config,
                ),
            )
        else:
            replace_analysis_issues(session, analysis_id, [])
        emit_analysis_progress(analysis_id, 95)
        if _is_cancelled(session, analysis_run):
            return analysis_run

        session.commit()
    except ValueError:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        threading.Thread(
            target=send_analysis_notification,
            args=(analysis_id, ANALYSIS_STATUS_FAILED, analysis_run.analysis_mode),
            daemon=True,
        ).start()
        raise
    except FileNotFoundError as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        threading.Thread(
            target=send_analysis_notification,
            args=(analysis_id, ANALYSIS_STATUS_FAILED, analysis_run.analysis_mode),
            daemon=True,
        ).start()
        raise AnalysisProcessingError(str(exc)) from exc
    except Exception as exc:
        session.rollback()
        set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_FAILED)
        threading.Thread(
            target=send_analysis_notification,
            args=(analysis_id, ANALYSIS_STATUS_FAILED, analysis_run.analysis_mode),
            daemon=True,
        ).start()
        raise AnalysisProcessingError("Analysis processing failed") from exc

    emit_analysis_progress(analysis_id, 100)
    completed = set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_COMPLETED)
    threading.Thread(
        target=send_analysis_notification,
        args=(analysis_id, ANALYSIS_STATUS_COMPLETED, analysis_run.analysis_mode),
        daemon=True,
    ).start()
    return completed


def _is_cancelled(session: Session, analysis_run: AnalysisRun) -> bool:
    session.refresh(analysis_run)
    return analysis_run.status == ANALYSIS_STATUS_CANCELLED
