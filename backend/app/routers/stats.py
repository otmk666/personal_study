from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.schemas import FocusRecordCreate
from app.crud import crud

router = APIRouter(prefix="/stats", tags=["数据统计"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    stats = crud.get_dashboard_stats(db)
    return {"code": 200, "data": stats, "msg": "success"}


@router.get("/daily")
def daily_stats(days: int = 7, db: Session = Depends(get_db)):
    stats = crud.get_daily_stats(db, days=days)
    return {"code": 200, "data": stats, "msg": "success"}


@router.get("/categories")
def category_stats(db: Session = Depends(get_db)):
    stats = crud.get_category_stats(db)
    return {"code": 200, "data": stats, "msg": "success"}


@router.get("/focus")
def focus_stats(days: int = 7, db: Session = Depends(get_db)):
    stats = crud.get_focus_stats(db, days=days)
    return {"code": 200, "data": stats, "msg": "success"}


focus_router = APIRouter(prefix="/focus", tags=["专注度"])


def _focus_record_to_dict(r):
    return {
        "id": r.id,
        "session_id": r.session_id,
        "focus_score": r.focus_score,
        "behavior_type": r.behavior_type,
        "duration": r.duration,
        "record_time": r.record_time.isoformat() if r.record_time else None,
    }


@focus_router.post("/record")
def add_focus_record(record: FocusRecordCreate, db: Session = Depends(get_db)):
    db_record = crud.add_focus_record(db, record)
    return {"code": 200, "data": _focus_record_to_dict(db_record), "msg": "记录成功"}


@focus_router.get("/records")
def list_focus_records(
    session_id: Optional[str] = None,
    days: int = 7,
    db: Session = Depends(get_db),
):
    records = crud.get_focus_records(db, session_id=session_id, days=days)
    items = [_focus_record_to_dict(r) for r in records]
    return {"code": 200, "data": items, "msg": "success"}
