from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnalysisSignoff(Base):
    __tablename__ = "analysis_signoffs"

    analysis_run_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("analysis_runs.id"),
        primary_key=True,
    )
    final_status_code: Mapped[str] = mapped_column(String(50))
    reviewer_name: Mapped[str] = mapped_column(String(255))
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
