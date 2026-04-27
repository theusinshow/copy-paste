import app.models  # noqa: F401

from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _sync_sqlite_analysis_runs_schema()
    _sync_sqlite_input_documents_schema()
    _sync_sqlite_extracted_fields_schema()
    _sync_sqlite_issues_schema()
    _sync_sqlite_issue_evidences_schema()


def _sync_sqlite_analysis_runs_schema() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "analysis_runs" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("analysis_runs")}
    statements: list[str] = []

    if "analysis_mode" not in columns:
        statements.append(
            "ALTER TABLE analysis_runs "
            "ADD COLUMN analysis_mode VARCHAR(50) NOT NULL DEFAULT 'full_check'"
        )

    if "config" not in columns:
        statements.append(
            "ALTER TABLE analysis_runs "
            "ADD COLUMN config JSON NOT NULL DEFAULT '{}'"
        )

    if "progress" not in columns:
        statements.append(
            "ALTER TABLE analysis_runs "
            "ADD COLUMN progress INTEGER NOT NULL DEFAULT 0"
        )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _sync_sqlite_input_documents_schema() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "input_documents" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("input_documents")}
    statements: list[str] = []

    if "original_filename" not in columns:
        statements.append(
            "ALTER TABLE input_documents "
            "ADD COLUMN original_filename VARCHAR(255) NOT NULL DEFAULT ''"
        )

    if "file_path" not in columns:
        statements.append(
            "ALTER TABLE input_documents "
            "ADD COLUMN file_path VARCHAR(1024) NOT NULL DEFAULT ''"
        )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _sync_sqlite_extracted_fields_schema() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "extracted_fields" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("extracted_fields")}
    statements: list[str] = []

    if "input_document_id" not in columns:
        statements.append(
            "ALTER TABLE extracted_fields "
            "ADD COLUMN input_document_id INTEGER"
        )

    if "document_page_id" not in columns:
        statements.append(
            "ALTER TABLE extracted_fields "
            "ADD COLUMN document_page_id INTEGER"
        )

    if not statements:
        return

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def _sync_sqlite_issues_schema() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "issues" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("issues")}
    if "analysis_run_id" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE issues "
                "ADD COLUMN analysis_run_id INTEGER NOT NULL DEFAULT 0"
            )
        )


def _sync_sqlite_issue_evidences_schema() -> None:
    if not engine.url.drivername.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "issue_evidences" not in inspector.get_table_names():
        return

    columns = inspector.get_columns("issue_evidences")
    bbox_column = next((column for column in columns if column["name"] == "bbox"), None)
    if bbox_column is None or bbox_column.get("nullable", True):
        return

    statements = [
        "PRAGMA foreign_keys=OFF",
        "ALTER TABLE issue_evidences RENAME TO issue_evidences_old",
        "CREATE TABLE issue_evidences ("
        "issue_id INTEGER NOT NULL, "
        "field_id INTEGER NOT NULL, "
        "page INTEGER NOT NULL, "
        "bbox JSON, "
        "PRIMARY KEY (issue_id, field_id, page), "
        "FOREIGN KEY(issue_id) REFERENCES issues (id), "
        "FOREIGN KEY(field_id) REFERENCES extracted_fields (id)"
        ")",
        "INSERT INTO issue_evidences (issue_id, field_id, page, bbox) "
        "SELECT issue_id, field_id, page, bbox FROM issue_evidences_old",
        "DROP TABLE issue_evidences_old",
        "PRAGMA foreign_keys=ON",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))
