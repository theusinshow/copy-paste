from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/issues", tags=["issues"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented",
    )


@router.get("/{issue_id}")
async def get_issue(issue_id: int) -> None:
    del issue_id
    _not_implemented()


@router.post("/{issue_id}/review")
async def review_issue(issue_id: int) -> None:
    del issue_id
    _not_implemented()
