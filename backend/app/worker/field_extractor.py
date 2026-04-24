import re
import unicodedata
from dataclasses import dataclass

from app.worker.field_definitions import FIELD_DEFINITIONS
from app.worker.pdf_reader import ExtractedPdfPage, ExtractedTextSpan

LINE_TOP_TOLERANCE = 3.0
VALUE_PREFIX_PATTERN = re.compile(r"^[\s:\-–—]+")
WHITESPACE_PATTERN = re.compile(r"\s+")
NON_ALNUM_PATTERN = re.compile(r"[^A-Z0-9]+")


@dataclass(frozen=True)
class ExtractedFieldCandidate:
    document_page_id: int
    field_name: str
    raw_value: str
    normalized_value: str
    bbox: dict[str, float] | None


@dataclass(frozen=True)
class _TextLine:
    bbox: dict[str, float] | None
    page_number: int
    spans: list[ExtractedTextSpan]
    text: str


def extract_fields_from_pages(
    extracted_pages: list[ExtractedPdfPage],
    document_page_ids: dict[int, int],
) -> list[ExtractedFieldCandidate]:
    lines = [
        line
        for extracted_page in extracted_pages
        for line in _build_lines(extracted_page)
    ]

    extracted_fields: list[ExtractedFieldCandidate] = []
    for definition in FIELD_DEFINITIONS:
        candidate = _find_field_candidate(definition.aliases, lines)
        if candidate is None:
            continue

        extracted_fields.append(
            ExtractedFieldCandidate(
                document_page_id=document_page_ids[candidate.page_number],
                field_name=definition.field_name,
                raw_value=candidate.raw_value,
                normalized_value=_normalize_value(candidate.raw_value),
                bbox=candidate.bbox,
            )
        )

    return extracted_fields


@dataclass(frozen=True)
class _MatchedValue:
    bbox: dict[str, float] | None
    page_number: int
    raw_value: str


def _find_field_candidate(
    aliases: tuple[str, ...],
    lines: list[_TextLine],
) -> _MatchedValue | None:
    all_aliases = {
        alias
        for definition in FIELD_DEFINITIONS
        for alias in definition.aliases
    }

    for index, line in enumerate(lines):
        for alias in aliases:
            alias_tokens = alias.split()
            normalized_line = _normalize_for_match(line.text)
            if not normalized_line.startswith(alias):
                continue

            inline_value = _extract_inline_value(line, alias_tokens)
            if inline_value is not None:
                return inline_value

            next_line = _get_next_value_line(lines, index, all_aliases)
            if next_line is not None:
                return _MatchedValue(
                    bbox=next_line.bbox,
                    page_number=next_line.page_number,
                    raw_value=next_line.text,
                )

    return None


def _extract_inline_value(
    line: _TextLine,
    alias_tokens: list[str],
) -> _MatchedValue | None:
    start_index = _find_value_start_index(line.spans, alias_tokens)
    if start_index is None:
        return None

    value_spans = [span for span in line.spans[start_index:] if span.text.strip()]
    if not value_spans:
        return None

    raw_value = _clean_value_text(" ".join(span.text.strip() for span in value_spans))
    if not raw_value:
        return None

    return _MatchedValue(
        bbox=_merge_bboxes([span.bbox for span in value_spans if span.bbox is not None]),
        page_number=line.page_number,
        raw_value=raw_value,
    )


def _get_next_value_line(
    lines: list[_TextLine],
    index: int,
    all_aliases: set[str],
) -> _TextLine | None:
    if index + 1 >= len(lines):
        return None

    next_line = lines[index + 1]
    current_line = lines[index]
    if next_line.page_number != current_line.page_number:
        return None

    if _looks_like_label(next_line.text, all_aliases):
        return None

    return next_line


def _build_lines(extracted_page: ExtractedPdfPage) -> list[_TextLine]:
    if not extracted_page.text_spans:
        return []

    lines: list[_TextLine] = []
    current_spans: list[ExtractedTextSpan] = []
    current_top: float | None = None

    for span in extracted_page.text_spans:
        if span.bbox is None:
            if current_spans:
                lines.append(_create_line(extracted_page.page_number, current_spans))
                current_spans = []
                current_top = None
            lines.append(_create_line(extracted_page.page_number, [span]))
            continue

        span_top = span.bbox["top"]
        if current_top is None or abs(span_top - current_top) <= LINE_TOP_TOLERANCE:
            current_spans.append(span)
            if current_top is None:
                current_top = span_top
            continue

        lines.append(_create_line(extracted_page.page_number, current_spans))
        current_spans = [span]
        current_top = span_top

    if current_spans:
        lines.append(_create_line(extracted_page.page_number, current_spans))

    return lines


def _create_line(page_number: int, spans: list[ExtractedTextSpan]) -> _TextLine:
    ordered_spans = sorted(
        spans,
        key=lambda span: span.bbox["x0"] if span.bbox is not None else 0.0,
    )
    text = " ".join(span.text.strip() for span in ordered_spans if span.text.strip())
    bbox = _merge_bboxes([span.bbox for span in ordered_spans if span.bbox is not None])
    return _TextLine(
        bbox=bbox,
        page_number=page_number,
        spans=ordered_spans,
        text=text,
    )


def _find_value_start_index(
    spans: list[ExtractedTextSpan],
    alias_tokens: list[str],
) -> int | None:
    matched_tokens: list[str] = []

    for index, span in enumerate(spans):
        span_tokens = _normalize_for_match(span.text).split()
        if not span_tokens:
            continue

        matched_tokens.extend(span_tokens)
        if matched_tokens == alias_tokens:
            return index + 1
        if alias_tokens[: len(matched_tokens)] != matched_tokens:
            return None

    return None


def _looks_like_label(text: str, aliases: set[str]) -> bool:
    normalized_text = _normalize_for_match(text)
    return any(normalized_text.startswith(alias) for alias in aliases)


def _normalize_for_match(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    value = value.upper()
    value = NON_ALNUM_PATTERN.sub(" ", value)
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _normalize_value(value: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _clean_value_text(value: str) -> str:
    value = VALUE_PREFIX_PATTERN.sub("", value)
    return WHITESPACE_PATTERN.sub(" ", value).strip()


def _merge_bboxes(
    bboxes: list[dict[str, float]],
) -> dict[str, float] | None:
    if not bboxes:
        return None

    return {
        "x0": min(bbox["x0"] for bbox in bboxes),
        "top": min(bbox["top"] for bbox in bboxes),
        "x1": max(bbox["x1"] for bbox in bboxes),
        "bottom": max(bbox["bottom"] for bbox in bboxes),
    }
