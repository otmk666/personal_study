from typing import Any


def success_response(data: Any = None, msg: str = "success") -> dict:
    return {
        "code": 200,
        "data": data,
        "msg": msg,
    }


def error_response(msg: str = "error", code: int = 400, data: Any = None) -> dict:
    return {
        "code": code,
        "data": data,
        "msg": msg,
    }
