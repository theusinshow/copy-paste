import app.models  # noqa: F401

from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _sync_sqlite_input_documents_schema()


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
