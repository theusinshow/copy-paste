from pathlib import Path

from app.worker import pdf_reader


class FakePage:
    def __init__(self, text: str):
        self._text = text

    def extract_words(self):
        return [
            {
                "bottom": 10,
                "text": self._text,
                "top": 0,
                "x0": 0,
                "x1": 10,
            }
        ]


class FakePdf:
    def __init__(self):
        self.pages = [FakePage("A"), FakePage("B"), FakePage("C")]

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False


def test_read_pdf_pages_reports_page_progress(monkeypatch, tmp_path: Path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF- fake")
    progress_events: list[tuple[int, int]] = []

    monkeypatch.setattr(pdf_reader.pdfplumber, "open", lambda _: FakePdf())

    pages = pdf_reader.read_pdf_pages(
        str(pdf_path),
        on_page_extracted=lambda page_number, page_count: progress_events.append(
            (page_number, page_count)
        ),
    )

    assert [page.page_number for page in pages] == [1, 2, 3]
    assert progress_events == [(1, 3), (2, 3), (3, 3)]
