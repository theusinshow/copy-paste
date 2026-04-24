from fastapi import APIRouter, Body, File, Form, HTTPException, UploadFile, status

from app.core.analysis_modes import validate_analysis_payload

from app.db.analysis_runs import (
    ANALYSIS_STATUS_CANCELLED,
    ANALYSIS_STATUS_COMPLETED,
    ANALYSIS_STATUS_FAILED,
    create_analysis_run,
    get_analysis_run_by_id,
    list_analysis_runs,
    set_analysis_run_status,
)
from app.db.ai_review import get_ai_review_by_analysis_id
from app.db.dependencies import DbSession
from app.db.detected_sheets import get_detected_sheets_by_analysis_id
from app.db.drawing_lists import get_drawing_lists_by_analysis_id
from app.db.extracted_fields import list_extracted_fields_by_analysis_id
from app.db.footer_audit import get_footer_audit_by_analysis_id
from app.db.input_documents import create_input_documents
from app.db.issues import list_issues_with_evidences_by_analysis_id
from app.db.ld_sheet_crosscheck import get_ld_sheet_crosscheck_by_analysis_id
from app.db.memorial_audit import get_memorial_audit_by_analysis_id
from app.db.package_map import get_package_map_by_analysis_id
from app.db.page_map import get_page_map_by_analysis_id
from app.db.package_summary import get_package_summary_by_analysis_id
from app.schemas.analysis import (
    AiReviewSchema,
    AnalysisCreateSchema,
    AnalysisRunSchema,
    DetectedSheetsSchema,
    DrawingListsSchema,
    ExtractedFieldWithContextSchema,
    FooterAuditSchema,
    InputDocumentSchema,
    LdSheetCrosscheckSchema,
    MemorialAuditSchema,
    PackageMapSchema,
    PageMapSchema,
    PackageSummarySchema,
)
from app.schemas.issue import IssueWithEvidencesSchema
from app.storage.uploads import delete_uploaded_files, save_pdf_upload
from app.worker.analysis_processor import AnalysisProcessingError, process_analysis

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented",
    )


@router.post("", response_model=AnalysisRunSchema, status_code=status.HTTP_201_CREATED)
def create_analysis(
    session: DbSession,
    payload: AnalysisCreateSchema | None = Body(default=None),
) -> AnalysisRunSchema:
    try:
        analysis_mode, config = validate_analysis_payload(
            payload.analysis_mode if payload else None,
            payload.config if payload else None,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return create_analysis_run(
        session,
        analysis_mode=analysis_mode,
        config=config,
    )


@router.get("", response_model=list[AnalysisRunSchema])
def list_analyses(session: DbSession) -> list[AnalysisRunSchema]:
    return list_analysis_runs(session)


@router.post(
    "/{analysis_id}/files",
    response_model=list[InputDocumentSchema],
    status_code=status.HTTP_201_CREATED,
)
async def upload_analysis_files(
    analysis_id: int,
    session: DbSession,
    tipo: str = Form(...),
    files: list[UploadFile] = File(...),
) -> list[InputDocumentSchema]:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    normalized_tipo = tipo.strip()
    if not normalized_tipo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tipo is required",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file is required",
        )

    saved_uploads: list[dict[str, str]] = []
    saved_file_paths: list[str] = []

    try:
        for file in files:
            try:
                content = await file.read()
                stored_upload = save_pdf_upload(
                    analysis_id=analysis_id,
                    original_filename=file.filename,
                    content=content,
                )
            finally:
                await file.close()

            saved_file_paths.append(stored_upload.file_path)
            saved_uploads.append(
                {
                    "original_filename": stored_upload.original_filename,
                    "file_path": stored_upload.file_path,
                    "file_hash": stored_upload.file_hash,
                }
            )

        return create_input_documents(
            session=session,
            analysis_id=analysis_id,
            tipo=normalized_tipo,
            uploads=saved_uploads,
        )
    except ValueError as exc:
        session.rollback()
        delete_uploaded_files(saved_file_paths)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception:
        session.rollback()
        delete_uploaded_files(saved_file_paths)
        raise


@router.post("/{analysis_id}/start", response_model=AnalysisRunSchema)
def start_analysis(analysis_id: int, session: DbSession) -> AnalysisRunSchema:
    try:
        return process_analysis(session, analysis_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except AnalysisProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.post("/{analysis_id}/cancel", response_model=AnalysisRunSchema)
def cancel_analysis(analysis_id: int, session: DbSession) -> AnalysisRunSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    if analysis_run.status in {ANALYSIS_STATUS_COMPLETED, ANALYSIS_STATUS_FAILED}:
        return analysis_run

    return set_analysis_run_status(session, analysis_run, ANALYSIS_STATUS_CANCELLED)


@router.get("/{analysis_id}", response_model=AnalysisRunSchema)
def get_analysis(analysis_id: int, session: DbSession) -> AnalysisRunSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return analysis_run


@router.get("/{analysis_id}/issues", response_model=list[IssueWithEvidencesSchema])
def list_analysis_issues(
    analysis_id: int,
    session: DbSession,
) -> list[IssueWithEvidencesSchema]:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return list_issues_with_evidences_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/fields", response_model=list[ExtractedFieldWithContextSchema])
def list_analysis_fields(
    analysis_id: int,
    session: DbSession,
) -> list[ExtractedFieldWithContextSchema]:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return list_extracted_fields_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/package-summary", response_model=PackageSummarySchema)
def get_analysis_package_summary(
    analysis_id: int,
    session: DbSession,
) -> PackageSummarySchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_package_summary_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/package-map", response_model=PackageMapSchema)
def get_analysis_package_map(
    analysis_id: int,
    session: DbSession,
) -> PackageMapSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_package_map_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/footer-audit", response_model=FooterAuditSchema)
def get_analysis_footer_audit(
    analysis_id: int,
    session: DbSession,
) -> FooterAuditSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_footer_audit_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/ai-review", response_model=AiReviewSchema)
def get_analysis_ai_review(
    analysis_id: int,
    session: DbSession,
) -> AiReviewSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_ai_review_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/page-map", response_model=PageMapSchema)
def get_analysis_page_map(
    analysis_id: int,
    session: DbSession,
) -> PageMapSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_page_map_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/drawing-lists", response_model=DrawingListsSchema)
def get_analysis_drawing_lists(
    analysis_id: int,
    session: DbSession,
) -> DrawingListsSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_drawing_lists_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/detected-sheets", response_model=DetectedSheetsSchema)
def get_analysis_detected_sheets(
    analysis_id: int,
    session: DbSession,
) -> DetectedSheetsSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_detected_sheets_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/ld-sheet-crosscheck", response_model=LdSheetCrosscheckSchema)
def get_analysis_ld_sheet_crosscheck(
    analysis_id: int,
    session: DbSession,
) -> LdSheetCrosscheckSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_ld_sheet_crosscheck_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/memorial-audit", response_model=MemorialAuditSchema)
def get_analysis_memorial_audit(
    analysis_id: int,
    session: DbSession,
) -> MemorialAuditSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return get_memorial_audit_by_analysis_id(session, analysis_id)


@router.get("/{analysis_id}/export")
async def export_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()
