from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.analysis_modes import ANALYSIS_MODE_DEFAULT


class AnalysisCreateSchema(BaseModel):
    analysis_mode: str = ANALYSIS_MODE_DEFAULT
    config: dict[str, Any] = Field(default_factory=dict)


class AnalysisRunSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    analysis_mode: str
    config: dict[str, Any]
    created_at: datetime


class InputDocumentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    analysis_run_id: int
    tipo: str
    original_filename: str
    file_path: str
    file_hash: str


class DocumentPageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    page_number: int


class TextSpanSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_page_id: int
    text: str
    bbox: Any | None


class ExtractedFieldSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    input_document_id: int | None
    document_page_id: int | None
    field_name: str
    raw_value: str
    normalized_value: str
    bbox: Any | None


class ExtractedFieldWithContextSchema(ExtractedFieldSchema):
    page: int | None
    document_filename: str
    document_tipo: str


class PackageSummaryIdentitySchema(BaseModel):
    project_code: str | None
    work_name: str | None
    bairro: str | None
    client: str | None
    date: str | None
    volumes: list[str]
    disciplines: list[str]


class PackageSummaryDocumentSchema(BaseModel):
    classification: str
    detected_project_codes: list[str]
    discipline: str | None
    document_id: int
    filename: str
    ld_pages: list[int]
    page_count: int
    tipo: str
    tomo: str | None
    volume: str | None


class PackageSummaryStatsSchema(BaseModel):
    document_count: int
    ld_count: int
    page_count: int
    volume_count: int


class PackageSummaryAlertSchema(BaseModel):
    severity: str
    message: str


class PackageSummarySchema(BaseModel):
    identity: PackageSummaryIdentitySchema
    documents: list[PackageSummaryDocumentSchema]
    stats: PackageSummaryStatsSchema
    alerts: list[PackageSummaryAlertSchema]


class DrawingListRowSchema(BaseModel):
    description: str
    document_code: str
    item: str
    page: int
    source_text: str


class DrawingListDocumentSchema(BaseModel):
    document_id: int
    filename: str
    project_codes: list[str]
    row_count: int
    rows: list[DrawingListRowSchema]
    tipo: str


class DrawingListStatsSchema(BaseModel):
    document_count: int
    row_count: int


class DrawingListsSchema(BaseModel):
    lists: list[DrawingListDocumentSchema]
    stats: DrawingListStatsSchema
