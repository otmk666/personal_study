from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.core.database import get_db
from app.schemas.schemas import (
    AnswerRecordCreate,
    FavoriteFolderCreate, FavoriteFolderUpdate,
    PracticeSessionCreate,
    StudySessionUpdate,
)
from app.crud import crud

router = APIRouter(prefix="/practice", tags=["刷题练习"])


def _question_to_dict(q):
    return {
        "id": q.id,
        "question_type": q.question_type,
        "title": q.title,
        "options": q.options,
        "answer": q.answer,
        "analysis": q.analysis,
        "difficulty": q.difficulty,
        "category_id": q.category_id,
        "category": {"id": q.category.id, "name": q.category.name} if q.category else None,
        "tags": [{"id": t.id, "name": t.name, "color": t.color} for t in q.tags],
        "created_at": q.created_at.isoformat(),
    }


def _wrong_record_to_dict(w):
    return {
        "id": w.id,
        "question_id": w.question_id,
        "wrong_count": w.wrong_count,
        "mastered": w.mastered,
        "last_wrong_at": w.last_wrong_at.isoformat() if w.last_wrong_at else None,
        "question": _question_to_dict(w.question) if w.question else None,
    }


def _favorite_to_dict(f):
    return {
        "id": f.id,
        "question_id": f.question_id,
        "folder_id": f.folder_id,
        "created_at": f.created_at.isoformat(),
        "question": _question_to_dict(f.question) if f.question else None,
    }


def _folder_to_dict(f):
    return {
        "id": f.id,
        "name": f.name,
        "description": f.description,
        "created_at": f.created_at.isoformat(),
    }


def _study_session_to_dict(s):
    return {
        "id": s.id,
        "session_id": s.session_id,
        "mode": s.mode,
        "total_questions": s.total_questions,
        "correct_count": s.correct_count,
        "status": s.status,
        "start_time": s.start_time.isoformat() if s.start_time else None,
        "end_time": s.end_time.isoformat() if s.end_time else None,
        "focus_score": s.focus_score,
    }


def _answer_record_to_dict(a):
    return {
        "id": a.id,
        "session_id": a.session_id,
        "question_id": a.question_id,
        "user_answer": a.user_answer,
        "is_correct": a.is_correct,
        "time_spent": a.time_spent,
        "created_at": a.created_at.isoformat(),
    }


@router.post("/session")
def create_session(
    practice_data: PracticeSessionCreate,
    db: Session = Depends(get_db),
):
    from app.schemas.schemas import StudySessionCreate

    questions = crud.get_practice_questions(
        db,
        category_id=practice_data.category_id,
        tag_ids=practice_data.tag_ids,
        difficulty=practice_data.difficulty,
        question_count=practice_data.question_count,
        source=practice_data.source,
        shuffle=practice_data.shuffle,
    )

    session_data = StudySessionCreate(
        mode=practice_data.mode,
        total_questions=len(questions),
    )
    session = crud.create_study_session(db, session_data)

    q_list = [_question_to_dict(q) for q in questions]

    return {
        "code": 200,
        "data": {
            "session_id": session.session_id,
            "questions": q_list,
            "mode": practice_data.mode,
        },
        "msg": "创建成功",
    }


@router.post("/answer")
def submit_answer(
    answer_data: AnswerRecordCreate,
    db: Session = Depends(get_db),
):
    record = crud.create_answer_record(db, answer_data)

    if not answer_data.is_correct:
        crud.add_wrong_record(db, answer_data.question_id)

    return {
        "code": 200,
        "data": _answer_record_to_dict(record),
        "msg": "提交成功",
    }


@router.get("/session/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = crud.get_study_session(db, session_id)
    if not session:
        return {"code": 404, "msg": "会话不存在"}
    return {"code": 200, "data": _study_session_to_dict(session), "msg": "success"}


@router.put("/session/{session_id}")
def update_session(
    session_id: str,
    session_data: StudySessionUpdate,
    db: Session = Depends(get_db),
):
    session = crud.update_study_session(db, session_id, session_data)
    if not session:
        return {"code": 404, "msg": "会话不存在"}
    return {"code": 200, "data": _study_session_to_dict(session), "msg": "更新成功"}


wrong_router = APIRouter(prefix="/wrong", tags=["错题本"])


@wrong_router.get("")
def list_wrong_records(
    page: int = 1,
    page_size: int = 20,
    mastered: Optional[str] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    mastered_bool = None
    if mastered is not None:
        mastered_bool = str(mastered).lower() in ("true", "1", "yes")
    total, records = crud.get_wrong_records(
        db, skip=skip, limit=page_size, mastered=mastered_bool, category_id=category_id
    )
    items = [_wrong_record_to_dict(r) for r in records]
    return {
        "code": 200,
        "data": {
            "total": total,
            "items": items,
            "page": page,
            "page_size": page_size,
        },
        "msg": "success",
    }


@wrong_router.post("/{wrong_id}/mastered")
def mark_mastered(wrong_id: int, db: Session = Depends(get_db)):
    record = crud.mark_wrong_mastered(db, wrong_id)
    if not record:
        return {"code": 404, "msg": "错题记录不存在"}
    return {"code": 200, "data": _wrong_record_to_dict(record), "msg": "标记成功"}


class BatchIdsRequest(BaseModel):
    ids: List[int]


@wrong_router.post("/batch-mastered")
def batch_mark_mastered(req: BatchIdsRequest, db: Session = Depends(get_db)):
    count = crud.batch_mark_wrong_mastered(db, req.ids)
    return {"code": 200, "data": {"count": count}, "msg": f"成功标记 {count} 道"}


@wrong_router.get("/today-count")
def today_review_count(db: Session = Depends(get_db)):
    count = crud.get_today_review_count(db)
    return {"code": 200, "data": {"count": count}, "msg": "success"}


favorite_router = APIRouter(prefix="/favorites", tags=["收藏夹"])


@favorite_router.get("/folders")
def list_folders(db: Session = Depends(get_db)):
    folders = crud.get_favorite_folders(db)
    items = [_folder_to_dict(f) for f in folders]
    return {"code": 200, "data": items, "msg": "success"}


@favorite_router.post("/folders")
def create_folder(folder: FavoriteFolderCreate, db: Session = Depends(get_db)):
    db_folder = crud.create_favorite_folder(db, folder)
    return {"code": 200, "data": {"id": db_folder.id}, "msg": "创建成功"}


@favorite_router.put("/folders/{folder_id}")
def update_folder(folder_id: int, folder: FavoriteFolderUpdate, db: Session = Depends(get_db)):
    db_folder = crud.update_favorite_folder(db, folder_id, folder)
    if not db_folder:
        return {"code": 404, "msg": "收藏夹不存在"}
    return {"code": 200, "data": {"id": db_folder.id}, "msg": "更新成功"}


@favorite_router.delete("/folders/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    success = crud.delete_favorite_folder(db, folder_id)
    if not success:
        return {"code": 404, "msg": "收藏夹不存在"}
    return {"code": 200, "msg": "删除成功"}


@favorite_router.get("")
def list_favorites(
    page: int = 1,
    page_size: int = 20,
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    total, favorites = crud.get_favorites(db, folder_id=folder_id, skip=skip, limit=page_size)
    items = [_favorite_to_dict(f) for f in favorites]
    return {
        "code": 200,
        "data": {
            "total": total,
            "items": items,
            "page": page,
            "page_size": page_size,
        },
        "msg": "success",
    }


@favorite_router.get("/check/{question_id}")
def check_favorite(question_id: int, db: Session = Depends(get_db)):
    is_fav = crud.is_favorited(db, question_id)
    return {"code": 200, "data": {"is_favorited": is_fav}, "msg": "success"}


@favorite_router.post("/{question_id}")
def add_favorite(
    question_id: int,
    folder_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    favorite = crud.add_favorite(db, question_id, folder_id)
    return {"code": 200, "data": {"id": favorite.id}, "msg": "收藏成功"}


@favorite_router.delete("/{question_id}")
def remove_favorite(question_id: int, db: Session = Depends(get_db)):
    success = crud.remove_favorite(db, question_id)
    if not success:
        return {"code": 404, "msg": "收藏不存在"}
    return {"code": 200, "msg": "取消收藏成功"}
