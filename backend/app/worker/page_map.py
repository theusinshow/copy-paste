import re
import unicodedata
from collections import Counter
from typing import Any

from app.models.input_document import InputDocument
from app.worker.document_sections import build_document_sections, find_scope_id, is_ld_page

DOCUMENT_CODE_PATTERN = re.compile(r"\b\d{2,4}[_-]\d{2}_[A-Z0-9_]+\b")
MEMORIAL_PATTERN = re.compile(r"\bMEMORIAL\s+(?:DESCRITIVO|DE\s+CALCULO|T[ÉE]CNICO)\b")
PROJECT_ID_PATTERN = re.compile(r"\b(?:N[ºO]?\.?\s*)?PROJETO\b|\bOBRA\b|\bCLIENTE\b")
SEPARATRIX_PATTERN = re.compile(r"\b(?:SEPARATRIZ|VOLUME|TOMO|DISCIPLINA)\b")
SHEET_STAMP_PATTERN = re.compile(r"\b(?:CONTEUDO|CONTE[ÚU]DO|PRANCHA|FOLHA|ARQUIVO)\b")
SUMMARY_PATTERN = re.compile(r"\b(?:SUMARIO|SUM[ÁA]RIO|INDICE|[ÍI]NDICE)\b")
WHITESPACE_PATTERN = re.compile(r"\s+")

DISCIPLINE_CODES = {
    "ARQ": ("arquitetura", "Arquitetura"),
    "CLI": ("climatizacao", "Climatizacao"),
    "DRE": ("drenagem", "Drenagem"),
    "ELE": ("eletrica", "Eletrica"),
    "EST": ("estrutural", "Estrutural"),
    "FND": ("fundacao", "Fundacao"),
    "HIS": ("hidrossanitario", "Hidrossanitario"),
    "INC": ("incendio", "Incendio"),
    "TOP": ("topografia", "Topografia"),
}

PAGE_TYPE_LABELS = {
    "cover": "Capa",
    "drawing_list": "Lista de documentos",
    "memorial": "Memorial",
    "separator": "Separatriz",
    "sheet": "Prancha",
    "summary": "Sumario",
    "unknown": "Nao classificada",
}


def build_page_map(
    documents: list[InputDocument],
    page_texts_by_document_id: dict[int, dict[int, str]],
) -> dict[str, Any]:
    mapped_documents = []
    page_type_counts: Counter[str] = Counter()
    low_confidence_count = 0

    for document in documents:
        page_texts = page_texts_by_document_id.get(document.id, {})
        sections = build_document_sections(page_texts)
        pages = []
        for page_number, page_text in sorted(page_texts.items()):
            page = _classify_page(
                document=document,
                page_number=page_number,
                page_text=page_text,
                scope_id=find_scope_id(page_number, sections),
            )
            pages.append(page)
            page_type_counts[page["page_type"]] += 1
            if page["confidence"] == "low":
                low_confidence_count += 1

        mapped_documents.append(
            {
                "document_id": document.id,
                "filename": document.original_filename,
                "page_count": len(pages),
                "pages": pages,
                "tipo": document.tipo,
            }
        )

    return {
        "documents": mapped_documents,
        "stats": {
            "document_count": len(mapped_documents),
            "low_confidence_count": low_confidence_count,
            "page_count": sum(document["page_count"] for document in mapped_documents),
            "page_type_counts": dict(sorted(page_type_counts.items())),
        },
    }


def _classify_page(
    document: InputDocument,
    page_number: int,
    page_text: str,
    scope_id: int | None,
) -> dict[str, Any]:
    normalized_text = _normalize_text(page_text)
    page_type, confidence, signals = _classify_text(
        normalized_text=normalized_text,
        page_number=page_number,
    )
    discipline_code, discipline_label, discipline_type = _detect_discipline(
        normalized_text,
    )
    return {
        "confidence": confidence,
        "discipline_code": discipline_code,
        "discipline_label": discipline_label,
        "discipline_type": discipline_type,
        "document_id": document.id,
        "evidence_text": _extract_evidence(normalized_text, signals),
        "filename": document.original_filename,
        "page": page_number,
        "page_type": page_type,
        "page_type_label": PAGE_TYPE_LABELS[page_type],
        "scope_id": scope_id,
        "signals": signals,
    }


def _classify_text(
    normalized_text: str,
    page_number: int,
) -> tuple[str, str, list[str]]:
    signals: list[str] = []

    if is_ld_page(normalized_text):
        signals.append("titulo_lista_de_documentos")
        if DOCUMENT_CODE_PATTERN.search(normalized_text):
            signals.append("codigos_documentais")
        return "drawing_list", "high", signals

    if MEMORIAL_PATTERN.search(normalized_text):
        signals.append("titulo_memorial")
        return "memorial", "high", signals

    if _looks_like_sheet(normalized_text):
        signals.append("selo_ou_codigo_de_prancha")
        if SHEET_STAMP_PATTERN.search(normalized_text):
            signals.append("campos_de_selo")
        if _detect_discipline(normalized_text)[0]:
            signals.append("sigla_disciplina_no_selo")
        return "sheet", "high", signals

    if SUMMARY_PATTERN.search(normalized_text):
        signals.append("sumario_ou_indice")
        return "summary", "medium", signals

    if _looks_like_separator(normalized_text):
        signals.append("marcador_volume_tomo_disciplina")
        if _detect_discipline(normalized_text)[0]:
            signals.append("sigla_ou_nome_disciplina")
        return "separator", "medium", signals

    if page_number == 1 and PROJECT_ID_PATTERN.search(normalized_text):
        signals.append("primeira_pagina_com_identidade")
        return "cover", "medium", signals

    return "unknown", "low", ["sem_sinal_forte"]


def _looks_like_sheet(normalized_text: str) -> bool:
    if re.search(r"\b\d{2,4}[_-]\d{2}_[A-Z0-9]{2,}_[A-Z0-9_]*\b", normalized_text):
        return True
    return bool(
        SHEET_STAMP_PATTERN.search(normalized_text)
        and re.search(r"\b\d{2}/\d{2}\b", normalized_text)
    )


def _looks_like_separator(normalized_text: str) -> bool:
    if len(normalized_text.split()) >= 220:
        return False
    if SEPARATRIX_PATTERN.search(normalized_text):
        return True
    discipline_code, _, _ = _detect_discipline(normalized_text)
    if discipline_code and len(normalized_text.split()) < 80:
        return True
    return False


def _detect_discipline(normalized_text: str) -> tuple[str | None, str | None, str | None]:
    for code, (discipline_type, label) in DISCIPLINE_CODES.items():
        if re.search(rf"\b{re.escape(code)}\b", normalized_text):
            return code, label, discipline_type

    keyword_matches = (
        ("FND", "fundacao", "Fundacao", ("FUNDACAO", "FUNDAÇÕES", "FUNDAÇÕES")),
        ("EST", "estrutural", "Estrutural", ("ESTRUTURAL", "CONCRETO")),
        ("HIS", "hidrossanitario", "Hidrossanitario", ("HIDROSSANITARIO", "HIDRAULICO")),
        ("DRE", "drenagem", "Drenagem", ("DRENAGEM",)),
        ("ARQ", "arquitetura", "Arquitetura", ("ARQUITETURA",)),
    )
    for code, discipline_type, label, keywords in keyword_matches:
        if any(keyword in normalized_text for keyword in keywords):
            return code, label, discipline_type

    return None, None, None


def _extract_evidence(normalized_text: str, signals: list[str]) -> str:
    if not normalized_text:
        return ""

    for pattern in (
        r"LISTA\s+DE\s+DOCUMENTOS.{0,220}",
        r"MEMORIAL\s+(?:DESCRITIVO|DE\s+CALCULO|TECNICO).{0,220}",
        r"CONTEUDO.{0,240}",
        r"PRANCHA.{0,240}",
        r"VOLUME.{0,220}",
        r"PROJETO.{0,220}",
    ):
        match = re.search(pattern, normalized_text)
        if match:
            return match.group(0).strip(" |")[:260]

    del signals
    return normalized_text[:260]


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
