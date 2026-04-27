from collections import defaultdict
from collections.abc import Sequence
from datetime import date
import re
import unicodedata

from app.core.analysis_modes import (
    ANALYSIS_MODE_CHECK_ADDRESS,
    ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
    ANALYSIS_MODE_CHECK_WORK_NAME,
)
from app.core.expected_identity import extract_expected_identity
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
DIVERGENCE_FIELDS = ("nome_obra", "numero_projeto", "bairro", "municipio")
NON_BLOCKING_FIELD_NAMES = {"orgao_cliente"}
REQUIRED_FIELD_NAMES = tuple(
    definition.field_name
    for definition in FIELD_DEFINITIONS
    if definition.field_name not in NON_BLOCKING_FIELD_NAMES
)
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
DATE_DMY_PATTERN = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")
DATE_MY_PATTERN = re.compile(r"^(\d{1,2})/(\d{4})$")
DATE_Y_PATTERN = re.compile(r"^(\d{4})$")
DATE_OUTDATED_YEARS = 2
PROJECT_CODE_VALUE_PATTERN = re.compile(r"\b\d{2,4}\s*[-_]\s*\d{2,4}\b")
SINGLE_VALUE_STOPWORDS = {"A", "AS", "COM", "DA", "DAS", "DE", "DO", "DOS", "E", "EM", "O", "OS"}
REFERENCE_FIELD_LABELS = {
    "bairro": "bairro",
    "endereco": "endereco",
    "municipio": "município",
    "nome_obra": "nome da obra",
    "numero_projeto": "número do projeto",
    "orgao_cliente": "órgão/cliente",
}
FLEXIBLE_REFERENCE_FIELDS = {"endereco", "municipio", "nome_obra", "orgao_cliente"}
REFERENCE_STOPWORDS = SINGLE_VALUE_STOPWORDS | {
    "CLIENTE",
    "MUNICIPAL",
    "MUNICIPIO",
    "MUNICÍPIO",
    "PREFEITURA",
}


def evaluate_mvp_rules(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
    config: dict | None = None,
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    expected_identity = extract_expected_identity(config or {})
    issues.extend(_build_expected_identity_issues(extracted_fields, expected_identity))
    issues.extend(
        _build_divergence_issues(
            extracted_fields,
            ignored_fields=set(expected_identity),
        )
    )
    issues.extend(_build_missing_field_issues(documents, extracted_fields))
    issues.extend(_build_sheet_sequence_issues(extracted_fields))
    issues.extend(_build_date_issues(extracted_fields))
    return issues


def _build_expected_identity_issues(
    extracted_fields: Sequence[RuleExtractedField],
    expected_identity: dict[str, str],
) -> list[RuleIssueCandidate]:
    if not expected_identity:
        return []

    issues: list[RuleIssueCandidate] = []
    for field_name, expected_value in expected_identity.items():
        matching_fields = _list_fields_by_name(extracted_fields, field_name)
        divergent_fields = [
            field
            for field in matching_fields
            if not _field_matches_expected(
                field_name,
                field.normalized_value or field.raw_value,
                expected_value,
            )
        ]
        if not divergent_fields:
            continue

        label = REFERENCE_FIELD_LABELS.get(field_name, field_name)
        issues.append(
            RuleIssueCandidate(
                type=f"{field_name}_diferente_da_referencia",
                severity=SEVERITY_RELEVANTE,
                description=(
                    f"Conferir {label}; foi encontrado valor diferente da referência "
                    f"informada: {expected_value}."
                ),
                evidences=_build_evidences(divergent_fields),
            )
        )

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
    ignored_fields: set[str] | None = None,
) -> list[RuleIssueCandidate]:
    issues: list[RuleIssueCandidate] = []
    ignored_fields = ignored_fields or set()
    for field_name in DIVERGENCE_FIELDS:
        if field_name in ignored_fields:
            continue
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
                    f"Conferir campo {field_name}; foram encontrados valores diferentes entre documentos: "
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
                    f"Conferir campo {field_name}; ele não foi encontrado em "
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
                        "Conferir totais de folhas declarados nos documentos: "
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
                        f"Conferir sequência de folhas (total declarado: {dominant_total}). "
                        f"Folhas ausentes: {', '.join(str(n).zfill(2) for n in sorted(missing_numbers))}."
                    ),
                    evidences=_build_evidences(representative_fields),
                )
            )

    return issues


def _build_date_issues(
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    data_fields = _list_fields_by_name(extracted_fields, "data_emissao")
    if not data_fields:
        return []

    parsed: list[tuple[date, RuleExtractedField]] = []
    for field in data_fields:
        parsed_date = _try_parse_date(field.raw_value or "")
        if parsed_date is not None:
            parsed.append((parsed_date, field))

    if not parsed:
        return []

    today = date.today()
    issues: list[RuleIssueCandidate] = []

    future_fields = [f for d, f in parsed if d > today and f.page is not None]
    if future_fields:
        issues.append(
            RuleIssueCandidate(
                type="data_emissao_futura",
                severity=SEVERITY_RELEVANTE,
                description="Conferir data de emissão: há documento com data no futuro.",
                evidences=_build_evidences(future_fields),
            )
        )

    cutoff = date(today.year - DATE_OUTDATED_YEARS, today.month, today.day)
    old_fields = [f for d, f in parsed if d < cutoff and f.page is not None]
    if old_fields:
        issues.append(
            RuleIssueCandidate(
                type="data_emissao_desatualizada",
                severity=SEVERITY_ATENCAO,
                description=f"Conferir data de emissão: há documento com data superior a {DATE_OUTDATED_YEARS} anos.",
                evidences=_build_evidences(old_fields),
            )
        )

    distinct_dates = {d for d, _ in parsed}
    if len(distinct_dates) > 1:
        fields_with_page = [f for _, f in parsed if f.page is not None]
        if fields_with_page:
            date_labels = " | ".join(sorted(str(d) for d in distinct_dates))
            issues.append(
                RuleIssueCandidate(
                    type="data_emissao_divergente",
                    severity=SEVERITY_RELEVANTE,
                    description=f"Conferir datas de emissão entre documentos: {date_labels}.",
                    evidences=_build_evidences(fields_with_page),
                )
            )

    return issues


def _try_parse_date(raw: str) -> date | None:
    raw = raw.strip()
    m = DATE_DMY_PATTERN.match(raw)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            pass
    m = DATE_MY_PATTERN.match(raw)
    if m:
        try:
            return date(int(m.group(2)), int(m.group(1)), 1)
        except ValueError:
            pass
    m = DATE_Y_PATTERN.match(raw)
    if m:
        year = int(m.group(1))
        if 1990 <= year <= 2100:
            return date(year, 1, 1)
    return None


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
        if not _is_usable_field_value(field.field_name, field.normalized_value or field.raw_value):
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


def _field_matches_expected(field_name: str, value: str, expected_value: str) -> bool:
    normalized_value = _normalize_rule_value_for_field(field_name, value)
    normalized_expected = _normalize_rule_value_for_field(field_name, expected_value)
    if not normalized_value or not normalized_expected:
        return True

    if normalized_value == normalized_expected:
        return True

    if field_name not in FLEXIBLE_REFERENCE_FIELDS:
        return False

    if normalized_value in normalized_expected or normalized_expected in normalized_value:
        return True

    value_tokens = _reference_tokens(normalized_value)
    expected_tokens = _reference_tokens(normalized_expected)
    if not value_tokens or not expected_tokens:
        return False
    return expected_tokens.issubset(value_tokens) or value_tokens.issubset(expected_tokens)


def _reference_tokens(value: str) -> set[str]:
    return {
        token
        for token in value.split()
        if token not in REFERENCE_STOPWORDS and len(token) > 1
    }


def _is_usable_field_value(field_name: str, value: str) -> bool:
    normalized_value = _normalize_rule_value_for_field(field_name, value)
    if not normalized_value:
        return False

    if field_name == "numero_projeto":
        return PROJECT_CODE_VALUE_PATTERN.search(value) is not None

    if field_name in {"bairro", "municipio"}:
        if normalized_value in SINGLE_VALUE_STOPWORDS or len(normalized_value) <= 2:
            return False
        if len(normalized_value.split()) > 5:
            return False

    return True
