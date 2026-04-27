from fastapi import APIRouter

from app.db.dependencies import DbSession
from app.db.packages import get_package_history

router = APIRouter(prefix="/packages", tags=["packages"])


@router.get("")
def list_packages(session: DbSession) -> list[dict]:
    return get_package_history(session)
