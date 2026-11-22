import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BACKEND_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareerCatalyst"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "careercatalyst_jwt_secret_key_phase1_secure_default_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = "sqlite:///./careercatalyst.db"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Google Gemini API configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Faster-Whisper Local Speech-to-Text configuration
    WHISPER_MODEL_SIZE: str = "base"
    WHISPER_DEVICE: str = "auto"
    WHISPER_COMPUTE_TYPE: str = "int8"

    @property
    def cors_origins(self) -> List[str]:
        if not self.ALLOWED_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = (str(_ENV_PATH), ".env")
        extra = "ignore"

settings = Settings()
