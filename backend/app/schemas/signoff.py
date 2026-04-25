from datetime import datetime

from pydantic import BaseModel, field_validator

from app.core.audit_closure import normalize_audit_status


class AnalysisSignoffSchema(BaseModel):
    analysis_run_id: int
    comment: str
    created_at: datetime
    final_status_code: str
    final_status_label: str
    reviewer_name: str
    updated_at: datetime


class AnalysisSignoffWriteSchema(BaseModel):
    comment: str = ""
    final_status_code: str
    reviewer_name: str

    @field_validator("comment")
    @classmethod
    def normalize_comment(cls, value: str) -> str:
        return value.strip()

    @field_validator("final_status_code")
    @classmethod
    def validate_final_status_code(cls, value: str) -> str:
        return normalize_audit_status(value)

    @field_validator("reviewer_name")
    @classmethod
    def validate_reviewer_name(cls, value: str) -> str:
        normalized_value = value.strip()
        if not normalized_value:
            raise ValueError("reviewer_name must be a non-empty string")
        return normalized_value
