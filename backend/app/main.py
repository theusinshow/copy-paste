from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
    application.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return application


app = create_app()
