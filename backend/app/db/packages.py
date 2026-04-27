from collections import Counter, defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis_run import AnalysisRun
from app.models.extracted_field import ExtractedField
from app.models.input_document import InputDocument


def get_package_history(session: Session) -> list[dict]:
    runs = session.execute(
        select(
            AnalysisRun.id,
            AnalysisRun.status,
            AnalysisRun.analysis_mode,
            AnalysisRun.created_at,
        ).order_by(AnalysisRun.created_at.desc())
    ).all()

    if not runs:
        return []

    run_ids = [r.id for r in runs]

    code_rows = session.execute(
        select(
            InputDocument.analysis_run_id,
            ExtractedField.normalized_value,
        )
        .join(ExtractedField, ExtractedField.input_document_id == InputDocument.id)
        .where(
            InputDocument.analysis_run_id.in_(run_ids),
            ExtractedField.field_name == "numero_projeto",
        )
    ).all()

    codes_by_run: dict[int, Counter] = defaultdict(Counter)
    for row in code_rows:
        if row.normalized_value:
            codes_by_run[row.analysis_run_id][row.normalized_value] += 1

    def dominant_code(run_id: int) -> str:
        counter = codes_by_run.get(run_id)
        if not counter:
            return "Sem código"
        return counter.most_common(1)[0][0]

    packages: dict[str, list[dict]] = defaultdict(list)
    for run in runs:
        code = dominant_code(run.id)
        packages[code].append({
            "id": run.id,
            "status": run.status,
            "analysis_mode": run.analysis_mode,
            "created_at": run.created_at.isoformat() if run.created_at else None,
        })

    return [
        {
            "project_code": code,
            "analysis_count": len(analyses),
            "latest_at": analyses[0]["created_at"],
            "analyses": analyses,
        }
        for code, analyses in sorted(
            packages.items(),
            key=lambda kv: kv[1][0]["created_at"] or "",
            reverse=True,
        )
    ]
