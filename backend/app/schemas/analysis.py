from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AnalysisRunSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
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
