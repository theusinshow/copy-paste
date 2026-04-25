from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.audit_closure import get_audit_status_label
from app.models.analysis_signoff import AnalysisSignoff


def get_analysis_signoff_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> dict | None:
    signoff = session.get(AnalysisSignoff, analysis_id)
    if signoff is None:
        return None

    return _serialize_signoff(signoff)


def upsert_analysis_signoff(
    session: Session,
    analysis_id: int,
    final_status_code: str,
    reviewer_name: str,
    comment: str,
) -> AnalysisSignoff:
    signoff = session.get(AnalysisSignoff, analysis_id)
    now = datetime.now(timezone.utc)

    if signoff is None:
        signoff = AnalysisSignoff(
            analysis_run_id=analysis_id,
            final_status_code=final_status_code,
            reviewer_name=reviewer_name,
            comment=comment,
            created_at=now,
            updated_at=now,
        )
        session.add(signoff)
    else:
        signoff.final_status_code = final_status_code
        signoff.reviewer_name = reviewer_name
        signoff.comment = comment
        signoff.updated_at = now

    session.flush()
    return signoff


def _serialize_signoff(signoff: AnalysisSignoff) -> dict:
    return {
        "analysis_run_id": signoff.analysis_run_id,
        "comment": signoff.comment,
        "created_at": signoff.created_at,
        "final_status_code": signoff.final_status_code,
        "final_status_label": get_audit_status_label(signoff.final_status_code),
        "reviewer_name": signoff.reviewer_name,
        "updated_at": signoff.updated_at,
    }
