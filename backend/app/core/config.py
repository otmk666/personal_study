from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


def _get_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.lower() in ("true", "1", "yes")


def _get_int(name: str, default: int = 0) -> int:
    val = os.getenv(name)
    if val is None:
        return default
    try:
        return int(val)
    except ValueError:
        return default


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "个人题库系统")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = _get_bool("DEBUG", True)

    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"

    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'question_bank.db'}")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = _get_int("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)

    CORS_ORIGINS: list = ["*"]

    AI_ENABLED: bool = _get_bool("AI_ENABLED", False)
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "")
    DETECTION_FPS: int = _get_int("DETECTION_FPS", 2)
    FOCUS_SCORE_WEIGHTS: dict = {
        "using_phone": 2.0,
        "sleeping": 3.0,
        "away": 1.5,
        "distracted": 1.0,
    }


settings = Settings()
