from collections.abc import Sequence

from app.rules.mvp_rules import evaluate_mvp_rules
from app.rules.types import RuleExtractedField, RuleInputDocument, RuleIssueCandidate


def evaluate_rules(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
) -> list[RuleIssueCandidate]:
    return evaluate_mvp_rules(documents, extracted_fields)
