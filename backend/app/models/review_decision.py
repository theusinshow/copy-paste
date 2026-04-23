from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"), primary_key=True)
    decision: Mapped[str] = mapped_column(String(50))
    comment: Mapped[str] = mapped_column(Text)
