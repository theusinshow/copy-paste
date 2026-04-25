from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.review import ReviewDecisionSchema


class IssueSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_run_id: int
    type: str
    severity: str
    description: str


class IssueEvidenceSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    issue_id: int
    field_id: int
    page: int
    bbox: Any | None


class IssueEvidenceReadSchema(IssueEvidenceSchema):
    text: str


class IssueWithEvidencesSchema(IssueSchema):
    evidences: list[IssueEvidenceReadSchema]
    review: ReviewDecisionSchema | None = None
    review_status: str
    review_status_label: str
