from __future__ import annotations
from pathlib import Path
from tempfile import gettempdir

from pydantic_settings import BaseSettings, SettingsConfigDict

TEMP_DIR = Path(gettempdir())


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

    log_level = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="OMNIDEMO_",
        env_file_encoding="utf-8",
    )


settings = Settings()
