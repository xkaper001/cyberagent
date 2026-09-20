import os
from pathlib import Path


def _load_dotenv() -> None:
    """Populate os.environ from repo-root .env (real env vars win)."""
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


_load_dotenv()


class Settings:
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyberagents.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # LLM
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "demo-key")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")

    # Qdrant
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")

    # LangChain / Observability
    LANGCHAIN_TRACING_V2: bool = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "cyberagents-copilot")

    # Security & Scope
    JWT_SECRET: str = os.getenv("JWT_SECRET", "cyberagents-secret-key-2026")
    ALLOW_UNAUTHORIZED_TARGETS: bool = os.getenv("ALLOW_UNAUTHORIZED_TARGETS", "false").lower() == "true"
    DEFAULT_AUTHORIZED_SUBNETS: str = os.getenv(
        "DEFAULT_AUTHORIZED_SUBNETS",
        "10.10.14.0/24,192.168.10.0/24,127.0.0.1/32,localhost"
    )

settings = Settings()
