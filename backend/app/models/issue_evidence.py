from sqlalchemy import ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IssueEvidence(Base):
    __tablename__ = "issue_evidences"

    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"), primary_key=True)
    field_id: Mapped[int] = mapped_column(
        ForeignKey("extracted_fields.id"),
        primary_key=True,
    )
    page: Mapped[int] = mapped_column(Integer, primary_key=True)
    bbox: Mapped[dict] = mapped_column(JSON)
