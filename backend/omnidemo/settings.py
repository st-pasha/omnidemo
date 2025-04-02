from __future__ import annotations
import os
from pathlib import Path
from tempfile import gettempdir

from pydantic_settings import BaseSettings, SettingsConfigDict

TEMP_DIR = Path(gettempdir())


def read_env(root: Path, key: str) -> str:
    if value := os.getenv(key):
        return value.strip()
    for line in Path(root / ".env").read_text().splitlines():
        k, v = line.split("=", 1)
        k = k.strip()
        if k.strip() == key:
            return v.strip()
    raise RuntimeError(
        f"Environment variable {key} not found in .env file. "
        "Please set it in the environment or in the .env file."
    )


class Settings(BaseSettings):
    """
    Application settings.

    These parameters can be configured
    with environment variables.
    """

    host: str = "0.0.0.0"
    port: int = 8000
    # quantity of workers for uvicorn
    workers_count: int = 1
    # Enable uvicorn reloading
    reload: bool = False

    # Current environment
    environment: str = "dev"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="OMNIDEMO_",
        env_file_encoding="utf-8",
    )

    project_root: Path = Path(__file__).parent.parent.parent
    supabase_url: str = read_env(project_root, "SUPABASE_URL")
    supabase_key: str = read_env(project_root, "SUPABASE_KEY")


settings = Settings()
