from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    app_port: int = int(os.getenv("APP_PORT", "8000"))

    vectordb_host: str = os.getenv("VECTORDB_HOST", "localhost")
    vectordb_port: int = int(os.getenv("VECTORDB_PORT", "50051"))

    default_embedding_model: str = os.getenv("DEFAULT_EMBEDDING_MODEL", "minilm")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
    llm_fast_model: str = os.getenv("LLM_FAST_MODEL", "gpt-4o-mini")
    llm_balanced_model: str = os.getenv("LLM_BALANCED_MODEL", "gpt-4o-mini")
    llm_quality_model: str = os.getenv("LLM_QUALITY_MODEL", "gpt-4o")
    openai_timeout_seconds: float = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "10"))
    llm_fallback_on_error: bool = _env_bool("LLM_FALLBACK_ON_ERROR", False)

    control_db_provider: str = os.getenv("CONTROL_DB_PROVIDER", "sqlite")
    sqlite_path: str = os.getenv("SQLITE_PATH", str(BASE_DIR / "documind.db"))

    memory_namespace: str = os.getenv("MEMORY_NAMESPACE", "conversation_memory")
    memory_kb_name: str = os.getenv("MEMORY_KB_NAME", "Conversation Memory")

    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    vectordb_keepalive_time_ms: int = int(os.getenv("VECTORDB_KEEPALIVE_TIME_MS", "120000"))
    vectordb_keepalive_timeout_ms: int = int(os.getenv("VECTORDB_KEEPALIVE_TIMEOUT_MS", "20000"))
    vectordb_keepalive_permit_without_calls: bool = _env_bool(
        "VECTORDB_KEEPALIVE_PERMIT_WITHOUT_CALLS",
        False,
    )
    vectordb_max_pings_without_data: int = int(os.getenv("VECTORDB_MAX_PINGS_WITHOUT_DATA", "2"))

    @property
    def vectordb_url(self) -> str:
        return f"{self.vectordb_host}:{self.vectordb_port}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
