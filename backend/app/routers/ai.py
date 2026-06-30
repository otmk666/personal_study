from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.schemas import FocusRecordCreate
from app.ai.focus_detector import detector
from app.crud import crud
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI监督"])


@router.get("/status")
def ai_status():
    return {
        "code": 200,
        "data": {
            "enabled": settings.AI_ENABLED,
            "model_loaded": detector.model is not None,
            "detection_fps": settings.DETECTION_FPS,
        },
        "msg": "success",
    }


@router.post("/detect")
async def detect_frame(
    session_id: str = None,
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    if not settings.AI_ENABLED:
        return {"code": 400, "msg": "AI检测未启用"}

    frame_data = None
    if file:
        frame_data = await file.read()

    result = detector.detect_frame(frame_data)

    if session_id:
        try:
            record = FocusRecordCreate(
                session_id=session_id,
                focus_score=result["focus_score"],
                behavior=result["behavior"],
                duration=1.0 / max(settings.DETECTION_FPS, 1),
            )
            crud.add_focus_record(db, record)
        except Exception as e:
            print(f"Failed to save focus record: {e}")

    return {"code": 200, "data": result, "msg": "success"}


@router.post("/detect-base64")
async def detect_base64(
    payload: dict,
    db: Session = Depends(get_db),
):
    if not settings.AI_ENABLED:
        return {"code": 400, "msg": "AI检测未启用"}

    import base64
    session_id = payload.get("session_id")
    image_base64 = payload.get("image", "")

    frame_data = None
    if image_base64:
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            frame_data = base64.b64decode(image_base64)
        except Exception as e:
            print(f"Base64 decode error: {e}")
            frame_data = None

    result = detector.detect_frame(frame_data)

    if session_id:
        try:
            record = FocusRecordCreate(
                session_id=session_id,
                focus_score=result["focus_score"],
                behavior=result["behavior"],
                duration=1.0 / max(settings.DETECTION_FPS, 1),
            )
            crud.add_focus_record(db, record)
        except Exception as e:
            print(f"Failed to save focus record: {e}")

    return {"code": 200, "data": result, "msg": "success"}


@router.post("/toggle")
def toggle_ai(enabled: bool):
    settings.AI_ENABLED = enabled
    if enabled:
        detector.enabled = True
        detector._init_model()
    else:
        detector.enabled = False
    return {
        "code": 200,
        "data": {
            "enabled": settings.AI_ENABLED,
            "model_loaded": detector.model is not None,
        },
        "msg": "设置成功",
    }


@router.post("/reset-score")
def reset_score():
    detector.reset_score()
    return {"code": 200, "data": {"focus_score": detector.current_score}, "msg": "重置成功"}
