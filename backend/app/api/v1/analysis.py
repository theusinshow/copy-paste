from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

router = APIRouter(prefix="/analysis", tags=["analysis"])
FilesParam = Annotated[list[UploadFile], File()]


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented",
    )


@router.post("")
async def create_analysis() -> None:
    _not_implemented()


@router.post("/{analysis_id}/files")
async def upload_analysis_files(analysis_id: int, files: FilesParam) -> None:
    del analysis_id, files
    _not_implemented()


@router.post("/{analysis_id}/start")
async def start_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()


@router.get("/{analysis_id}/issues")
async def list_analysis_issues(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()


@router.get("/{analysis_id}/export")
async def export_analysis(analysis_id: int) -> None:
    del analysis_id
    _not_implemented()
