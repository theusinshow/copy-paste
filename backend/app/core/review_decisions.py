import unicodedata

REVIEW_DECISION_CONFIRMED = "confirmada"
REVIEW_DECISION_FALSE_POSITIVE = "falso_positivo"
REVIEW_DECISION_FIXED = "corrigido"
REVIEW_DECISION_NOT_APPLICABLE = "nao_aplicavel"
REVIEW_DECISION_NO_EVIDENCE = "sem_evidencia"

REVIEW_STATUS_ACTIVE = "active"
REVIEW_STATUS_DISMISSED = "dismissed"
REVIEW_STATUS_INCONCLUSIVE = "inconclusive"
REVIEW_STATUS_PENDING = "pending_review"
REVIEW_STATUS_RESOLVED = "resolved"

REVIEW_DECISION_LABELS = {
    REVIEW_DECISION_CONFIRMED: "Confirmada",
    REVIEW_DECISION_FALSE_POSITIVE: "Falso positivo",
    REVIEW_DECISION_FIXED: "Corrigido",
    REVIEW_DECISION_NOT_APPLICABLE: "Nao aplicavel",
    REVIEW_DECISION_NO_EVIDENCE: "Sem evidencia",
}

REVIEW_STATUS_LABELS = {
    REVIEW_STATUS_ACTIVE: "Ativa",
    REVIEW_STATUS_DISMISSED: "Descartada",
    REVIEW_STATUS_INCONCLUSIVE: "Sem evidencia",
    REVIEW_STATUS_PENDING: "Pendente",
    REVIEW_STATUS_RESOLVED: "Resolvida",
}

_DECISION_ALIASES = {
    "confirmada": REVIEW_DECISION_CONFIRMED,
    "confirmado": REVIEW_DECISION_CONFIRMED,
    "corrigida": REVIEW_DECISION_FIXED,
    "corrigido": REVIEW_DECISION_FIXED,
    "falso_positivo": REVIEW_DECISION_FALSE_POSITIVE,
    "falsopositivo": REVIEW_DECISION_FALSE_POSITIVE,
    "nao_aplicavel": REVIEW_DECISION_NOT_APPLICABLE,
    "naoaplicavel": REVIEW_DECISION_NOT_APPLICABLE,
    "sem_evidencia": REVIEW_DECISION_NO_EVIDENCE,
    "semevidencia": REVIEW_DECISION_NO_EVIDENCE,
}


def normalize_review_decision(value: str) -> str:
    normalized_key = _normalize_key(value)
    normalized_value = _DECISION_ALIASES.get(normalized_key)
    if normalized_value is None:
        allowed = ", ".join(sorted(REVIEW_DECISION_LABELS))
        raise ValueError(f"decision must be one of: {allowed}")
    return normalized_value


def get_review_decision_label(decision: str | None) -> str:
    if not decision:
        return ""

    try:
        normalized = normalize_review_decision(decision)
    except ValueError:
        return decision

    return REVIEW_DECISION_LABELS[normalized]


def get_review_status(decision: str | None) -> str:
    if not decision:
        return REVIEW_STATUS_PENDING

    try:
        normalized = normalize_review_decision(decision)
    except ValueError:
        return REVIEW_STATUS_PENDING

    if normalized == REVIEW_DECISION_CONFIRMED:
        return REVIEW_STATUS_ACTIVE
    if normalized in {
        REVIEW_DECISION_FALSE_POSITIVE,
        REVIEW_DECISION_NOT_APPLICABLE,
    }:
        return REVIEW_STATUS_DISMISSED
    if normalized == REVIEW_DECISION_FIXED:
        return REVIEW_STATUS_RESOLVED
    return REVIEW_STATUS_INCONCLUSIVE


def get_review_status_label(status: str) -> str:
    return REVIEW_STATUS_LABELS.get(status, status)


def _normalize_key(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value.strip().lower())
    normalized = "".join(
        character for character in ascii_value if not unicodedata.combining(character)
    )
    return normalized.replace("-", "_").replace(" ", "_")
