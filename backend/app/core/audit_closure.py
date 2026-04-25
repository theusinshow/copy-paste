AUDIT_STATUS_CLEAN = "clean"
AUDIT_STATUS_INCOMPLETE = "incomplete"
AUDIT_STATUS_NEEDS_REVIEW = "needs_review"
AUDIT_STATUS_RELEVANT_ISSUE = "relevant_issue"

AUDIT_STATUS_LABELS = {
    AUDIT_STATUS_CLEAN: "Sem incongruencia relevante",
    AUDIT_STATUS_INCOMPLETE: "Analise incompleta por falta de evidencia",
    AUDIT_STATUS_NEEDS_REVIEW: "Com pontos de atencao",
    AUDIT_STATUS_RELEVANT_ISSUE: "Com incongruencia relevante",
}

AUDIT_STATUS_OPTIONS = (
    AUDIT_STATUS_CLEAN,
    AUDIT_STATUS_NEEDS_REVIEW,
    AUDIT_STATUS_RELEVANT_ISSUE,
    AUDIT_STATUS_INCOMPLETE,
)


def normalize_audit_status(value: str) -> str:
    normalized = value.strip()
    if normalized not in AUDIT_STATUS_OPTIONS:
        allowed = ", ".join(AUDIT_STATUS_OPTIONS)
        raise ValueError(f"final_status_code must be one of: {allowed}")
    return normalized


def get_audit_status_label(value: str) -> str:
    return AUDIT_STATUS_LABELS.get(value, value)
