from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.db.analysis_runs import (
    create_analysis_run,
    get_analysis_run_by_id,
    list_analysis_runs,
)
from app.db.dependencies import DbSession
from app.schemas.analysis import AnalysisRunSchema

router = APIRouter(prefix="/analysis", tags=["analysis"])
FilesParam = Annotated[list[UploadFile], File()]


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


@router.post("/{analysis_id}/files")
async def upload_analysis_files(analysis_id: int, files: FilesParam) -> None:
    del analysis_id, files
    _not_implemented()


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
