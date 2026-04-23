from fastapi import APIRouter

from app.api.v1.analysis import router as analysis_router
from app.api.v1.issues import router as issues_router

api_router = APIRouter()
api_router.include_router(analysis_router)
api_router.include_router(issues_router)
