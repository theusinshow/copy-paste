from dataclasses import dataclass


@dataclass(frozen=True)
class RuleInputDocument:
    id: int


@dataclass(frozen=True)
class RuleExtractedField:
    id: int
    input_document_id: int | None
    field_name: str
    raw_value: str
    normalized_value: str
    page: int | None
    bbox: dict[str, float] | None


@dataclass(frozen=True)
class RuleIssueEvidence:
    field_id: int
    page: int
    bbox: dict[str, float] | None


@dataclass(frozen=True)
class RuleIssueCandidate:
    type: str
    severity: str
    description: str
    evidences: list[RuleIssueEvidence]
