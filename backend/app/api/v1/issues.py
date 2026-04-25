from fastapi import APIRouter, HTTPException, status

from app.db.dependencies import DbSession
from app.db.issues import (
    get_issue_by_id,
    get_issue_with_evidences_by_id,
    upsert_review_decision,
)
from app.schemas.issue import IssueWithEvidencesSchema
from app.schemas.review import ReviewDecisionWriteSchema

router = APIRouter(prefix="/issues", tags=["issues"])


@router.get("/{issue_id}", response_model=IssueWithEvidencesSchema)
def get_issue(issue_id: int, session: DbSession) -> IssueWithEvidencesSchema:
    issue = get_issue_with_evidences_by_id(session, issue_id)
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found",
        )
    return issue


@router.post("/{issue_id}/review", response_model=IssueWithEvidencesSchema)
def review_issue(
    issue_id: int,
    payload: ReviewDecisionWriteSchema,
    session: DbSession,
) -> IssueWithEvidencesSchema:
    issue = get_issue_by_id(session, issue_id)
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found",
        )

    upsert_review_decision(
        session=session,
        issue_id=issue_id,
        decision=payload.decision,
        comment=payload.comment,
    )
    session.commit()

    reviewed_issue = get_issue_with_evidences_by_id(session, issue_id)
    if reviewed_issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found",
        )
    return reviewed_issue
