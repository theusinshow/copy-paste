from dataclasses import dataclass

from app.core.analysis_modes import (
    ANALYSIS_MODE_LD_ONLY,
    ANALYSIS_MODE_MEMORIAL_ONLY,
    ANALYSIS_MODE_SHEETS_ONLY,
    analysis_mode_uses_rules,
    normalize_analysis_mode,
)
from app.models.analysis_run import AnalysisRun
from app.models.input_document import InputDocument


@dataclass(frozen=True)
class AnalysisExecutionPlan:
    evaluation_documents: list[InputDocument]
    run_rules: bool


def build_analysis_execution_plan(
    analysis_run: AnalysisRun,
    input_documents: list[InputDocument],
) -> AnalysisExecutionPlan:
    analysis_mode = normalize_analysis_mode(analysis_run.analysis_mode)
    evaluation_documents = _select_evaluation_documents(analysis_mode, input_documents)
    return AnalysisExecutionPlan(
        evaluation_documents=evaluation_documents,
        run_rules=analysis_mode_uses_rules(analysis_mode),
    )


def _select_evaluation_documents(
    analysis_mode: str,
    input_documents: list[InputDocument],
) -> list[InputDocument]:
    if analysis_mode == ANALYSIS_MODE_MEMORIAL_ONLY:
        return _filter_documents_by_tipo(
            analysis_mode,
            input_documents,
            keywords=("memorial",),
        )

    if analysis_mode == ANALYSIS_MODE_SHEETS_ONLY:
        return _filter_documents_by_tipo(
            analysis_mode,
            input_documents,
            keywords=("sheet", "sheets", "prancha", "pranchas", "planta", "plantas"),
        )

    if analysis_mode == ANALYSIS_MODE_LD_ONLY:
        return _filter_documents_by_tipo(
            analysis_mode,
            input_documents,
            keywords=("ld",),
        )

    return input_documents


def _filter_documents_by_tipo(
    analysis_mode: str,
    input_documents: list[InputDocument],
    keywords: tuple[str, ...],
) -> list[InputDocument]:
    filtered_documents = [
        input_document
        for input_document in input_documents
        if _tipo_matches(input_document.tipo, keywords)
    ]
    if not filtered_documents:
        raise ValueError(
            f"Analysis mode {analysis_mode} requires matching input document types"
        )
    return filtered_documents


def _tipo_matches(tipo: str, keywords: tuple[str, ...]) -> bool:
    normalized_tipo = tipo.strip().lower()
    return any(keyword in normalized_tipo for keyword in keywords)
