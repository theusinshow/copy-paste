import re
import unicodedata
from collections import Counter
from typing import Any

from app.models.input_document import InputDocument
from app.worker.package_summary import build_package_summary

ADDRESS_LABEL_PATTERN = re.compile(
    r"\bENDEREC[O0]:\s*(?P<value>.+?)(?=\s+(?:NUMERO|N[UÚ]MERO|RESPONSAVEL|RESPONS[ÁA]VEL|CLIENTE|CONTEUDO|CONTE[ÚU]DO|PRANCHA|OBRA|BAIRRO|MUNICIPIO|MUNIC[ÍI]PIO)\b|$)",
)
STREET_PATTERN = re.compile(
    r"\b(?P<value>(?:RUA|AVENIDA|AV\.|RODOVIA|ESTRADA|TRAVESSA|ALAMEDA)\s+"
    r"[A-Z0-9 .,'ºª/-]{4,120})"
)
BAIRRO_PATTERN = re.compile(
    r"\bBAIRRO[:\s]+(?P<value>.+?)(?=\s+(?:BAIRRO|VOLUME|ENDEREC[O0]|MUNICIPIO|MUNIC[ÍI]PIO|NUMERO|N[UÚ]MERO|PROJETO|CLIENTE|$))"
)
MUNICIPALITY_PATTERN = re.compile(
    r"\b(?:MUNICIPIO|MUNIC[ÍI]PIO|CIDADE)\s+(?:DE\s+)?(?P<value>[A-Z ]{3,40})"
)
INSTITUTION_MUNICIPALITY_PATTERN = re.compile(
    r"\b(?:PREFEITURA(?:\s+MUNICIPAL)?|GOVERNO\s+DO\s+MUNICIPIO|GOVERNO\s+DO\s+MUNIC[ÍI]PIO)"
    r"\s+DE\s+(?P<value>[A-Z ]{3,40})"
)
OWNER_PATTERN = re.compile(
    r"\b(?:PROPRIETARIO|PROPRIET[ÁA]RIO|CLIENTE|CONTRATANTE)[:\s]+"
    r"(?P<value>(?:PREFEITURA|MUNICIPIO|MUNIC[ÍI]PIO|GOVERNO)[A-Z ]{3,80})"
)
PROJECT_CODE_PATTERN = re.compile(r"\b(?:\d{3,4}[-_]\d{2}|\d{2}[-_]\d{3,4})\b")
WORK_NAME_PATTERN = re.compile(
    r"\bUBS\s+[A-Z0-9 ]{3,50}?\s*(?:-|–)\s*PORTE\s*\d+\b"
)
WHITESPACE_PATTERN = re.compile(r"\s+")
SINGLE_VALUE_STOPWORDS = {"A", "AS", "COM", "DA", "DAS", "DE", "DO", "DOS", "E", "EM", "O", "OS"}

FIELD_LABELS = {
    "address": "Endereço",
    "bairro": "Bairro",
    "municipality": "Município",
    "owner": "Proprietário",
    "project_code": "Número do projeto",
    "work_name": "Obra",
}


def build_memorial_audit(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    package_summary = build_package_summary(documents, page_texts_by_document_id)
    identity = package_summary["identity"]
    target_documents = _select_memorial_documents(documents, page_texts_by_document_id)
    occurrences = [
        occurrence
        for document in target_documents
        for page_number, page_text in sorted(
            page_texts_by_document_id.get(document.id, {}).items()
        )
        for occurrence in _extract_occurrences(document, page_number, page_text)
    ]
    findings = _build_findings(occurrences, identity)

    return {
        "findings": findings,
        "identity": {
            "bairro": identity.get("bairro"),
            "municipality": _infer_identity_municipality(identity),
            "project_code": identity.get("project_code"),
            "work_name": identity.get("work_name"),
        },
        "occurrences": occurrences,
        "stats": {
            "document_count": len(target_documents),
            "extraction_limit_count": sum(
                1 for finding in findings if finding["category"] == "extraction_limit"
            ),
            "needs_review_count": sum(
                1 for finding in findings if finding["category"] == "needs_review"
            ),
            "occurrence_count": len(occurrences),
            "probable_issue_count": sum(
                1 for finding in findings if finding["category"] == "probable_issue"
            ),
        },
    }


def _select_memorial_documents(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> list[InputDocument]:
    selected: list[InputDocument] = []
    for document in documents:
        filename = _normalize_text(document.original_filename)
        first_pages = " ".join(
            page_text
            for page_number, page_text in sorted(
                page_texts_by_document_id.get(document.id, {}).items()
            )[:2]
        )
        first_pages = _normalize_text(first_pages)
        if (
            "MEMORIAL" in filename
            or "_MD_" in filename
            or re.search(r"\bVOLUME\s+1\b.+\bMEMORIAL DESCRITIVO\b", first_pages)
        ):
            selected.append(document)
    return selected


def _extract_occurrences(
    document: InputDocument,
    page_number: int,
    page_text: str,
) -> list[dict[str, Any]]:
    text = _normalize_text(page_text)
    occurrences: list[dict[str, Any]] = []

    _append_occurrences(
        document, page_number, text, "address", ADDRESS_LABEL_PATTERN, occurrences
    )
    _append_occurrences(document, page_number, text, "address", STREET_PATTERN, occurrences)
    _append_occurrences(document, page_number, text, "bairro", BAIRRO_PATTERN, occurrences)
    _append_occurrences(
        document, page_number, text, "municipality", MUNICIPALITY_PATTERN, occurrences
    )
    _append_occurrences(
        document,
        page_number,
        text,
        "municipality",
        INSTITUTION_MUNICIPALITY_PATTERN,
        occurrences,
    )
    _append_occurrences(document, page_number, text, "owner", OWNER_PATTERN, occurrences)
    _append_occurrences(
        document, page_number, text, "project_code", PROJECT_CODE_PATTERN, occurrences
    )
    _append_occurrences(document, page_number, text, "work_name", WORK_NAME_PATTERN, occurrences)

    return _dedupe_occurrences(occurrences)


def _append_occurrences(
    document: InputDocument,
    page_number: int,
    page_text: str,
    field: str,
    pattern: re.Pattern,
    occurrences: list[dict[str, Any]],
) -> None:
    for match in pattern.finditer(page_text):
        value = match.groupdict().get("value") or match.group(0)
        occurrence = _build_occurrence(document, page_number, field, value, page_text, match)
        if _is_valid_occurrence(occurrence):
            occurrences.append(occurrence)


def _build_occurrence(
    document: InputDocument,
    page_number: int,
    field: str,
    value: str,
    page_text: str,
    match: re.Match,
) -> dict[str, Any]:
    clean_value = _clean_value(field, value)
    return {
        "document_id": document.id,
        "field": field,
        "field_label": FIELD_LABELS[field],
        "filename": document.original_filename,
        "normalized_value": _normalize_comparable(clean_value),
        "page": page_number,
        "source_text": _extract_source_text(page_text, match.start(), match.end()),
        "value": clean_value,
    }


def _build_findings(
    occurrences: list[dict[str, Any]],
    identity: dict[str, Any],
) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    occurrences_by_field = _group_occurrences_by_field(occurrences)

    findings.extend(
        _build_expected_value_findings(
            occurrences_by_field.get("project_code", []),
            expected_value=identity.get("project_code"),
            field="project_code",
        )
    )
    findings.extend(
        _build_expected_value_findings(
            occurrences_by_field.get("bairro", []),
            expected_value=identity.get("bairro"),
            field="bairro",
        )
    )
    findings.extend(
        _build_expected_value_findings(
            occurrences_by_field.get("work_name", []),
            expected_value=identity.get("work_name"),
            field="work_name",
        )
    )

    identity_municipality = _infer_identity_municipality(identity)
    findings.extend(
        _build_expected_value_findings(
            occurrences_by_field.get("municipality", []),
            expected_value=identity_municipality,
            field="municipality",
        )
    )
    findings.extend(_build_multiple_value_findings(occurrences_by_field.get("address", [])))
    findings.extend(
        _build_multiple_value_findings(
            occurrences_by_field.get("municipality", []),
            field="municipality",
        )
    )
    findings.extend(
        _build_multiple_value_findings(
            occurrences_by_field.get("project_code", []),
            field="project_code",
        )
    )
    if not occurrences:
        findings.append(
            {
                "category": "extraction_limit",
                "field": "memorial",
                "message": "Nenhum campo de identidade foi detectado nos memoriais.",
                "occurrences": [],
                "reason": "no_memorial_identity_fields_detected",
                "severity": "atencao",
            }
        )

    return findings


def _build_owner_municipality_findings(
    owner_occurrences: list[dict[str, Any]],
    municipality_occurrences: list[dict[str, Any]],
    identity_municipality: str | None,
) -> list[dict[str, Any]]:
    if not owner_occurrences:
        return []

    expected_city = identity_municipality or _dominant_value(municipality_occurrences)
    if not expected_city:
        return []

    expected_normalized = _normalize_comparable(expected_city)
    findings: list[dict[str, Any]] = []
    for occurrence in owner_occurrences:
        owner_city = _extract_city_from_owner(occurrence["value"])
        if not owner_city:
            continue
        owner_city_normalized = _normalize_comparable(owner_city)
        if owner_city_normalized == expected_normalized:
            continue
        findings.append(
            {
                "category": "probable_issue",
                "field": "owner",
                "message": (
                    "Conferir proprietário/cliente e município do memorial. "
                    f"Esperado: {expected_city}. Encontrado: {occurrence['value']}."
                ),
                "occurrences": [occurrence],
                "reason": "owner_city_differs_from_memorial_municipality",
                "severity": "relevante",
            }
        )
    return findings


def _build_expected_value_findings(
    occurrences: list[dict[str, Any]],
    expected_value: str | None,
    field: str,
) -> list[dict[str, Any]]:
    if not occurrences or not expected_value:
        return []

    expected_normalized = _normalize_comparable(expected_value)
    divergent = [
        occurrence
        for occurrence in occurrences
        if occurrence["normalized_value"]
        and occurrence["normalized_value"] != expected_normalized
        and expected_normalized not in occurrence["normalized_value"]
        and occurrence["normalized_value"] not in expected_normalized
    ]
    if not divergent:
        return []

    label = FIELD_LABELS[field]
    return [
        {
            "category": "probable_issue",
            "field": field,
            "message": (
                f"Conferir {label.lower()} no memorial. Esperado: {expected_value}. "
                f"Encontrado: {occurrence['value']}."
            ),
            "occurrences": [occurrence],
            "reason": f"{field}_differs_from_package_identity",
            "severity": "relevante",
        }
        for occurrence in divergent
    ]


def _build_multiple_value_findings(
    occurrences: list[dict[str, Any]],
    field: str = "address",
) -> list[dict[str, Any]]:
    values = [occurrence["normalized_value"] for occurrence in occurrences]
    counts = Counter(value for value in values if value)
    if len(counts) <= 1:
        return []

    dominant_value = counts.most_common(1)[0][0]
    divergent = [
        occurrence
        for occurrence in occurrences
        if occurrence["normalized_value"] and occurrence["normalized_value"] != dominant_value
        and _values_are_different(occurrence["normalized_value"], dominant_value, field)
    ]
    return [
        {
            "category": "needs_review",
            "field": field,
            "message": (
                f"Mais de um valor para {FIELD_LABELS[field].lower()} foi encontrado nos memoriais. "
                f"Revisar ocorrência: {occurrence['value']}."
            ),
            "occurrences": [occurrence],
            "reason": f"multiple_memorial_{field}_values_detected",
            "severity": "atencao",
        }
        for occurrence in divergent
    ]


def _dominant_value(occurrences: list[dict[str, Any]]) -> str | None:
    counts = Counter(
        occurrence["normalized_value"]
        for occurrence in occurrences
        if occurrence["normalized_value"]
    )
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def _values_are_different(value: str, dominant_value: str, field: str) -> bool:
    if field == "address" and (
        value in dominant_value or dominant_value in value
    ):
        return False
    return True


def _extract_city_from_owner(value: str) -> str | None:
    match = re.search(r"\b(?:DE|DO|DA)\s+([A-Z ]+)$", _normalize_text(value))
    if not match:
        return None
    return _clean_value("municipality", match.group(1))


def _is_valid_occurrence(occurrence: dict[str, Any]) -> bool:
    value = occurrence["value"]
    normalized_value = occurrence["normalized_value"]
    if not normalized_value:
        return False

    if occurrence["field"] == "bairro":
        if normalized_value in SINGLE_VALUE_STOPWORDS or len(normalized_value) <= 2:
            return False
        if normalized_value.startswith("E ") or "ARREDORES" in normalized_value:
            return False
        if len(normalized_value.split()) > 4:
            return False

    if occurrence["field"] == "municipality":
        if normalized_value in SINGLE_VALUE_STOPWORDS or len(normalized_value) <= 2:
            return False
        if len(normalized_value.split()) > 4:
            return False

    if occurrence["field"] == "work_name":
        return "PORTE" in normalized_value and len(value.split()) <= 8

    if occurrence["field"] == "address":
        if normalized_value.startswith("RODOVIA E "):
            return False
        return len(normalized_value) >= 8

    return True


def _group_occurrences_by_field(
    occurrences: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for occurrence in occurrences:
        grouped.setdefault(occurrence["field"], []).append(occurrence)
    return grouped


def _infer_identity_municipality(identity: dict[str, Any]) -> str | None:
    client = identity.get("client") or ""
    match = re.search(r"\b(?:MUNICIPIO|MUNICIPIO DE|PREFEITURA MUNICIPAL DE)\s+([A-Z ]+)", client)
    if match:
        return _clean_value("municipality", match.group(1))

    # O pacote real inicial tem Criciuma na capa/cliente; manter como inferencia conservadora.
    if "CRICIUMA" in _normalize_text(client):
        return "CRICIUMA"
    return None


def _dedupe_occurrences(
    occurrences: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    seen: set[tuple[str, str, int, str]] = set()
    unique: list[dict[str, Any]] = []
    for occurrence in occurrences:
        key = (
            occurrence["filename"],
            occurrence["field"],
            occurrence["page"],
            occurrence["normalized_value"],
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(occurrence)
    return unique


def _extract_source_text(text: str, start: int, end: int) -> str:
    left = max(0, start - 100)
    right = min(len(text), end + 140)
    return text[left:right].strip(" |")


def _clean_value(field: str, value: str) -> str:
    value = value.replace("AV.", "AVENIDA")
    value = WHITESPACE_PATTERN.sub(" ", value).strip(" |:-,.;•")
    value = re.sub(
        r"\b(?:RESPONSAVEL|RESPONS[ÁA]VEL|CLIENTE|CONTEUDO|CONTE[ÚU]DO)\b.*$",
        "",
        value,
    )
    if field == "address":
        value = re.split(r"\.\s+", value, maxsplit=1)[0]
        value = re.sub(r"\b(?:SERA|COM ESPERA|CONFORME|APENAS A TITULO)\b.*$", "", value)
        value = re.sub(
            r"\b(?:NUMERO|N[UÚ]MERO|BAIRRO|MUNICIPIO|MUNIC[ÍI]PIO|PROPRIETARIO|PROPRIET[ÁA]RIO|AREA|OBJETIVO|MEMORIAL)\b.*$",
            "",
            value,
        )
    if field in {"bairro", "municipality"}:
        value = re.sub(
            r"\b(?:BAIRRO|CLIENTE|ENDEREC[O0]|ENDERE[ÇC]O|EM|E ARREDORES|MEMORIAL|"
            r"N[UÚ]MERO|NUMERO|OBRA|OUTUBRO|PROCESSO|PROJETO|PROPRIETARIO|"
            r"PROPRIET[ÁA]RIO|SETEMBRO|VOLUME|NOVEMBRO|DEZEMBRO)\b.*$",
            "",
            value,
        )
    if field == "owner":
        value = re.sub(
            r"\b(?:DADOS|ENDERECO|ENDERE[ÇC]O|RESPONSAVEL|RESPONS[ÁA]VEL|AREA|OBJETIVO)\b.*$",
            "",
            value,
        )
    return value.strip(" |:-,.;•")


def _normalize_comparable(value: str) -> str:
    normalized_value = _normalize_text(value)
    normalized_value = re.sub(r"\b(SN|S N|S/N|SEM NUMERO)\b", "S/N", normalized_value)
    normalized_value = re.sub(r"[^A-Z0-9/ ]+", " ", normalized_value)
    return WHITESPACE_PATTERN.sub(" ", normalized_value).strip()


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
