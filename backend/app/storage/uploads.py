from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from uuid import uuid4

from app.core.config import get_settings

PDF_SIGNATURE = b"%PDF-"


@dataclass(frozen=True)
class StoredUpload:
    original_filename: str
    file_path: str
    file_hash: str


def save_pdf_upload(
    analysis_id: int,
    original_filename: str | None,
    content: bytes,
) -> StoredUpload:
    normalized_filename = _normalize_filename(original_filename)
    _validate_pdf_file(normalized_filename, content)

    analysis_dir = _get_analysis_upload_dir(analysis_id)
    analysis_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4().hex}_{normalized_filename}"
    file_path = analysis_dir / stored_filename
    file_path.write_bytes(content)

    return StoredUpload(
        original_filename=normalized_filename,
        file_path=str(file_path.resolve()),
        file_hash=sha256(content).hexdigest(),
    )


def delete_uploaded_files(file_paths: list[str]) -> None:
    for file_path in file_paths:
        path = Path(file_path)
        if path.exists():
            path.unlink()


def _get_analysis_upload_dir(analysis_id: int) -> Path:
    settings = get_settings()
    return Path(settings.UPLOAD_DIR).resolve() / f"analysis_{analysis_id}"


def _normalize_filename(original_filename: str | None) -> str:
    if original_filename is None:
        raise ValueError("File name is required")

    filename = Path(original_filename).name.strip()
    if not filename:
        raise ValueError("File name is required")

    return filename


def _validate_pdf_file(original_filename: str, content: bytes) -> None:
    if not original_filename.lower().endswith(".pdf"):
        raise ValueError("Only PDF files are accepted")

    if not content.startswith(PDF_SIGNATURE):
        raise ValueError("Only PDF files are accepted")
