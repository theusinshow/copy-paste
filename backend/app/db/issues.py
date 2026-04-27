from collections.abc import Sequence

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.review_decisions import (
    get_review_decision_label,
    get_review_status,
    get_review_status_label,
)
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


def list_issues_by_ids(session: Session, issue_ids: Sequence[int]) -> list[Issue]:
    if not issue_ids:
        return []

    statement = select(Issue).where(Issue.id.in_(issue_ids)).order_by(Issue.id.asc())
    return list(session.scalars(statement).all())


def list_issues_with_evidences_by_analysis_id(
    session: Session,
    analysis_id: int,
) -> list[dict]:
    issues = list_issues_by_analysis_id(session, analysis_id)
    return _build_issue_payloads(session, issues)


def get_issue_by_id(session: Session, issue_id: int) -> Issue | None:
    return session.get(Issue, issue_id)


def get_issue_with_evidences_by_id(
    session: Session,
    issue_id: int,
) -> dict | None:
    issue = get_issue_by_id(session, issue_id)
    if issue is None:
        return None

    payloads = _build_issue_payloads(session, [issue])
    return payloads[0] if payloads else None


def upsert_review_decision(
    session: Session,
    issue_id: int,
    decision: str,
    comment: str,
) -> ReviewDecision:
    review_decision = session.get(ReviewDecision, issue_id)
    if review_decision is None:
        review_decision = ReviewDecision(
            issue_id=issue_id,
            decision=decision,
            comment=comment,
        )
        session.add(review_decision)
    else:
        review_decision.decision = decision
        review_decision.comment = comment

    session.flush()
    return review_decision


def _build_issue_payloads(
    session: Session,
    issues: Sequence[Issue],
) -> list[dict]:
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
            ExtractedField.input_document_id,
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
                "document_id": row.input_document_id,
            }
        )

    review_rows = session.execute(
        select(
            ReviewDecision.issue_id,
            ReviewDecision.decision,
            ReviewDecision.comment,
        )
        .where(ReviewDecision.issue_id.in_(issue_ids))
        .order_by(ReviewDecision.issue_id.asc())
    ).all()
    reviews_by_issue_id = {
        row.issue_id: {
            "issue_id": row.issue_id,
            "decision": row.decision,
            "decision_label": get_review_decision_label(row.decision),
            "comment": row.comment,
            "status": get_review_status(row.decision),
            "status_label": get_review_status_label(get_review_status(row.decision)),
        }
        for row in review_rows
    }

    payloads: list[dict] = []
    for issue in issues:
        review = reviews_by_issue_id.get(issue.id)
        review_status = review["status"] if review else get_review_status(None)
        payloads.append(
            {
                "id": issue.id,
                "analysis_run_id": issue.analysis_run_id,
                "type": issue.type,
                "severity": issue.severity,
                "description": issue.description,
                "evidences": evidences_by_issue_id.get(issue.id, []),
                "review": review,
                "review_status": review_status,
                "review_status_label": get_review_status_label(review_status),
            }
        )

    return payloads


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
