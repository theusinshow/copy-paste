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


class AuditSummaryStatusSchema(BaseModel):
    code: str
    label: str
    summary: str
    tone: str


class AuditSummaryHighlightSchema(BaseModel):
    message: str
    tone: str


class AuditSummaryMetricsSchema(BaseModel):
    active_issue_count: int
    attention_count: int
    dismissed_issue_count: int
    document_count: int
    incomplete_count: int
    inconclusive_issue_count: int
    issue_count: int
    ld_row_count: int
    page_count: int
    pending_review_count: int
    relevant_count: int
    resolved_issue_count: int
    reviewed_issue_count: int
    sheet_count: int
    undeclared_sheet_count: int


class AuditSummarySourceSchema(BaseModel):
    active_count: int
    attention_count: int
    dismissed_count: int
    incomplete_count: int
    inconclusive_count: int
    item_count: int
    label: str
    pending_review_count: int
    relevant_count: int
    resolved_count: int
    reviewed_count: int
    source: str
    summary: str
    undeclared_sheet_count: int = 0


class AuditSummarySchema(BaseModel):
    highlights: list[AuditSummaryHighlightSchema]
    metrics: AuditSummaryMetricsSchema
    sources: list[AuditSummarySourceSchema]
    status: AuditSummaryStatusSchema


class DirectedModeStatsSchema(BaseModel):
    divergent_count: int
    document_count: int
    matching_count: int
    occurrence_count: int
    page_count: int


class DirectedModeEntrySchema(BaseModel):
    bbox: Any | None
    context: str
    document_id: int | None
    expected_value: str | None
    field_name: str | None
    filename: str
    kind: str
    page: int | None
    replacement_preview: str | None
    severity: str
    value: str


class DirectedModeOutputSchema(BaseModel):
    entries: list[DirectedModeEntrySchema]
    expected: str | None
    field_label: str | None
    mode: str
    query: str | None
    replace: str | None
    stats: DirectedModeStatsSchema
    summary: str
    title: str


class PackageMapSectionSchema(BaseModel):
    document_id: int
    document_filename: str
    end_page: int
    ld_codes: list[str]
    ld_page: int | None
    ld_row_count: int
    scope_id: int
    section_label: str
    section_type: str
    sheet_codes: list[str]
    sheet_count: int
    start_page: int
    title: str


class PackageMapDocumentSchema(BaseModel):
    classification: str
    discipline: str | None
    document_id: int
    filename: str
    page_count: int
    sections: list[PackageMapSectionSchema]
    tipo: str
    tomo: str | None
    volume: str | None


class PackageMapStatsSchema(BaseModel):
    document_count: int
    ld_section_count: int
    section_count: int
    sheet_count: int


class PackageMapSchema(BaseModel):
    documents: list[PackageMapDocumentSchema]
    identity: PackageSummaryIdentitySchema
    stats: PackageMapStatsSchema


class AiReviewContextSchema(BaseModel):
    document_id: int
    evidence_text: str
    filename: str
    kind: str
    page_end: int
    page_start: int
    section_label: str
    title: str


class AiReviewSuggestionSchema(BaseModel):
    category: str
    message: str
    reason: str
    severity: str
    source: str


class AiReviewStatsSchema(BaseModel):
    context_count: int
    needs_review_count: int
    probable_issue_count: int
    suggestion_count: int


class AiReviewSchema(BaseModel):
    contexts: list[AiReviewContextSchema]
    identity: PackageSummaryIdentitySchema
    mode: str
    provider_status: str
    summary: str
    suggestions: list[AiReviewSuggestionSchema]
    stats: AiReviewStatsSchema


class PageMapPageSchema(BaseModel):
    confidence: str
    discipline_code: str | None
    discipline_label: str | None
    discipline_type: str | None
    document_id: int
    evidence_text: str
    filename: str
    page: int
    page_type: str
    page_type_label: str
    scope_id: int | None
    signals: list[str]


class PageMapDocumentSchema(BaseModel):
    document_id: int
    filename: str
    page_count: int
    pages: list[PageMapPageSchema]
    tipo: str


class PageMapStatsSchema(BaseModel):
    document_count: int
    low_confidence_count: int
    page_count: int
    page_type_counts: dict[str, int]


class PageMapSchema(BaseModel):
    documents: list[PageMapDocumentSchema]
    stats: PageMapStatsSchema


class DrawingListRowSchema(BaseModel):
    description: str
    document_code: str
    item: str
    page: int
    source_text: str


class FooterAuditIdentitySchema(BaseModel):
    project_code: str | None
    work_name: str | None


class FooterAuditOccurrenceSchema(BaseModel):
    document_id: int
    field: str
    field_label: str
    filename: str
    normalized_value: str
    page: int
    source_text: str
    value: str


class FooterAuditFindingSchema(BaseModel):
    category: str
    field: str
    message: str
    occurrences: list[FooterAuditOccurrenceSchema]
    reason: str
    severity: str


class FooterAuditStatsSchema(BaseModel):
    document_count: int
    footer_page_count: int
    needs_review_count: int
    occurrence_count: int
    probable_issue_count: int


class FooterAuditSchema(BaseModel):
    findings: list[FooterAuditFindingSchema]
    identity: FooterAuditIdentitySchema
    occurrences: list[FooterAuditOccurrenceSchema]
    stats: FooterAuditStatsSchema


class DrawingListDocumentSchema(BaseModel):
    document_id: int
    filename: str
    project_codes: list[str]
    row_count: int
    rows: list[DrawingListRowSchema]
    tipo: str


class DrawingListStatsSchema(BaseModel):
    alert_count: int
    document_count: int
    row_count: int


class DrawingListAlertSchema(BaseModel):
    description: str
    document_code: str
    filename: str
    item: str
    message: str
    page: int
    severity: str
    source_text: str
    type: str


class DrawingListsSchema(BaseModel):
    alerts: list[DrawingListAlertSchema]
    lists: list[DrawingListDocumentSchema]
    stats: DrawingListStatsSchema


class DetectedSheetSchema(BaseModel):
    description: str | None
    item: str | None
    page: int
    sheet_code: str
    source_text: str


class DetectedSheetDocumentSchema(BaseModel):
    document_id: int
    filename: str
    sheet_count: int
    sheets: list[DetectedSheetSchema]
    tipo: str


class DetectedSheetsStatsSchema(BaseModel):
    document_count: int
    sheet_count: int


class DetectedSheetsSchema(BaseModel):
    documents: list[DetectedSheetDocumentSchema]
    stats: DetectedSheetsStatsSchema


class LdSheetMatchedSheetSchema(BaseModel):
    description: str | None
    filename: str
    item: str | None
    page: int
    scope_id: int | None = None
    sheet_code: str
    source_text: str


class LdMatchedRowSchema(BaseModel):
    description: str
    document_code: str
    filename: str
    item: str
    page: int
    scope_id: int | None = None
    source_text: str


class LdSheetCrosscheckResultSchema(BaseModel):
    category: str
    ld_description: str
    ld_document_code: str
    ld_filename: str
    ld_item: str
    ld_page: int
    ld_scope_id: int | None = None
    ld_source_text: str
    matched_sheet: LdSheetMatchedSheetSchema | None
    message: str
    reason: str
    severity: str
    type: str


class DetectedSheetCrosscheckResultSchema(BaseModel):
    category: str
    matched_ld_row: LdMatchedRowSchema | None
    message: str
    reason: str
    severity: str
    sheet_code: str
    sheet_description: str | None
    sheet_filename: str
    sheet_item: str | None
    sheet_page: int
    sheet_scope_id: int | None = None
    sheet_source_text: str
    type: str


class LdSheetCrosscheckStatsSchema(BaseModel):
    attention_count: int
    compatible_count: int
    combined_extraction_limit_count: int
    combined_needs_review_count: int
    combined_probable_issue_count: int
    extraction_limit_count: int
    needs_review_count: int
    ok_count: int
    probable_issue_count: int
    relevant_count: int
    reverse_extraction_limit_count: int
    reverse_needs_review_count: int
    reverse_other_document_count: int
    reverse_other_section_count: int
    reverse_probable_issue_count: int
    reverse_total_count: int
    total_count: int
    undeclared_sheet_count: int


class LdSheetCrosscheckSchema(BaseModel):
    results: list[LdSheetCrosscheckResultSchema]
    reverse_results: list[DetectedSheetCrosscheckResultSchema]
    stats: LdSheetCrosscheckStatsSchema


class MemorialAuditIdentitySchema(BaseModel):
    bairro: str | None
    municipality: str | None
    project_code: str | None
    work_name: str | None


class MemorialAuditOccurrenceSchema(BaseModel):
    document_id: int
    field: str
    field_label: str
    filename: str
    normalized_value: str
    page: int
    source_text: str
    value: str


class MemorialAuditFindingSchema(BaseModel):
    category: str
    field: str
    message: str
    occurrences: list[MemorialAuditOccurrenceSchema]
    reason: str
    severity: str


class MemorialAuditStatsSchema(BaseModel):
    document_count: int
    extraction_limit_count: int
    needs_review_count: int
    occurrence_count: int
    probable_issue_count: int


class MemorialAuditSchema(BaseModel):
    findings: list[MemorialAuditFindingSchema]
    identity: MemorialAuditIdentitySchema
    occurrences: list[MemorialAuditOccurrenceSchema]
    stats: MemorialAuditStatsSchema
