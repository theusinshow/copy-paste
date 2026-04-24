from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.extracted_field import ExtractedField
from app.models.issue import Issue
from app.models.issue_evidence import IssueEvidence
from app.models.review_decision import ReviewDecision
from app.rules.types import RuleIssueCandidate


def replace_analysis_issues(
    session: Session,
    analysis_id: int,
    issues: Sequence[RuleIssueCandidate],
) -> list[Issue]:
    _delete_analysis_issues(session, analysis_id)

    persisted_issues: list[Issue] = []
    for candidate in issues:
        if not candidate.evidences:
            raise ValueError("Issue must contain evidence")

        issue = Issue(
            analysis_run_id=analysis_id,
            type=candidate.type,
            severity=candidate.severity,
            description=candidate.description,
        )
        session.add(issue)
        session.flush()

        session.add_all(
            [
                IssueEvidence(
                    issue_id=issue.id,
                    field_id=evidence.field_id,
                    page=evidence.page,
                    bbox=evidence.bbox,
                )
                for evidence in candidate.evidences
            ]
        )
        persisted_issues.append(issue)

    session.flush()
    return persisted_issues


def list_issues_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> list[Issue]:
    statement = (
        select(Issue)
        .where(Issue.analysis_run_id == analysis_id)
        .order_by(Issue.id.asc())
    )
    return list(session.scalars(statement).all())


def list_issues_with_evidences_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> list[dict]:
    issues = list_issues_by_analysis_id(session, analysis_id)
    if not issues:
        return []

    issue_ids = [issue.id for issue in issues]
    evidence_rows = session.execute(
        select(
            IssueEvidence.issue_id,
            IssueEvidence.field_id,
            IssueEvidence.page,
            IssueEvidence.bbox,
            ExtractedField.raw_value,
        )
        .join(ExtractedField, ExtractedField.id == IssueEvidence.field_id)
        .where(IssueEvidence.issue_id.in_(issue_ids))
        .order_by(IssueEvidence.issue_id.asc(), IssueEvidence.page.asc(), IssueEvidence.field_id.asc())
    ).all()

    evidences_by_issue_id: dict[int, list[dict]] = {issue_id: [] for issue_id in issue_ids}
    for row in evidence_rows:
        evidences_by_issue_id[row.issue_id].append(
            {
                "issue_id": row.issue_id,
                "field_id": row.field_id,
                "page": row.page,
                "bbox": row.bbox,
                "text": row.raw_value,
            }
        )

    return [
        {
            "id": issue.id,
            "analysis_run_id": issue.analysis_run_id,
            "type": issue.type,
            "severity": issue.severity,
            "description": issue.description,
            "evidences": evidences_by_issue_id.get(issue.id, []),
        }
        for issue in issues
    ]


def _delete_analysis_issues(session: Session, analysis_id: int) -> None:
    issue_ids = list(
        session.scalars(
            select(Issue.id).where(Issue.analysis_run_id == analysis_id)
        ).all()
    )
    if not issue_ids:
        return

    session.execute(delete(ReviewDecision).where(ReviewDecision.issue_id.in_(issue_ids)))
    session.execute(delete(IssueEvidence).where(IssueEvidence.issue_id.in_(issue_ids)))
    session.execute(delete(Issue).where(Issue.id.in_(issue_ids)))
