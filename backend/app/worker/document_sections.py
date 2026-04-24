import re
import unicodedata
from dataclasses import dataclass

LD_TITLE_PATTERN = re.compile(r"\bLISTA\s+DE\s+DOCUMENTOS\b", re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")


@dataclass(frozen=True)
class DocumentSection:
    end_page: int
    ld_page: int | None
    scope_id: int
    start_page: int


def build_document_sections(page_texts: dict[int, str]) -> list[DocumentSection]:
    if not page_texts:
        return []

    pages = sorted(page_texts)
    first_page = pages[0]
    last_page = pages[-1]
    ld_pages = [
        page_number
        for page_number, page_text in sorted(page_texts.items())
        if is_ld_page(page_text)
    ]
    if not ld_pages:
        return [
            DocumentSection(
                end_page=last_page,
                ld_page=None,
                scope_id=1,
                start_page=first_page,
            )
        ]

    sections: list[DocumentSection] = []
    for index, ld_page in enumerate(ld_pages):
        next_ld_page = ld_pages[index + 1] if index + 1 < len(ld_pages) else None
        sections.append(
            DocumentSection(
                end_page=(next_ld_page - 1) if next_ld_page else last_page,
                ld_page=ld_page,
                scope_id=index + 1,
                start_page=first_page if index == 0 else ld_page,
            )
        )
    return sections


def find_scope_id(page_number: int, sections: list[DocumentSection]) -> int | None:
    for section in sections:
        if section.start_page <= page_number <= section.end_page:
            return section.scope_id
    return None


def is_ld_page(page_text: str) -> bool:
    return bool(LD_TITLE_PATTERN.search(_normalize_text(page_text)))


def _normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return WHITESPACE_PATTERN.sub(" ", value.upper()).strip()
