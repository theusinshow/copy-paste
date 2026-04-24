from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis_run import AnalysisRun

INITIAL_ANALYSIS_STATUS = "created"


def create_analysis_run(session: Session) -> AnalysisRun:
    analysis_run = AnalysisRun(
        status=INITIAL_ANALYSIS_STATUS,
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
