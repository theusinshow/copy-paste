from sqlalchemy import ForeignKey, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TextSpan(Base):
    __tablename__ = "text_spans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_page_id: Mapped[int] = mapped_column(ForeignKey("document_pages.id"))
    text: Mapped[str] = mapped_column(Text)
    bbox: Mapped[dict | None] = mapped_column(JSON, nullable=True)
