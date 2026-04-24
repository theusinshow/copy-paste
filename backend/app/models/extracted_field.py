from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    input_document_id: Mapped[int | None] = mapped_column(
        ForeignKey("input_documents.id"),
        nullable=True,
    )
    document_page_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_pages.id"),
        nullable=True,
    )
    field_name: Mapped[str] = mapped_column(String(255))
    raw_value: Mapped[str] = mapped_column(Text)
    normalized_value: Mapped[str] = mapped_column(Text)
    bbox: Mapped[dict | None] = mapped_column(JSON, nullable=True)
