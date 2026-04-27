from fastapi import APIRouter

from app.db.dashboard import get_dashboard_stats
from app.db.dependencies import DbSession

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(session: DbSession) -> dict:
    return get_dashboard_stats(session)
