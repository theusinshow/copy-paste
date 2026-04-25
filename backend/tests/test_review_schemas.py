import unittest

from app.core.review_decisions import (
    REVIEW_STATUS_ACTIVE,
    REVIEW_STATUS_DISMISSED,
    REVIEW_STATUS_INCONCLUSIVE,
    REVIEW_STATUS_PENDING,
    REVIEW_STATUS_RESOLVED,
    get_review_decision_label,
    get_review_status,
    normalize_review_decision,
)


class ReviewDecisionSchemaTests(unittest.TestCase):
    def test_normalize_review_decision_accepts_common_aliases(self) -> None:
        self.assertEqual(normalize_review_decision("Falso Positivo"), "falso_positivo")
        self.assertEqual(normalize_review_decision("Não aplicável"), "nao_aplicavel")
        self.assertEqual(normalize_review_decision("Sem evidencia"), "sem_evidencia")

    def test_get_review_status_maps_each_standard_decision(self) -> None:
        self.assertEqual(get_review_status("confirmada"), REVIEW_STATUS_ACTIVE)
        self.assertEqual(get_review_status("corrigido"), REVIEW_STATUS_RESOLVED)
        self.assertEqual(get_review_status("falso_positivo"), REVIEW_STATUS_DISMISSED)
        self.assertEqual(get_review_status("nao_aplicavel"), REVIEW_STATUS_DISMISSED)
        self.assertEqual(get_review_status("sem_evidencia"), REVIEW_STATUS_INCONCLUSIVE)
        self.assertEqual(get_review_status(None), REVIEW_STATUS_PENDING)

    def test_get_review_decision_label_returns_human_label(self) -> None:
        self.assertEqual(get_review_decision_label("confirmada"), "Confirmada")
        self.assertEqual(
            get_review_decision_label("sem_evidencia"),
            "Sem evidencia",
        )


if __name__ == "__main__":
    unittest.main()
