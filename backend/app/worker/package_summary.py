import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.expected_identity import extract_expected_identity
from app.models.input_document import InputDocument

PROJECT_CODE_PATTERN = re.compile(r"\b\d{2,4}[-_]\d{2}\b")
WORK_NAME_PATTERN = re.compile(
    r"(?:GOVERNO DO MUNICIPIO DE CRICIUMA|PREFEITURA MUNICIPAL DE CRICIUMA)\s+(.+?)\s+BAIRRO\b"
)
UBS_WORK_NAME_PATTERN = re.compile(r"\b(UBS\s+.+?)\s+BAIRRO\b")
VOLUME_PATTERN = re.compile(
    r"\bVOLUME\s+(\d+)\s*[–—-]\s*(.+?)(?=\s+\(?TOMO\b|\s+\d{2,4}[-_]\d{2}\b|\s+JANEIRO\b|\s+FEVEREIRO\b|\s+MARCO\b|\s+MARÇO\b|\s+ABRIL\b|\s+MAIO\b|\s+JUNHO\b|\s+JULHO\b|\s+AGOSTO\b|\s+SETEMBRO\b|\s+OUTUBRO\b|\s+NOVEMBRO\b|\s+DEZEMBRO\b|$)"
)
TOMO_PATTERN = re.compile(r"\bTOMO\s+0?(\d+)\b")
BAIRRO_PATTERN = re.compile(
    r"\bBAIRRO\s+(.+?)(?=\s+VOLUME\b|\s+\d{2,4}[-_]\d{2}\b|\s+JANEIRO\b|\s+FEVEREIRO\b|\s+MARCO\b|\s+MARÇO\b|\s+ABRIL\b|\s+MAIO\b|\s+JUNHO\b|\s+JULHO\b|\s+AGOSTO\b|\s+SETEMBRO\b|\s+OUTUBRO\b|\s+NOVEMBRO\b|\s+DEZEMBRO\b|$)"
)
CLIENT_PATTERN = re.compile(
    r"(GOVERNO DO MUNICIPIO DE [A-Z ]+|PREFEITURA MUNICIPAL DE [A-Z ]+)"
)
DATE_PATTERN = re.compile(
    r"\b(JANEIRO|FEVEREIRO|MARCO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s*/\s*\d{4}\b"
)
LD_ROW_PATTERN = re.compile(r"\b\d{2}/\d{2}\s+\d{2,4}[_-]\d{2}_[A-Z0-9_]+", re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")


@dataclass(frozen=True)
class _DocumentSummary:
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


def build_package_summary(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    document_summaries = [
        _summarize_document(document, page_texts_by_document_id.get(document.id, {}))
        for document in documents
    ]
    identity = _apply_expected_identity(
        _build_identity(document_summaries, page_texts_by_document_id),
        config,
    )
    alerts = _build_alerts(document_summaries, identity)

    return {
        "identity": identity,
        "documents": [
            {
                "classification": summary.classification,
                "detected_project_codes": summary.detected_project_codes,
                "discipline": summary.discipline,
                "document_id": summary.document_id,
                "filename": summary.filename,
                "ld_pages": summary.ld_pages,
                "page_count": summary.page_count,
                "tipo": summary.tipo,
                "tomo": summary.tomo,
                "volume": summary.volume,
            }
            for summary in document_summaries
        ],
        "stats": {
            "document_count": len(document_summaries),
            "ld_count": sum(len(summary.ld_pages) for summary in document_summaries),
            "page_count": sum(summary.page_count for summary in document_summaries),
            "volume_count": len(
                {summary.volume for summary in document_summaries if summary.volume}
            ),
        },
        "alerts": alerts,
    }


def _summarize_document(
    document: InputDocument,
    page_texts: dict[int, str],
) -> _DocumentSummary:
    first_page_text = _normalize_text(page_texts.get(1, ""))
    combined_head_text = _normalize_text(
        " | ".join(page_texts[page_number] for page_number in sorted(page_texts)[:3])
    )
    filename = document.original_filename
    filename_text = _normalize_text(Path(filename).stem.replace("_", " "))
    searchable_text = f"{filename_text} | {combined_head_text}"

    volume, discipline = _extract_volume_and_discipline(searchable_text)
    tomo = _extract_tomo(searchable_text)
    ld_pages = [
        page_number
        for page_number, page_text in sorted(page_texts.items())
        if "LISTA DE DOCUMENTOS" in _normalize_text(page_text)
    ]

    return _DocumentSummary(
        classification=_classify_document(searchable_text, bool(ld_pages)),
        detected_project_codes=sorted(_extract_project_codes(searchable_text)),
        discipline=discipline,
        document_id=document.id,
        filename=filename,
        ld_pages=ld_pages,
        page_count=len(page_texts),
        tipo=document.tipo,
        tomo=tomo,
        volume=volume,
    )


def _build_identity(
    document_summaries: list[_DocumentSummary],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    first_pages = [
        _normalize_text(page_texts.get(1, ""))
        for page_texts in page_texts_by_document_id.values()
        if page_texts.get(1)
    ]

    return {
        "project_code": _most_common(
            code
            for summary in document_summaries
            for code in summary.detected_project_codes
        ),
        "work_name": _most_common(_extract_work_name(text) for text in first_pages),
        "bairro": _most_common(_extract_bairro(text) for text in first_pages),
        "client": _most_common(_extract_client(text) for text in first_pages),
        "date": _most_common(_extract_date(text) for text in first_pages),
        "volumes": sorted(
            {summary.volume for summary in document_summaries if summary.volume},
            key=lambda value: int(value) if value.isdigit() else value,
        ),
        "disciplines": sorted(
            {summary.discipline for summary in document_summaries if summary.discipline}
        ),
    }


def _build_alerts(
    document_summaries: list[_DocumentSummary],
    identity: dict[str, Any],
) -> list[dict[str, str]]:
    alerts: list[dict[str, str]] = []
    main_project_code = identity.get("project_code")

    for summary in document_summaries:
        unexpected_codes = [
            code
            for code in summary.detected_project_codes
            if main_project_code and code != main_project_code
        ]
        if unexpected_codes:
            alerts.append(
                {
                    "severity": "atencao",
                    "message": (
                        f"{summary.filename} contem codigo(s) diferente(s) do projeto "
                        f"principal: {', '.join(unexpected_codes)}."
                    ),
                }
            )

        if summary.page_count > 0 and not summary.ld_pages and summary.classification != "memorial":
            alerts.append(
                {
                    "severity": "info",
                    "message": f"{summary.filename} nao teve LISTA DE DOCUMENTOS detectada.",
                }
            )

    for base_name, filenames in _group_signed_duplicates(document_summaries).items():
        if len(filenames) > 1:
            alerts.append(
                {
                    "severity": "atencao",
                    "message": (
                        f"Foram encontrados arquivos possivelmente duplicados para "
                        f"{base_name}: {', '.join(sorted(filenames))}."
                    ),
                }
            )

    return alerts


def _extract_volume_and_discipline(text: str) -> tuple[str | None, str | None]:
    match = VOLUME_PATTERN.search(text)
    if not match:
        return None, _infer_discipline(text)

    discipline = _clean_label(match.group(2))
    return match.group(1), discipline or _infer_discipline(text)


def _extract_tomo(text: str) -> str | None:
    match = TOMO_PATTERN.search(text)
    return match.group(1).zfill(2) if match else None


def _extract_project_codes(text: str) -> set[str]:
    return {match.group(0).replace("_", "-") for match in PROJECT_CODE_PATTERN.finditer(text)}


def _extract_work_name(text: str) -> str | None:
    match = WORK_NAME_PATTERN.search(text)
    if match:
        return _clean_label(match.group(1))

    match = UBS_WORK_NAME_PATTERN.search(text)
    if match:
        return _clean_label(match.group(1))

    parts = [_clean_label(part) for part in text.split("|")]
    ignored_prefixes = (
        "ESTADO DE",
        "GOVERNO DO",
        "PREFEITURA",
        "BAIRRO",
        "VOLUME",
        "OUTUBRO",
        "JANEIRO",
        "FEVEREIRO",
        "MARCO",
        "MARÇO",
        "ABRIL",
        "MAIO",
        "JUNHO",
        "JULHO",
        "AGOSTO",
        "SETEMBRO",
        "NOVEMBRO",
        "DEZEMBRO",
        "PROSUL",
    )
    for part in parts:
        compact_part = part.replace(" ", "") if part else ""
        if (
            not part
            or part.startswith(ignored_prefixes)
            or compact_part.startswith(("ESTADODE", "GOVERNODO"))
        ):
            continue
        if PROJECT_CODE_PATTERN.search(part):
            continue
        return part
    return None


def _apply_expected_identity(
    identity: dict[str, Any],
    config: dict[str, Any] | None,
) -> dict[str, Any]:
    expected_identity = extract_expected_identity(config)
    if not expected_identity:
        return identity

    merged_identity = dict(identity)
    key_map = {
        "bairro": "bairro",
        "municipio": "municipality",
        "nome_obra": "work_name",
        "numero_projeto": "project_code",
        "orgao_cliente": "client",
    }
    for field_name, value in expected_identity.items():
        identity_key = key_map.get(field_name)
        if identity_key:
            merged_identity[identity_key] = value
    return merged_identity


def _extract_bairro(text: str) -> str | None:
    match = BAIRRO_PATTERN.search(text)
    return _clean_label(match.group(1)) if match else None


def _extract_client(text: str) -> str | None:
    match = CLIENT_PATTERN.search(text)
    if match:
        return _clean_label(match.group(1))

    for part in (_clean_label(part) for part in text.split("|")):
        compact_part = part.replace(" ", "") if part else ""
        if compact_part.startswith("GOVERNODOMUNICIPIODECRICIUMA"):
            return "GOVERNO DO MUNICIPIO DE CRICIUMA"
        if compact_part.startswith("PREFEITURAMUNICIPALDECRICIUMA"):
            return "PREFEITURA MUNICIPAL DE CRICIUMA"
        if part.startswith("GOVERNO DO ") or part.startswith("PREFEITURA "):
            return part
    return None


def _extract_date(text: str) -> str | None:
    match = DATE_PATTERN.search(text)
    return match.group(0).replace(" / ", "/") if match else None


def _classify_document(text: str, has_ld: bool) -> str:
    if "MEMORIAL" in text:
        return "memorial"
    if has_ld:
        return "volume_com_ld"
    if "PRANCHA" in text or LD_ROW_PATTERN.search(text):
        return "prancha"
    return "desconhecido"


def _infer_discipline(text: str) -> str | None:
    discipline_keywords = (
        "ARQUITETONICO",
        "ARQUITETÔNICO",
        "ESTRUTURAS",
        "FUNDACOES",
        "FUNDAÇÕES",
        "ELETRICAS",
        "ELÉTRICAS",
        "HIDROSSANITARIAS",
        "HIDROSSANITÁRIAS",
        "CLIMATIZACAO",
        "CLIMATIZAÇÃO",
        "GASES MEDICINAIS",
        "URBANIZACAO",
        "URBANIZAÇÃO",
        "PAISAGISMO",
        "TOPOGRAFICO",
        "TOPOGRÁFICO",
        "DRENAGEM",
    )
    for keyword in discipline_keywords:
        if keyword in text:
            return keyword
    return None


def _group_signed_duplicates(
    document_summaries: list[_DocumentSummary],
) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}
    for summary in document_summaries:
        stem = Path(summary.filename).stem.lower()
        base_name = stem.replace("_assinado", "").replace("-assinado", "")
        groups.setdefault(base_name, []).append(summary.filename)
    return groups


def _most_common(values) -> str | None:
    filtered_values = [value for value in values if value]
    if not filtered_values:
        return None
    return Counter(filtered_values).most_common(1)[0][0]


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.upper()
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _clean_label(value: str) -> str | None:
    value = WHITESPACE_PATTERN.sub(" ", value).strip(" |:-–—")
    return value or None
