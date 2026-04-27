from typing import Any

from app.core.review_decisions import (
    REVIEW_STATUS_ACTIVE,
    REVIEW_STATUS_DISMISSED,
    REVIEW_STATUS_INCONCLUSIVE,
    REVIEW_STATUS_PENDING,
    REVIEW_STATUS_RESOLVED,
    get_review_status,
)


def build_audit_summary(
    issues: list[dict[str, Any]],
    package_summary: dict[str, Any],
    drawing_lists: dict[str, Any],
    detected_sheets: dict[str, Any],
    ld_sheet_crosscheck: dict[str, Any],
    memorial_audit: dict[str, Any],
    footer_audit: dict[str, Any],
) -> dict[str, Any]:
    rules_source = _build_rules_source(issues)
    drawing_source = _build_drawing_lists_source(drawing_lists)
    ld_source = _build_ld_crosscheck_source(ld_sheet_crosscheck)
    memorial_source = _build_findings_source(
        source="memorial_audit",
        label="Memoriais",
        findings=memorial_audit.get("findings", []),
    )
    footer_source = _build_findings_source(
        source="footer_audit",
        label="Rodapes",
        findings=footer_audit.get("findings", []),
    )

    sources = [
        rules_source,
        drawing_source,
        ld_source,
        memorial_source,
        footer_source,
    ]

    metrics = {
        "active_issue_count": rules_source["active_count"],
        "attention_count": sum(source["attention_count"] for source in sources),
        "dismissed_issue_count": rules_source["dismissed_count"],
        "document_count": package_summary.get("stats", {}).get("document_count", 0),
        "incomplete_count": sum(source["incomplete_count"] for source in sources),
        "inconclusive_issue_count": rules_source["inconclusive_count"],
        "issue_count": len(issues),
        "ld_row_count": drawing_lists.get("stats", {}).get("row_count", 0),
        "page_count": package_summary.get("stats", {}).get("page_count", 0),
        "pending_review_count": rules_source["pending_review_count"],
        "relevant_count": sum(source["relevant_count"] for source in sources),
        "resolved_issue_count": rules_source["resolved_count"],
        "reviewed_issue_count": rules_source["reviewed_count"],
        "sheet_count": detected_sheets.get("stats", {}).get("sheet_count", 0),
        "undeclared_sheet_count": ld_source["undeclared_sheet_count"],
    }
    evidence_points = (
        metrics["issue_count"]
        + metrics["ld_row_count"]
        + metrics["sheet_count"]
        + memorial_audit.get("stats", {}).get("occurrence_count", 0)
        + footer_audit.get("stats", {}).get("occurrence_count", 0)
    )
    status = _build_status(metrics, evidence_points=evidence_points)

    return {
        "highlights": _build_highlights(metrics, status),
        "metrics": metrics,
        "sources": sources,
        "status": status,
    }


def _build_rules_source(issues: list[dict[str, Any]]) -> dict[str, Any]:
    active_count = 0
    attention_count = 0
    dismissed_count = 0
    incomplete_count = 0
    inconclusive_count = 0
    pending_review_count = 0
    relevant_count = 0
    resolved_count = 0

    for issue in issues:
        review_status = issue.get("review_status") or get_review_status(
            (issue.get("review") or {}).get("decision")
        )
        severity = issue.get("severity")

        if review_status == REVIEW_STATUS_PENDING:
            pending_review_count += 1
            continue
        if review_status == REVIEW_STATUS_ACTIVE:
            active_count += 1
            if severity == "relevante":
                relevant_count += 1
            else:
                attention_count += 1
            continue
        if review_status == REVIEW_STATUS_RESOLVED:
            resolved_count += 1
            continue
        if review_status == REVIEW_STATUS_DISMISSED:
            dismissed_count += 1
            continue

        inconclusive_count += 1
        incomplete_count += 1

    reviewed_count = (
        active_count + dismissed_count + inconclusive_count + resolved_count
    )

    return {
        "active_count": active_count,
        "attention_count": attention_count,
        "dismissed_count": dismissed_count,
        "incomplete_count": incomplete_count,
        "inconclusive_count": inconclusive_count,
        "item_count": len(issues),
        "label": "Pontos da revisão",
        "pending_review_count": pending_review_count,
        "relevant_count": relevant_count,
        "resolved_count": resolved_count,
        "reviewed_count": reviewed_count,
        "source": "rules_engine",
        "summary": _build_rules_source_summary(
            item_count=len(issues),
            active_count=active_count,
            dismissed_count=dismissed_count,
            incomplete_count=incomplete_count,
            pending_review_count=pending_review_count,
            relevant_count=relevant_count,
            resolved_count=resolved_count,
            fallback="Nenhum ponto rastreável foi gerado pela revisão automática.",
        ),
    }


def _build_drawing_lists_source(drawing_lists: dict[str, Any]) -> dict[str, Any]:
    alerts = drawing_lists.get("alerts", [])
    relevant_count = sum(1 for alert in alerts if alert.get("severity") == "relevante")
    attention_count = sum(1 for alert in alerts if alert.get("severity") == "atencao")

    return {
        "active_count": 0,
        "attention_count": attention_count,
        "dismissed_count": 0,
        "incomplete_count": 0,
        "inconclusive_count": 0,
        "item_count": len(alerts),
        "label": "Listas de documentos",
        "pending_review_count": 0,
        "relevant_count": relevant_count,
        "resolved_count": 0,
        "reviewed_count": 0,
        "source": "drawing_lists",
        "summary": _build_source_summary(
            item_count=len(alerts),
            relevant_count=relevant_count,
            attention_count=attention_count,
            incomplete_count=0,
            fallback="Nenhum alerta adicional foi aberto a partir das LDs.",
        ),
    }


def _build_ld_crosscheck_source(ld_sheet_crosscheck: dict[str, Any]) -> dict[str, Any]:
    results = ld_sheet_crosscheck.get("results", [])
    reverse_results = ld_sheet_crosscheck.get("reverse_results", [])
    combined_results = [*results, *reverse_results]

    relevant_count = sum(
        1 for result in combined_results if result.get("category") == "probable_issue"
    )
    attention_count = sum(
        1 for result in combined_results if result.get("category") == "needs_review"
    )
    incomplete_count = sum(
        1 for result in combined_results if result.get("category") == "extraction_limit"
    )
    undeclared_sheet_count = sum(
        1
        for result in reverse_results
        if result.get("reason") == "detected_sheet_missing_from_ld"
    )

    return {
        "active_count": 0,
        "attention_count": attention_count,
        "dismissed_count": 0,
        "incomplete_count": incomplete_count,
        "inconclusive_count": 0,
        "item_count": len(combined_results),
        "label": "LD x Pranchas",
        "pending_review_count": 0,
        "relevant_count": relevant_count,
        "resolved_count": 0,
        "reviewed_count": 0,
        "source": "ld_sheet_crosscheck",
        "summary": _build_source_summary(
            item_count=len(combined_results),
            relevant_count=relevant_count,
            attention_count=attention_count,
            incomplete_count=incomplete_count,
            fallback="Sem pontos adicionais para verificar no cruzamento entre LDs e pranchas.",
        ),
        "undeclared_sheet_count": undeclared_sheet_count,
    }


def _build_findings_source(
    source: str,
    label: str,
    findings: list[dict[str, Any]],
) -> dict[str, Any]:
    relevant_count = sum(
        1 for finding in findings if finding.get("category") == "probable_issue"
    )
    attention_count = sum(
        1 for finding in findings if finding.get("category") == "needs_review"
    )
    incomplete_count = sum(
        1 for finding in findings if finding.get("category") == "extraction_limit"
    )

    return {
        "active_count": 0,
        "attention_count": attention_count,
        "dismissed_count": 0,
        "incomplete_count": incomplete_count,
        "inconclusive_count": 0,
        "item_count": len(findings),
        "label": label,
        "pending_review_count": 0,
        "relevant_count": relevant_count,
        "resolved_count": 0,
        "reviewed_count": 0,
        "source": source,
        "summary": _build_source_summary(
            item_count=len(findings),
            relevant_count=relevant_count,
            attention_count=attention_count,
            incomplete_count=incomplete_count,
            fallback=f"Sem pontos adicionais para verificar na camada de {label.lower()}.",
        ),
    }


def _build_source_summary(
    item_count: int,
    relevant_count: int,
    attention_count: int,
    incomplete_count: int,
    fallback: str,
) -> str:
    if item_count == 0:
        return fallback

    parts = [f"{item_count} item(ns) analisado(s)"]
    if relevant_count:
        parts.append(f"{relevant_count} verificar")
    if attention_count:
        parts.append(f"{attention_count} conferir")
    if incomplete_count:
        parts.append(f"{incomplete_count} não confirmado(s)")
    return " · ".join(parts)


def _build_rules_source_summary(
    item_count: int,
    active_count: int,
    dismissed_count: int,
    incomplete_count: int,
    pending_review_count: int,
    relevant_count: int,
    resolved_count: int,
    fallback: str,
) -> str:
    if item_count == 0:
        return fallback

    parts = [f"{item_count} ponto(s) gerado(s)"]
    if active_count:
        parts.append(f"{active_count} ativa(s)")
    if relevant_count:
        parts.append(f"{relevant_count} confirmado(s) para verificar")
    if pending_review_count:
        parts.append(f"{pending_review_count} pendente(s)")
    if resolved_count:
        parts.append(f"{resolved_count} resolvida(s)")
    if dismissed_count:
        parts.append(f"{dismissed_count} descartada(s)")
    if incomplete_count:
        parts.append(f"{incomplete_count} sem evidência")
    return " · ".join(parts)


def _build_status(metrics: dict[str, int], evidence_points: int) -> dict[str, str]:
    if metrics["relevant_count"] > 0:
        return {
            "code": "relevant_issue",
            "label": "Com pontos para verificar",
            "summary": (
                f"{metrics['relevant_count']} ponto(s) confirmado(s) para verificar "
                "seguem impactando o fechamento do pacote."
            ),
            "tone": "danger",
        }

    if metrics["attention_count"] > 0 or metrics["pending_review_count"] > 0:
        attention_parts: list[str] = []
        if metrics["attention_count"] > 0:
            attention_parts.append(
                f"{metrics['attention_count']} ponto(s) para conferir"
            )
        if metrics["pending_review_count"] > 0:
            attention_parts.append(
                f"{metrics['pending_review_count']} ponto(s) pendente(s) de revisão"
            )

        return {
            "code": "needs_review",
            "label": "Com pontos para revisar",
            "summary": (
                "O pacote ainda possui "
                + " e ".join(attention_parts)
                + " antes do fechamento."
            ),
            "tone": "warning",
        }

    if metrics["incomplete_count"] > 0 or evidence_points == 0:
        return {
            "code": "incomplete",
            "label": "Análise incompleta por falta de evidência",
            "summary": (
                "O pacote não reuniu evidência suficiente para encerrar a "
                "auditoria sem ressalvas."
            ),
            "tone": "muted",
        }

    return {
        "code": "clean",
        "label": "Sem pontos relevantes para verificar",
        "summary": "A revisão consolidada não encontrou ponto relevante ativo.",
        "tone": "success",
    }


def _build_highlights(
    metrics: dict[str, int],
    status: dict[str, str],
) -> list[dict[str, str]]:
    highlights: list[dict[str, str]] = []

    if metrics["relevant_count"] > 0:
        highlights.append(
            {
                "message": (
                    f"{metrics['relevant_count']} ponto(s) confirmado(s) "
                    "precisam ser verificados antes do fechamento."
                ),
                "tone": "danger",
            }
        )

    if metrics["attention_count"] > 0:
        highlights.append(
            {
                "message": (
                    f"{metrics['attention_count']} ponto(s) seguem ativos com "
                    "classificação de atenção ou exigem conferências adicionais."
                ),
                "tone": "warning",
            }
        )

    if metrics["undeclared_sheet_count"] > 0:
        highlights.append(
            {
                "message": (
                    f"{metrics['undeclared_sheet_count']} prancha(s) foram "
                    "detectadas sem LD correspondente. Conferir se isso se aplica ao pacote."
                ),
                "tone": "danger",
            }
        )

    if metrics["pending_review_count"] > 0:
        highlights.append(
            {
                "message": (
                    f"{metrics['pending_review_count']} ponto(s) da revisão automática "
                    "ainda estão sem decisão registrada."
                ),
                "tone": "muted",
            }
        )

    if metrics["incomplete_count"] > 0:
        highlights.append(
            {
                "message": (
                    f"{metrics['incomplete_count']} caso(s) ficaram sem evidência "
                    "suficiente e reduzem a confiança do fechamento."
                ),
                "tone": "muted",
            }
        )

    if not highlights:
        highlights.append(
            {
                "message": status["summary"],
                "tone": status["tone"],
            }
        )

    return highlights[:4]
