from collections.abc import Sequence
from typing import Any

from app.rules.mvp_rules import evaluate_mvp_rules, evaluate_targeted_check_rules
from app.rules.types import RuleExtractedField, RuleInputDocument, RuleIssueCandidate


def evaluate_rules(
    documents: Sequence[RuleInputDocument],
    extracted_fields: Sequence[RuleExtractedField],
    analysis_mode: str | None = None,
    config: dict[str, Any] | None = None,
) -> list[RuleIssueCandidate]:
    normalized_config = config or {}
    issues = evaluate_mvp_rules(documents, extracted_fields, config=normalized_config)
    issues.extend(
        evaluate_targeted_check_rules(
            extracted_fields,
            analysis_mode=analysis_mode,
            config=normalized_config,
        )
    )
    return issues
