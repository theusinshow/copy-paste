from collections.abc import Sequence

from sqlalchemy.orm import Session

from app.models.input_document import InputDocument


def create_input_documents(
    session: Session,
    analysis_id: int,
    tipo: str,
    uploads: Sequence[dict[str, str]],
) -> list[InputDocument]:
    documents = [
        InputDocument(
            analysis_run_id=analysis_id,
            tipo=tipo,
            original_filename=upload["original_filename"],
            file_path=upload["file_path"],
            file_hash=upload["file_hash"],
        )
        for upload in uploads
    ]
    session.add_all(documents)
    session.commit()

    for document in documents:
        session.refresh(document)

    return documents
