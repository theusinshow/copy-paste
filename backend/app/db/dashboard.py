from collections import Counter
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.analysis_run import AnalysisRun
from app.models.input_document import InputDocument
from app.models.issue import Issue
from app.models.review_decision import ReviewDecision


def get_dashboard_stats(session: Session) -> dict:
    runs = session.execute(
        select(
            AnalysisRun.id,
            AnalysisRun.status,
            AnalysisRun.analysis_mode,
            AnalysisRun.created_at,
        ).order_by(AnalysisRun.created_at.asc())
    ).all()

    issues = session.execute(
        select(Issue.id, Issue.analysis_run_id, Issue.type, Issue.severity)
    ).all()

    reviews = session.execute(
        select(ReviewDecision.issue_id, ReviewDecision.decision)
    ).all()

    doc_count = session.scalar(select(func.count()).select_from(InputDocument)) or 0

    # Analyses aggregation
    analyses_by_status: Counter = Counter()
    analyses_by_mode: Counter = Counter()
    for run in runs:
        analyses_by_status[run.status] += 1
        analyses_by_mode[run.analysis_mode] += 1

    # Issues aggregation
    issues_by_severity: Counter = Counter()
    issues_by_type: Counter = Counter()
    for issue in issues:
        issues_by_severity[issue.severity] += 1
        issues_by_type[issue.type] += 1

    # Review aggregation
    issue_ids_with_review = {r.issue_id for r in reviews}
    reviews_by_decision: Counter = Counter(r.decision for r in reviews)
    pending_count = len(issues) - len(issue_ids_with_review)

    # Trend: analyses per day (last 60 days)
    trend: dict[str, int] = {}
    for run in runs:
        if run.created_at:
            day = run.created_at.strftime("%Y-%m-%d")
            trend[day] = trend.get(day, 0) + 1

    top_issue_types = [
        {"type": t, "count": c}
        for t, c in issues_by_type.most_common(10)
    ]

    return {
        "totals": {
            "analyses": len(runs),
            "documents": doc_count,
            "issues": len(issues),
            "reviews_pending": pending_count,
        },
        "analyses_by_status": dict(analyses_by_status),
        "analyses_by_mode": dict(analyses_by_mode),
        "issues_by_severity": dict(issues_by_severity),
        "reviews_by_decision": {
            **dict(reviews_by_decision),
            "pending": pending_count,
        },
        "top_issue_types": top_issue_types,
        "trend": [{"date": d, "count": c} for d, c in sorted(trend.items())],
    }
