import json
from pathlib import Path
from app.core.config import settings

CONFIG_FILE = settings.DATA_DIR / "ai_solver_config.json"

DEFAULT_CONFIG = {
    "api_key": "",
    "base_url": "https://api.openai.com/v1",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "system_prompt": "你是一个专业的解题助手，请详细解答用户的问题，给出清晰的解题思路和步骤。如果是编程题，请给出代码和注释。回答要准确、易懂。",
}


def load_config():
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {**DEFAULT_CONFIG, **data}
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    current = load_config()
    current.update(config)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, ensure_ascii=False, indent=2)
    return current
