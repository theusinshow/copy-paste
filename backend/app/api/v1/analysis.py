from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.db.analysis_runs import (
    create_analysis_run,
    get_analysis_run_by_id,
    list_analysis_runs,
)
from app.db.dependencies import DbSession
from app.db.input_documents import create_input_documents
from app.schemas.analysis import AnalysisRunSchema, InputDocumentSchema
from app.storage.uploads import delete_uploaded_files, save_pdf_upload

router = APIRouter(prefix="/analysis", tags=["analysis"])
FilesParam = Annotated[list[UploadFile], File()]
TipoParam = Annotated[str, Form()]


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented",
    )


@router.post("", response_model=AnalysisRunSchema, status_code=status.HTTP_201_CREATED)
def create_analysis(session: DbSession) -> AnalysisRunSchema:
    return create_analysis_run(session)


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
    tipo: TipoParam,
    files: FilesParam,
    session: DbSession,
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


@router.post("/{analysis_id}/start")
async def start_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()


@router.get("/{analysis_id}", response_model=AnalysisRunSchema)
def get_analysis(analysis_id: int, session: DbSession) -> AnalysisRunSchema:
    analysis_run = get_analysis_run_by_id(session, analysis_id)
    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )
    return analysis_run


@router.get("/{analysis_id}/issues")
async def list_analysis_issues(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()


@router.get("/{analysis_id}/export")
async def export_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()
