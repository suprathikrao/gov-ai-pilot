"""
Centralized application configuration.

All environment-driven settings live here so the rest of the codebase never
reads os.environ directly. Import `settings` wherever configuration is needed.
"""
from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str = Field(
        default="postgresql://govai:govai_password@localhost:5432/govai_copilot",
        validation_alias=AliasChoices("database_url", "DATABASE_URL"),
    )

    # Auth
    jwt_secret_key: str = "insecure-dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # File storage
    upload_dir: str = "./storage/uploads"
    max_upload_mb: int = 10

    # OCR
    tesseract_cmd: str = "/usr/bin/tesseract"

    # Vector DB / LLM
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "govai_documents"
    llm_provider: str = "ollama"
    llm_model: str = "qwen2.5:7b"
    llm_base_url: str = "http://localhost:11434"

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Rate limiting
    rate_limit_per_minute: int = 60

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
