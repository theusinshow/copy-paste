from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.analysis_modes import ANALYSIS_MODE_DEFAULT, AnalysisMode
from app.models.analysis_run import AnalysisRun

ANALYSIS_STATUS_CREATED = "created"
ANALYSIS_STATUS_PROCESSING = "processing"
ANALYSIS_STATUS_COMPLETED = "completed"
ANALYSIS_STATUS_FAILED = "failed"


def create_analysis_run(
    session: Session,
    analysis_mode: AnalysisMode = ANALYSIS_MODE_DEFAULT,
    config: dict[str, Any] | None = None,
) -> AnalysisRun:
    analysis_run = AnalysisRun(
        status=ANALYSIS_STATUS_CREATED,
        analysis_mode=analysis_mode,
        config=dict(config or {}),
        created_at=datetime.now(timezone.utc),
    )
    session.add(analysis_run)
    session.commit()
    session.refresh(analysis_run)
    return analysis_run


def list_analysis_runs(session: Session) -> list[AnalysisRun]:
    statement = select(AnalysisRun).order_by(
        AnalysisRun.created_at.desc(),
        AnalysisRun.id.desc(),
    )
    return list(session.scalars(statement).all())


def get_analysis_run_by_id(session: Session, analysis_id: int) -> AnalysisRun | None:
    statement = select(AnalysisRun).where(AnalysisRun.id == analysis_id)
    return session.scalar(statement)


def set_analysis_run_status(
    session: Session,
    analysis_run: AnalysisRun,
    status: str,
) -> AnalysisRun:
    analysis_run.status = status
    session.add(analysis_run)
    session.commit()
    session.refresh(analysis_run)
    return analysis_run
