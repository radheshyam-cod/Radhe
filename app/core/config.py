from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Load .env explicitly
# backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> root
# So we need to go up 3 levels
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv(env_path)


class Settings(BaseSettings):
    PROJECT_NAME: str = "ConceptPulse"
    API_V1_STR: str = "/api/v1"

    # Environment
    ENVIRONMENT: str = "development"  # used for development flows

    # Database
    DATABASE_URL: str

    # Security
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Firebase
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None

    # AI
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        case_sensitive = True
        extra = "ignore"



    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Normalize DATABASE_URL for SQLAlchemy/pg8000.

        - Upgrade plain `postgresql://` URLs to `postgresql+pg8000://` for async-safe driver
        - Strip any `?schema=public` suffix that some providers append
        """
        url = self.DATABASE_URL
        if url and url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+pg8000://")
        if url and "?schema=public" in url:
            url = url.replace("?schema=public", "")
        return url


settings = Settings()
