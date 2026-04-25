from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.review_decisions import normalize_review_decision


class ReviewDecisionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    issue_id: int
    decision: str
    decision_label: str
    comment: str
    status: str
    status_label: str


class ReviewDecisionWriteSchema(BaseModel):
    decision: str
    comment: str = ""

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, value: str) -> str:
        return normalize_review_decision(value)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str) -> str:
        return value.strip()


class ReviewDecisionBatchWriteSchema(BaseModel):
    issue_ids: list[int] = Field(min_length=1)
    decision: str
    comment: str = ""

    @field_validator("issue_ids")
    @classmethod
    def validate_issue_ids(cls, value: list[int]) -> list[int]:
        normalized_ids = sorted(set(value))
        if any(issue_id <= 0 for issue_id in normalized_ids):
            raise ValueError("issue_ids must contain only positive integers")
        return normalized_ids

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, value: str) -> str:
        return normalize_review_decision(value)

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str) -> str:
        return value.strip()


class ReviewDecisionBatchResultSchema(BaseModel):
    comment: str
    decision: str
    decision_label: str
    issue_ids: list[int]
    updated_count: int
