from dataclasses import dataclass
import multiprocessing
import queue
from pathlib import Path
from typing import Callable

import pdfplumber

PDF_SIGNATURE = b"%PDF-"
PAGE_EXTRACTION_TIMEOUT_SECONDS = 20


@dataclass(frozen=True)
class ExtractedTextSpan:
    text: str
    bbox: dict[str, float] | None


@dataclass(frozen=True)
class ExtractedPdfPage:
    page_number: int
    text_spans: list[ExtractedTextSpan]


PageProgressCallback = Callable[[int, int], None]


def read_pdf_pages(
    file_path: str,
    isolate_pages: bool = False,
    on_page_extracted: PageProgressCallback | None = None,
) -> list[ExtractedPdfPage]:
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

            page_count = len(pdf.pages)
            extracted_pages: list[ExtractedPdfPage] = []
            for page_number, page in enumerate(pdf.pages, start=1):
                text_spans = (
                    _extract_text_spans_in_subprocess(path, page_number)
                    if isolate_pages
                    else _extract_text_spans(page)
                )
                extracted_pages.append(
                    ExtractedPdfPage(
                        page_number=page_number,
                        text_spans=text_spans,
                    )
                )
                if on_page_extracted is not None:
                    on_page_extracted(page_number, page_count)

            return extracted_pages
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


def _extract_text_spans_in_subprocess(
    path: Path,
    page_number: int,
) -> list[ExtractedTextSpan]:
    ctx = multiprocessing.get_context("spawn")
    result_queue = ctx.Queue(maxsize=1)
    process = ctx.Process(
        target=_extract_page_worker,
        args=(str(path), page_number, result_queue),
    )
    process.start()
    process.join(PAGE_EXTRACTION_TIMEOUT_SECONDS)

    if process.is_alive():
        process.terminate()
        process.join()
        return []

    if process.exitcode != 0:
        return []

    try:
        result = result_queue.get_nowait()
    except queue.Empty:
        return []

    if not isinstance(result, list):
        return []

    return [
        ExtractedTextSpan(
            text=str(item["text"]),
            bbox=item.get("bbox"),
        )
        for item in result
        if isinstance(item, dict) and str(item.get("text", "")).strip()
    ]


def _extract_page_worker(
    file_path: str,
    page_number: int,
    result_queue: multiprocessing.Queue,
) -> None:
    with pdfplumber.open(file_path) as pdf:
        if page_number < 1 or page_number > len(pdf.pages):
            result_queue.put([])
            return

        spans = _extract_text_spans(pdf.pages[page_number - 1])
        result_queue.put(
            [
                {
                    "bbox": span.bbox,
                    "text": span.text,
                }
                for span in spans
            ]
        )


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
