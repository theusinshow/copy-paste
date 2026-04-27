from collections import defaultdict
from collections.abc import Sequence
import re
import unicodedata

from app.core.analysis_modes import (
    ANALYSIS_MODE_CHECK_ADDRESS,
    ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
    ANALYSIS_MODE_CHECK_WORK_NAME,
)
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
DIVERGENCE_FIELDS = ("nome_obra", "numero_projeto", "bairro", "municipio", "orgao_cliente")
REQUIRED_FIELD_NAMES = tuple(definition.field_name for definition in FIELD_DEFINITIONS)
TARGETED_CHECK_FIELDS = {
    ANALYSIS_MODE_CHECK_ADDRESS: "endereco",
    ANALYSIS_MODE_CHECK_PROJECT_NUMBER: "numero_projeto",
    ANALYSIS_MODE_CHECK_WORK_NAME: "nome_obra",
}
WHITESPACE_PATTERN = re.compile(r"\s+")
NON_ALNUM_PATTERN = re.compile(r"[^A-Z0-9]+")
PARENTHETICAL_PATTERN = re.compile(r"\([^)]*\)")
TRAILING_CODE_PATTERN = re.compile(r"\b\d+\s+\d+$")
SHEET_ITEM_PATTERN = re.compile(r"^\s*(\d{1,2})\s*/\s*(\d{1,2})\s*$")


def evaluate_mvp_rules(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    issues.extend(_build_divergence_issues(extracted_fields))
    issues.extend(_build_missing_field_issues(documents, extracted_fields))
    issues.extend(_build_sheet_sequence_issues(extracted_fields))
    return issues


def evaluate_targeted_check_rules(
    extracted_fields: Sequence[RuleExtractedField],
    analysis_mode: str | None,
    config: dict,
) -> list[RuleIssueCandidate]:
    field_name = TARGETED_CHECK_FIELDS.get(analysis_mode or "")
    if field_name is None:
        return []

    expected = str(config.get("expected", "")).strip()
    if not expected:
        return []

    expected_normalized = _normalize_rule_value(expected)
    divergent_fields = [
        field
        for field in _list_fields_by_name(extracted_fields, field_name)
        if _normalize_rule_value(field.normalized_value or field.raw_value)
        != expected_normalized
    ]
    if not divergent_fields:
        return []

    return [
        RuleIssueCandidate(
            type=f"{field_name}_diferente_do_esperado",
            severity=SEVERITY_RELEVANTE,
            description=(
                f"Campo {field_name} diferente do valor esperado: {expected}."
            ),
            evidences=_build_evidences(divergent_fields),
        )
    ]


def _build_divergence_issues(
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    for field_name in DIVERGENCE_FIELDS:
        matching_fields = _list_fields_by_name(extracted_fields, field_name)
        distinct_values = sorted(
            {
                _normalize_rule_value_for_field(
                    field.field_name,
                    field.normalized_value or field.raw_value,
                )
                for field in matching_fields
                if field.normalized_value or field.raw_value
            }
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

        missing_count = len(document_ids - present_document_ids)
        severity = (
            SEVERITY_RELEVANTE
            if missing_count > len(present_document_ids)
            else SEVERITY_ATENCAO
        )
        issues.append(
            RuleIssueCandidate(
                type=MISSING_FIELD_ISSUE_TYPE,
                severity=severity,
                description=(
                    f"Campo obrigatorio {field_name} ausente em "
                    f"{missing_count} de {len(document_ids)} documentos."
                ),
                evidences=_build_evidences(present_fields),
            )
        )

    return issues


def _build_sheet_sequence_issues(
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    folha_fields = _list_fields_by_name(extracted_fields, "folha")
    if not folha_fields:
        return []

    parsed: list[tuple[int, int, RuleExtractedField]] = []
    for field in folha_fields:
        raw = (field.raw_value or "").strip()
        match = SHEET_ITEM_PATTERN.match(raw)
        if not match:
            continue
        current, total = int(match.group(1)), int(match.group(2))
        if 1 <= current <= total <= 99:
            parsed.append((current, total, field))

    if not parsed:
        return []

    issues: list[RuleIssueCandidate] = []

    totals = {total for _, total, _ in parsed}
    if len(totals) > 1:
        representative_fields = [f for _, _, f in parsed if f.page is not None]
        if representative_fields:
            issues.append(
                RuleIssueCandidate(
                    type="folha_total_inconsistente",
                    severity=SEVERITY_RELEVANTE,
                    description=(
                        "Documentos declaram totais de folhas diferentes: "
                        f"{' | '.join(str(t) for t in sorted(totals))}."
                    ),
                    evidences=_build_evidences(representative_fields),
                )
            )

    total_counter: dict[int, int] = defaultdict(int)
    for _, total, _ in parsed:
        total_counter[total] += 1
    dominant_total = max(total_counter, key=lambda t: total_counter[t])
    present_numbers = {current for current, total, _ in parsed if total == dominant_total}
    missing_numbers = set(range(1, dominant_total + 1)) - present_numbers

    if missing_numbers:
        representative_fields = [
            f for _, total, f in parsed if total == dominant_total and f.page is not None
        ]
        if representative_fields:
            issues.append(
                RuleIssueCandidate(
                    type="folha_ausente_na_sequencia",
                    severity=SEVERITY_RELEVANTE,
                    description=(
                        f"Lacuna na sequencia de folhas (total declarado: {dominant_total}). "
                        f"Folhas ausentes: {', '.join(str(n).zfill(2) for n in sorted(missing_numbers))}."
                    ),
                    evidences=_build_evidences(representative_fields),
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


def _normalize_rule_value(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.upper()
    value = NON_ALNUM_PATTERN.sub(" ", value)
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _normalize_rule_value_for_field(field_name: str, value: str) -> str:
    if field_name == "bairro":
        value = PARENTHETICAL_PATTERN.sub(" ", value)
        value = TRAILING_CODE_PATTERN.sub(" ", value)

    return _normalize_rule_value(value)
