import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    """
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Project root directory (one level up from app directory)
    PROJECT_ROOT: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Frontend build directory relative to project root
    FRONTEND_DIR: str = os.path.join(PROJECT_ROOT, 'dist')

    # Database settings
    DATABASE_URL: str = "sqlite:///./app/database.db"

    # Docker settings (if connecting to a remote Docker host)
    DOCKER_HOST: str = os.getenv("DOCKER_HOST", "unix:///var/run/docker.sock")

    # API server settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 9000)) # Ensure frontend is on 9000 as per instructions

    # Scheduler settings
    SCHEDULER_JOB_STORES: dict = {
        'default': {'type': 'sqlalchemy', 'url': DATABASE_URL}
    }
    SCHEDULER_JOB_DEFAULTS: dict = {
        'coalesce': False,
        'max_instances': 1
    }
    SCHEDULER_EXECUTORS: dict = {
        'default': {'type': 'threadpool', 'max_workers': 20}
    }

settings = Settings()
