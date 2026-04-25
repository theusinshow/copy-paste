from datetime import datetime, timezone
from html import escape
from typing import Any

from app.core.review_decisions import (
    REVIEW_STATUS_ACTIVE,
    REVIEW_STATUS_DISMISSED,
    REVIEW_STATUS_INCONCLUSIVE,
    REVIEW_STATUS_PENDING,
    REVIEW_STATUS_RESOLVED,
)


def build_analysis_export_payload(
    analysis_id: int,
    analysis_status: str,
    package_summary: dict[str, Any],
    audit_summary: dict[str, Any],
    issues: list[dict[str, Any]],
    ld_sheet_crosscheck: dict[str, Any],
    signoff: dict[str, Any] | None = None,
    mode_output: dict[str, Any] | None = None,
) -> dict[str, Any]:
    identity = package_summary.get("identity", {})
    metrics = audit_summary.get("metrics", {})
    status = audit_summary.get("status", {})
    highlights = audit_summary.get("highlights", [])
    sources = audit_summary.get("sources", [])

    return {
        "analysis_id": analysis_id,
        "analysis_status": analysis_status,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "highlights": highlights,
        "identity": identity,
        "issues": issues,
        "ld_sheet_crosscheck": ld_sheet_crosscheck,
        "metrics": metrics,
        "mode_output": mode_output,
        "signoff": signoff,
        "sources": sources,
        "status": status,
    }


def build_analysis_export_markdown(payload: dict[str, Any]) -> str:
    identity = payload["identity"]
    metrics = payload["metrics"]
    status = payload["status"]
    highlights = payload["highlights"]
    sources = payload["sources"]
    mode_output = payload.get("mode_output")

    lines = [
        "# Relatorio de auditoria do pacote",
        "",
        f"- Analise: #{payload['analysis_id']:04d}",
        f"- Status tecnico: {payload['analysis_status']}",
        f"- Exportado em: {payload['exported_at']}",
        "",
        "## Fechamento executivo",
        f"- Status final calculado: {status.get('label', 'Nao consolidado')}",
        f"- Resumo: {status.get('summary', 'Sem resumo executivo disponivel.')}",
        "",
        "## Encerramento formal",
    ]
    lines.extend(_build_signoff_markdown_section(payload.get("signoff")))

    lines.extend(
        [
            "",
            "## Metricas",
            f"- Documentos: {metrics.get('document_count', 0)}",
            f"- Paginas: {metrics.get('page_count', 0)}",
            f"- Linhas de LD: {metrics.get('ld_row_count', 0)}",
            f"- Pranchas detectadas: {metrics.get('sheet_count', 0)}",
            f"- Issues totais: {metrics.get('issue_count', 0)}",
            f"- Conflitos ativos: {metrics.get('relevant_count', 0)}",
            f"- Pontos de atencao: {metrics.get('attention_count', 0)}",
            f"- Revisoes pendentes: {metrics.get('pending_review_count', 0)}",
            f"- Resolvidas: {metrics.get('resolved_issue_count', 0)}",
            f"- Descartadas: {metrics.get('dismissed_issue_count', 0)}",
            f"- Sem evidencia: {metrics.get('inconclusive_issue_count', 0)}",
            f"- Pranchas sem LD: {metrics.get('undeclared_sheet_count', 0)}",
            "",
            "## Identidade do pacote",
            f"- Numero de projeto: {_string_or_default(identity.get('project_code'))}",
            f"- Nome da obra: {_string_or_default(identity.get('work_name'))}",
            f"- Bairro: {_string_or_default(identity.get('bairro'))}",
            f"- Cliente: {_string_or_default(identity.get('client'))}",
            f"- Data de referencia: {_string_or_default(identity.get('date'))}",
            f"- Disciplinas: {_join_values(identity.get('disciplines', []))}",
            f"- Volumes: {_join_values(identity.get('volumes', []))}",
            "",
            "## Destaques",
        ]
    )

    if highlights:
        lines.extend([f"- {highlight.get('message', '')}" for highlight in highlights])
    else:
        lines.append("- Nenhum destaque adicional consolidado.")

    if mode_output is not None:
        lines.extend(_build_mode_output_markdown_section(mode_output))

    lines.extend(
        _build_issue_section(
            title="Issues ativas",
            issues=payload["issues"],
            expected_status=REVIEW_STATUS_ACTIVE,
        )
    )
    lines.extend(
        _build_issue_section(
            title="Issues pendentes de revisao",
            issues=payload["issues"],
            expected_status=REVIEW_STATUS_PENDING,
        )
    )
    lines.extend(
        _build_issue_section(
            title="Issues resolvidas",
            issues=payload["issues"],
            expected_status=REVIEW_STATUS_RESOLVED,
        )
    )
    lines.extend(
        _build_issue_section(
            title="Issues descartadas",
            issues=payload["issues"],
            expected_status=REVIEW_STATUS_DISMISSED,
        )
    )
    lines.extend(
        _build_issue_section(
            title="Issues sem evidencia",
            issues=payload["issues"],
            expected_status=REVIEW_STATUS_INCONCLUSIVE,
        )
    )
    lines.extend(
        _build_undeclared_sheet_section(
            payload["ld_sheet_crosscheck"].get("reverse_results", [])
        )
    )
    lines.extend(_build_source_section(sources))

    return "\n".join(lines).strip() + "\n"


def build_analysis_export_html(payload: dict[str, Any]) -> str:
    highlights_html = "".join(
        f"<li>{escape(highlight.get('message', ''))}</li>"
        for highlight in payload["highlights"]
    ) or "<li>Nenhum destaque adicional consolidado.</li>"

    metrics_html = "".join(
        [
            _metric_html("Documentos", payload["metrics"].get("document_count", 0)),
            _metric_html("Paginas", payload["metrics"].get("page_count", 0)),
            _metric_html("Conflitos ativos", payload["metrics"].get("relevant_count", 0)),
            _metric_html("Pendentes", payload["metrics"].get("pending_review_count", 0)),
            _metric_html("Resolvidas", payload["metrics"].get("resolved_issue_count", 0)),
            _metric_html("Descartadas", payload["metrics"].get("dismissed_issue_count", 0)),
        ]
    )

    issue_sections_html = "".join(
        [
            _issue_section_html("Issues ativas", payload["issues"], REVIEW_STATUS_ACTIVE),
            _issue_section_html(
                "Issues pendentes de revisao",
                payload["issues"],
                REVIEW_STATUS_PENDING,
            ),
            _issue_section_html(
                "Issues resolvidas",
                payload["issues"],
                REVIEW_STATUS_RESOLVED,
            ),
            _issue_section_html(
                "Issues descartadas",
                payload["issues"],
                REVIEW_STATUS_DISMISSED,
            ),
            _issue_section_html(
                "Issues sem evidencia",
                payload["issues"],
                REVIEW_STATUS_INCONCLUSIVE,
            ),
        ]
    )

    undeclared_sheets_html = _undeclared_sheet_section_html(
        payload["ld_sheet_crosscheck"].get("reverse_results", [])
    )
    mode_output_html = _mode_output_html(payload.get("mode_output"))
    signoff_html = _signoff_html(payload.get("signoff"))
    sources_html = "".join(
        [
            "<li>"
            + escape(source.get("label", source.get("source", "fonte")))
            + ": "
            + escape(source.get("summary", "Sem resumo."))
            + "</li>"
            for source in payload["sources"]
        ]
    ) or "<li>Nenhuma fonte consolidada.</li>"

    identity = payload["identity"]

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatorio de auditoria #{payload['analysis_id']:04d}</title>
    <style>
      body {{ font-family: Arial, sans-serif; margin: 0; background: #f4f1ea; color: #1e1b16; }}
      main {{ max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }}
      section {{ background: #fffdf8; border: 1px solid #d7d0c3; border-radius: 20px; padding: 20px; margin-top: 16px; }}
      h1, h2, h3 {{ margin: 0 0 12px; }}
      p, li {{ line-height: 1.6; }}
      ul {{ margin: 0; padding-left: 20px; }}
      .hero {{ display: grid; gap: 16px; grid-template-columns: 2fr 1fr; }}
      .status {{ border: 1px solid #bda978; background: #f6edd8; border-radius: 16px; padding: 16px; }}
      .metrics {{ display: grid; gap: 12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }}
      .metric {{ border: 1px solid #d7d0c3; border-radius: 16px; padding: 12px; background: #fff; }}
      .issue {{ border: 1px solid #d7d0c3; border-radius: 16px; padding: 12px; margin-top: 12px; background: #fff; }}
      .muted {{ color: #6b6357; }}
      .config-chip {{ display: inline-block; border: 1px solid #d7d0c3; border-radius: 999px; padding: 6px 10px; margin-right: 8px; margin-bottom: 8px; }}
      @media print {{ body {{ background: #fff; }} main {{ padding: 0; }} section {{ break-inside: avoid; }} }}
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <h1>Relatorio de auditoria do pacote</h1>
          <p class="muted">Analise #{payload['analysis_id']:04d} · status tecnico {escape(payload['analysis_status'])}</p>
          <p>{escape(payload['status'].get('summary', 'Sem resumo executivo disponivel.'))}</p>
        </div>
        <div class="status">
          <p class="muted">Status final calculado</p>
          <h2>{escape(payload['status'].get('label', 'Nao consolidado'))}</h2>
          <p class="muted">Exportado em {escape(payload['exported_at'])}</p>
        </div>
      </section>

      <section>
        <h2>Encerramento formal</h2>
        {signoff_html}
      </section>

      <section>
        <h2>Metricas</h2>
        <div class="metrics">{metrics_html}</div>
      </section>

      <section>
        <h2>Identidade do pacote</h2>
        <ul>
          <li>Numero de projeto: {escape(_string_or_default(identity.get('project_code')))}</li>
          <li>Nome da obra: {escape(_string_or_default(identity.get('work_name')))}</li>
          <li>Bairro: {escape(_string_or_default(identity.get('bairro')))}</li>
          <li>Cliente: {escape(_string_or_default(identity.get('client')))}</li>
          <li>Data de referencia: {escape(_string_or_default(identity.get('date')))}</li>
          <li>Disciplinas: {escape(_join_values(identity.get('disciplines', [])))}</li>
          <li>Volumes: {escape(_join_values(identity.get('volumes', [])))}</li>
        </ul>
      </section>

      <section>
        <h2>Destaques</h2>
        <ul>{highlights_html}</ul>
      </section>

      {mode_output_html}

      <section>
        <h2>Fila de issues</h2>
        {issue_sections_html}
      </section>

      <section>
        <h2>Pranchas detectadas sem LD correspondente</h2>
        {undeclared_sheets_html}
      </section>

      <section>
        <h2>Fontes consolidadas</h2>
        <ul>{sources_html}</ul>
      </section>
    </main>
  </body>
</html>
"""


def _build_issue_section(
    title: str,
    issues: list[dict[str, Any]],
    expected_status: str,
) -> list[str]:
    filtered_issues = [
        issue for issue in issues if issue.get("review_status") == expected_status
    ]
    lines = ["", f"## {title}"]
    if not filtered_issues:
        lines.append("- Nenhuma.")
        return lines

    for issue in filtered_issues:
        review = issue.get("review") or {}
        evidences = issue.get("evidences", [])
        lines.append(
            "- "
            + f"#{issue.get('id')} [{issue.get('severity', 'sem-severidade')}] "
            + f"{issue.get('type', 'sem-tipo')}: {issue.get('description', '')}"
        )
        lines.append(
            f"  Status: {issue.get('review_status_label', 'Sem status consolidado')}"
        )
        if review.get("decision_label"):
            lines.append(f"  Decisao: {review.get('decision_label')}")
        if review.get("comment"):
            lines.append(f"  Comentario: {review.get('comment')}")
        if evidences:
            first_evidence = evidences[0]
            lines.append(
                "  Evidencia: "
                + f"p.{first_evidence.get('page', '?')} "
                + _clip_text(first_evidence.get("text", ""))
            )
        else:
            lines.append("  Evidencia: nao disponivel")

    return lines


def _build_signoff_markdown_section(signoff: dict[str, Any] | None) -> list[str]:
    if signoff is None:
        return ["- Nenhum encerramento formal registrado."]

    return [
        f"- Status assinado: {signoff.get('final_status_label', '-')}", 
        f"- Responsavel: {_string_or_default(signoff.get('reviewer_name'))}",
        f"- Atualizado em: {_string_or_default(signoff.get('updated_at'))}",
        f"- Comentario: {_string_or_default(signoff.get('comment'))}",
    ]


def _build_mode_output_markdown_section(mode_output: dict[str, Any]) -> list[str]:
    lines = [
        "",
        f"## {mode_output.get('title', 'Modo dirigido')}",
        f"- Resumo: {mode_output.get('summary', '-')}",
    ]

    if mode_output.get("query"):
        lines.append(f"- Buscar: {mode_output['query']}")
    if mode_output.get("replace") is not None:
        lines.append(f"- Substituir por: {mode_output['replace']}")
    if mode_output.get("expected"):
        lines.append(f"- Valor esperado: {mode_output['expected']}")

    entries = mode_output.get("entries", [])
    if not entries:
        lines.append("- Nenhuma evidencia adicional registrada.")
        return lines

    lines.append("- Evidencias:")
    for entry in entries[:20]:
        lines.append(
            "  - "
            + f"{entry.get('filename', 'sem-arquivo')} | p.{entry.get('page', '-')} | "
            + _clip_text(entry.get("value", ""))
        )
    if len(entries) > 20:
        lines.append(f"  - ... e mais {len(entries) - 20} item(ns).")
    return lines


def _build_undeclared_sheet_section(reverse_results: list[dict[str, Any]]) -> list[str]:
    undeclared_sheets = [
        result
        for result in reverse_results
        if result.get("reason") == "detected_sheet_missing_from_ld"
    ]
    lines = ["", "## Pranchas detectadas sem LD correspondente"]

    if not undeclared_sheets:
        lines.append("- Nenhuma.")
        return lines

    for result in undeclared_sheets:
        lines.append(
            "- "
            + f"{result.get('sheet_code', 'sem-codigo')} "
            + f"| {result.get('sheet_filename', 'sem-arquivo')} "
            + f"| p.{result.get('sheet_page', '?')} "
            + f"| {result.get('message', '')}"
        )

    return lines


def _build_source_section(sources: list[dict[str, Any]]) -> list[str]:
    lines = ["", "## Fontes consolidadas"]
    if not sources:
        lines.append("- Nenhuma fonte consolidada.")
        return lines

    for source in sources:
        lines.append(
            "- "
            + f"{source.get('label', source.get('source', 'fonte'))}: "
            + source.get("summary", "Sem resumo.")
        )

    return lines


def _metric_html(label: str, value: Any) -> str:
    return (
        '<div class="metric">'
        + f"<p class=\"muted\">{escape(str(label))}</p>"
        + f"<h3>{escape(str(value))}</h3>"
        + "</div>"
    )


def _signoff_html(signoff: dict[str, Any] | None) -> str:
    if signoff is None:
        return "<p class=\"muted\">Nenhum encerramento formal registrado.</p>"

    return (
        "<ul>"
        + f"<li>Status assinado: {escape(_string_or_default(signoff.get('final_status_label')))}</li>"
        + f"<li>Responsavel: {escape(_string_or_default(signoff.get('reviewer_name')))}</li>"
        + f"<li>Atualizado em: {escape(_string_or_default(signoff.get('updated_at')))}</li>"
        + f"<li>Comentario: {escape(_string_or_default(signoff.get('comment')))}</li>"
        + "</ul>"
    )


def _issue_section_html(title: str, issues: list[dict[str, Any]], expected_status: str) -> str:
    filtered_issues = [
        issue for issue in issues if issue.get("review_status") == expected_status
    ]
    if not filtered_issues:
        return f"<section><h3>{escape(title)}</h3><p class=\"muted\">Nenhuma.</p></section>"

    cards = []
    for issue in filtered_issues:
        review = issue.get("review") or {}
        evidence = (issue.get("evidences") or [None])[0]
        evidence_text = "nao disponivel"
        if evidence:
            evidence_text = f"p.{evidence.get('page', '-')} {_clip_text(evidence.get('text', ''))}"

        cards.append(
            '<article class="issue">'
            + f"<h3>#{issue.get('id')} [{escape(issue.get('severity', 'sem-severidade'))}] {escape(issue.get('type', 'sem-tipo'))}</h3>"
            + f"<p>{escape(issue.get('description', ''))}</p>"
            + f"<p class=\"muted\">Status: {escape(issue.get('review_status_label', '-'))}</p>"
            + (
                f"<p class=\"muted\">Decisao: {escape(review.get('decision_label', ''))}</p>"
                if review.get("decision_label")
                else ""
            )
            + f"<p class=\"muted\">Evidencia principal: {escape(evidence_text)}</p>"
            + "</article>"
        )

    return f"<section><h3>{escape(title)}</h3>{''.join(cards)}</section>"


def _undeclared_sheet_section_html(reverse_results: list[dict[str, Any]]) -> str:
    undeclared_sheets = [
        result
        for result in reverse_results
        if result.get("reason") == "detected_sheet_missing_from_ld"
    ]
    if not undeclared_sheets:
        return "<p class=\"muted\">Nenhuma.</p>"

    items = "".join(
        [
            "<li>"
            + escape(
                f"{result.get('sheet_code', 'sem-codigo')} | {result.get('sheet_filename', 'sem-arquivo')} | p.{result.get('sheet_page', '-')} | {result.get('message', '')}"
            )
            + "</li>"
            for result in undeclared_sheets
        ]
    )
    return f"<ul>{items}</ul>"


def _mode_output_html(mode_output: dict[str, Any] | None) -> str:
    if mode_output is None:
        return ""

    chips = []
    if mode_output.get("query"):
        chips.append(f"<span class=\"config-chip\">Buscar: {escape(mode_output['query'])}</span>")
    if mode_output.get("replace") is not None:
        chips.append(
            f"<span class=\"config-chip\">Substituir por: {escape(mode_output['replace'])}</span>"
        )
    if mode_output.get("expected"):
        chips.append(
            f"<span class=\"config-chip\">Esperado: {escape(mode_output['expected'])}</span>"
        )

    entries = mode_output.get("entries", [])
    entries_html = "".join(
        [
            '<article class="issue">'
            + f"<p><strong>{escape(entry.get('filename', 'sem-arquivo'))}</strong> · p.{escape(str(entry.get('page', '-')))}</p>"
            + f"<p>{escape(entry.get('value', ''))}</p>"
            + (
                f"<p class=\"muted\">Sugestao: {escape(entry.get('replacement_preview', ''))}</p>"
                if entry.get("replacement_preview") is not None
                else ""
            )
            + (
                f"<p class=\"muted\">Esperado: {escape(entry.get('expected_value', ''))}</p>"
                if entry.get("expected_value")
                else ""
            )
            + "</article>"
            for entry in entries[:20]
        ]
    ) or "<p class=\"muted\">Nenhuma evidencia adicional registrada.</p>"

    if len(entries) > 20:
        entries_html += (
            f"<p class=\"muted\">... e mais {len(entries) - 20} item(ns).</p>"
        )

    return (
        "<section>"
        + f"<h2>{escape(mode_output.get('title', 'Modo dirigido'))}</h2>"
        + f"<p>{escape(mode_output.get('summary', '-'))}</p>"
        + "".join(chips)
        + entries_html
        + "</section>"
    )


def _clip_text(value: str, limit: int = 180) -> str:
    compact_value = " ".join(str(value).split())
    if len(compact_value) <= limit:
        return compact_value
    return compact_value[: limit - 3].rstrip() + "..."


def _join_values(values: list[Any]) -> str:
    normalized_values = [str(value).strip() for value in values if str(value).strip()]
    if not normalized_values:
        return "-"
    return ", ".join(normalized_values)


def _string_or_default(value: Any) -> str:
    if value is None:
        return "-"
    text = str(value).strip()
    return text if text else "-"
