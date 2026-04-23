from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class InputDocument(Base):
    __tablename__ = "input_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_run_id: Mapped[int] = mapped_column(ForeignKey("analysis_runs.id"))
    tipo: Mapped[str] = mapped_column(String(100))
    file_hash: Mapped[str] = mapped_column(String(255))
