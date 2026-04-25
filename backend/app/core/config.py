from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Copy&Paste Backend"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./test.db"
    UPLOAD_DIR: str = "./uploads"
    CORS_ALLOWED_ORIGINS: str = ""
    CORS_ALLOWED_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value

        normalized = value.strip()
        if normalized.startswith("postgres://"):
            return f"postgresql+psycopg://{normalized[len('postgres://'):]}"
        if normalized.startswith("postgresql://") and "+psycopg" not in normalized:
            return normalized.replace("postgresql://", "postgresql+psycopg://", 1)
        return normalized

    @property
    def cors_allowed_origins(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.CORS_ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
