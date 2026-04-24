import re
from pathlib import Path

PDF_SIGNATURE = b"%PDF-"
PDF_PAGE_PATTERN = re.compile(rb"/Type\s*/Page\b")


def read_pdf_page_numbers(file_path: str) -> list[int]:
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError("Input document file not found")

    content = path.read_bytes()
    if not content.startswith(PDF_SIGNATURE):
        raise ValueError("Input document is not a valid PDF")

    page_count = len(PDF_PAGE_PATTERN.findall(content))
    if page_count == 0:
        raise ValueError("Input document has no readable pages")

    return list(range(1, page_count + 1))
