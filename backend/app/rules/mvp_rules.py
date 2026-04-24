from collections import defaultdict
from collections.abc import Sequence

from app.worker.field_definitions import FIELD_DEFINITIONS
from app.rules.types import (
    RuleExtractedField,
    RuleInputDocument,
    RuleIssueCandidate,
    RuleIssueEvidence,
)

SEVERITY_ATENCAO = "atencao"
SEVERITY_RELEVANTE = "relevante"
MISSING_FIELD_ISSUE_TYPE = "campo_obrigatorio_ausente"
DIVERGENCE_FIELDS = ("nome_obra", "numero_projeto")
REQUIRED_FIELD_NAMES = tuple(definition.field_name for definition in FIELD_DEFINITIONS)


def evaluate_mvp_rules(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    issues.extend(_build_divergence_issues(extracted_fields))
    issues.extend(_build_missing_field_issues(documents, extracted_fields))
    return issues


def _build_divergence_issues(
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    for field_name in DIVERGENCE_FIELDS:
        matching_fields = _list_fields_by_name(extracted_fields, field_name)
        distinct_values = sorted(
            {field.normalized_value for field in matching_fields if field.normalized_value}
        )
        if len(distinct_values) <= 1:
            continue

        issues.append(
            RuleIssueCandidate(
                type=f"{field_name}_divergente",
                severity=SEVERITY_RELEVANTE,
                description=(
                    f"Campo {field_name} possui valores divergentes entre documentos: "
                    f"{' | '.join(distinct_values)}."
                ),
                evidences=_build_evidences(matching_fields),
            )
        )

    return issues


def _build_missing_field_issues(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    if not documents:
        return []

    issues: list[RuleIssueCandidate] = []
    document_ids = {document.id for document in documents}

    for field_name in REQUIRED_FIELD_NAMES:
        present_fields = _list_fields_by_name(extracted_fields, field_name)
        present_document_ids = {
            field.input_document_id
            for field in present_fields
            if field.input_document_id is not None
        }
        if not present_document_ids:
            continue

        if present_document_ids == document_ids:
            continue

        issues.append(
            RuleIssueCandidate(
                type=MISSING_FIELD_ISSUE_TYPE,
                severity=SEVERITY_ATENCAO,
                description=f"Campo obrigatorio {field_name} ausente em um ou mais documentos.",
                evidences=_build_evidences(present_fields),
            )
        )

    return issues


def _list_fields_by_name(
    extracted_fields: Sequence[RuleExtractedField],
    field_name: str,
) -> list[RuleExtractedField]:
    grouped_fields: dict[int, list[RuleExtractedField]] = defaultdict(list)
    for field in extracted_fields:
        if field.field_name != field_name:
            continue
        if field.input_document_id is None or not field.normalized_value:
            continue
        grouped_fields[field.input_document_id].append(field)

    return [
        field
        for document_id in sorted(grouped_fields)
        for field in grouped_fields[document_id]
    ]


def _build_evidences(
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueEvidence]:
    evidences = [
        RuleIssueEvidence(
            field_id=field.id,
            page=field.page,
            bbox=field.bbox,
        )
        for field in extracted_fields
        if field.page is not None
    ]
    if not evidences:
        raise ValueError("Rule issue must contain evidence")
    return evidences
