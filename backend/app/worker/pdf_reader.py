from dataclasses import dataclass
from pathlib import Path

import pdfplumber

PDF_SIGNATURE = b"%PDF-"


@dataclass(frozen=True)
class ExtractedTextSpan:
    text: str
    bbox: dict[str, float] | None


@dataclass(frozen=True)
class ExtractedPdfPage:
    page_number: int
    text_spans: list[ExtractedTextSpan]


def read_pdf_pages(file_path: str) -> list[ExtractedPdfPage]:
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError("Input document file not found")

    with path.open("rb") as file:
        if file.read(len(PDF_SIGNATURE)) != PDF_SIGNATURE:
            raise ValueError("Input document is not a valid PDF")

    try:
        with pdfplumber.open(path) as pdf:
            if not pdf.pages:
                raise ValueError("Input document has no pages")

            return [
                ExtractedPdfPage(
                    page_number=page_number,
                    text_spans=_extract_text_spans(page),
                )
                for page_number, page in enumerate(pdf.pages, start=1)
            ]
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("Input document is not a valid PDF") from exc


def _extract_text_spans(page: pdfplumber.page.Page) -> list[ExtractedTextSpan]:
    words = page.extract_words()
    text_spans = [
        ExtractedTextSpan(
            text=text,
            bbox=_build_bbox(word),
        )
        for word in words
        if (text := str(word.get("text", "")).strip())
    ]
    if text_spans:
        return text_spans

    page_text = (page.extract_text() or "").strip()
    if not page_text:
        return []

    return [ExtractedTextSpan(text=page_text, bbox=None)]


def _build_bbox(word: dict) -> dict[str, float] | None:
    keys = ("x0", "top", "x1", "bottom")
    if any(word.get(key) is None for key in keys):
        return None

    return {
        "x0": float(word["x0"]),
        "top": float(word["top"]),
        "x1": float(word["x1"]),
        "bottom": float(word["bottom"]),
    }
