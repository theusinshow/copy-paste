from typing import Any, Literal, cast

ANALYSIS_MODE_FULL_CHECK = "full_check"
ANALYSIS_MODE_MEMORIAL_ONLY = "memorial_only"
ANALYSIS_MODE_SHEETS_ONLY = "sheets_only"
ANALYSIS_MODE_LD_ONLY = "ld_only"
ANALYSIS_MODE_FIND_TEXT = "find_text"
ANALYSIS_MODE_FIND_REPLACE = "find_replace"
ANALYSIS_MODE_CHECK_ADDRESS = "check_address"
ANALYSIS_MODE_CHECK_PROJECT_NUMBER = "check_project_number"
ANALYSIS_MODE_CHECK_WORK_NAME = "check_work_name"

AnalysisMode = Literal[
    "full_check",
    "memorial_only",
    "sheets_only",
    "ld_only",
    "find_text",
    "find_replace",
    "check_address",
    "check_project_number",
    "check_work_name",
]

ANALYSIS_MODE_DEFAULT: AnalysisMode = ANALYSIS_MODE_FULL_CHECK

ANALYSIS_MODES: tuple[AnalysisMode, ...] = (
    ANALYSIS_MODE_FULL_CHECK,
    ANALYSIS_MODE_MEMORIAL_ONLY,
    ANALYSIS_MODE_SHEETS_ONLY,
    ANALYSIS_MODE_LD_ONLY,
    ANALYSIS_MODE_FIND_TEXT,
    ANALYSIS_MODE_FIND_REPLACE,
    ANALYSIS_MODE_CHECK_ADDRESS,
    ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
    ANALYSIS_MODE_CHECK_WORK_NAME,
)

ANALYSIS_MODES_WITH_RULES: frozenset[AnalysisMode] = frozenset(
    {
        ANALYSIS_MODE_FULL_CHECK,
        ANALYSIS_MODE_MEMORIAL_ONLY,
        ANALYSIS_MODE_SHEETS_ONLY,
        ANALYSIS_MODE_LD_ONLY,
    }
)


def validate_analysis_payload(
    analysis_mode: str | None,
    config: dict[str, Any] | None,
) -> tuple[AnalysisMode, dict[str, Any]]:
    normalized_mode = normalize_analysis_mode(analysis_mode)
    normalized_config = normalize_analysis_config(config)
    _validate_mode_config(normalized_mode, normalized_config)
    return normalized_mode, normalized_config


def normalize_analysis_mode(analysis_mode: str | None) -> AnalysisMode:
    if analysis_mode is None:
        return ANALYSIS_MODE_DEFAULT

    if analysis_mode not in ANALYSIS_MODES:
        raise ValueError("Invalid analysis_mode")

    return cast(AnalysisMode, analysis_mode)


def normalize_analysis_config(config: dict[str, Any] | None) -> dict[str, Any]:
    if config is None:
        return {}

    return dict(config)


def analysis_mode_uses_rules(analysis_mode: AnalysisMode) -> bool:
    return analysis_mode in ANALYSIS_MODES_WITH_RULES


def _validate_mode_config(
    analysis_mode: AnalysisMode,
    config: dict[str, Any],
) -> None:
    if analysis_mode in {
        ANALYSIS_MODE_FULL_CHECK,
        ANALYSIS_MODE_MEMORIAL_ONLY,
        ANALYSIS_MODE_SHEETS_ONLY,
        ANALYSIS_MODE_LD_ONLY,
    }:
        if config:
            raise ValueError("config must be empty for the selected analysis_mode")
        return

    if analysis_mode == ANALYSIS_MODE_FIND_TEXT:
        _require_non_empty_string(config, "query")
        _ensure_allowed_keys(config, {"query"})
        return

    if analysis_mode == ANALYSIS_MODE_FIND_REPLACE:
        _require_non_empty_string(config, "find")
        _require_string(config, "replace")
        _ensure_allowed_keys(config, {"find", "replace"})
        return

    if analysis_mode in {
        ANALYSIS_MODE_CHECK_ADDRESS,
        ANALYSIS_MODE_CHECK_PROJECT_NUMBER,
        ANALYSIS_MODE_CHECK_WORK_NAME,
    }:
        _require_non_empty_string(config, "expected")
        _ensure_allowed_keys(config, {"expected"})


def _require_non_empty_string(config: dict[str, Any], key: str) -> None:
    _require_string(config, key)
    if not str(config[key]).strip():
        raise ValueError(f"config.{key} must be a non-empty string")


def _require_string(config: dict[str, Any], key: str) -> None:
    if key not in config:
        raise ValueError(f"config.{key} is required")

    if not isinstance(config[key], str):
        raise ValueError(f"config.{key} must be a string")


def _ensure_allowed_keys(config: dict[str, Any], allowed_keys: set[str]) -> None:
    unexpected_keys = sorted(set(config) - allowed_keys)
    if unexpected_keys:
        joined_keys = ", ".join(unexpected_keys)
        raise ValueError(f"Unexpected config keys: {joined_keys}")
