from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
import random

from app.models.models import Question, Category, Tag, WrongRecord, AnswerRecord, Favorite, FavoriteFolder, StudySession, FocusRecord
from app.schemas.schemas import (
    QuestionCreate, QuestionUpdate,
    CategoryCreate, CategoryUpdate,
    TagCreate, TagUpdate,
    FavoriteFolderCreate, FavoriteFolderUpdate,
    StudySessionCreate, StudySessionUpdate,
    FocusRecordCreate,
)


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Category).order_by(Category.sort_order, Category.id).offset(skip).limit(limit).all()


def get_category(db: Session, category_id: int):
    return db.query(Category).filter(Category.id == category_id).first()


def get_category_by_name(db: Session, name: str):
    return db.query(Category).filter(Category.name == name).first()


def create_category(db: Session, category: CategoryCreate):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: int, category: CategoryUpdate):
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    update_data = category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    if not db_category:
        return False
    db.delete(db_category)
    db.commit()
    return True


def get_tags(db: Session, skip: int = 0, limit: int = 200):
    return db.query(Tag).order_by(Tag.id).offset(skip).limit(limit).all()


def get_tag(db: Session, tag_id: int):
    return db.query(Tag).filter(Tag.id == tag_id).first()


def get_tag_by_name(db: Session, name: str):
    return db.query(Tag).filter(Tag.name == name).first()


def create_tag(db: Session, tag: TagCreate):
    db_tag = Tag(**tag.model_dump())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(db: Session, tag_id: int, tag: TagUpdate):
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        return None
    update_data = tag.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tag, key, value)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def delete_tag(db: Session, tag_id: int):
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        return False
    db.delete(db_tag)
    db.commit()
    return True


def get_questions(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    question_type: Optional[str] = None,
    category_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    tag_ids: Optional[List[int]] = None,
    keyword: Optional[str] = None,
):
    query = db.query(Question)

    if question_type:
        query = query.filter(Question.question_type == question_type)
    if category_id:
        query = query.filter(Question.category_id == category_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if keyword:
        query = query.filter(Question.title.like(f"%{keyword}%"))
    if tag_ids:
        query = query.filter(Question.tags.any(Tag.id.in_(tag_ids)))

    total = query.count()
    questions = query.order_by(Question.id.desc()).offset(skip).limit(limit).all()
    return total, questions


def get_question(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()


def create_question(db: Session, question: QuestionCreate):
    tag_ids = question.tag_ids or []
    question_data = question.model_dump(exclude={"tag_ids"})
    db_question = Question(**question_data)

    if tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        db_question.tags = tags

    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def update_question(db: Session, question_id: int, question: QuestionUpdate):
    db_question = get_question(db, question_id)
    if not db_question:
        return None

    update_data = question.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for key, value in update_data.items():
        setattr(db_question, key, value)

    if tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all()
        db_question.tags = tags

    db.commit()
    db.refresh(db_question)
    return db_question


def delete_question(db: Session, question_id: int):
    db_question = get_question(db, question_id)
    if not db_question:
        return False
    db.delete(db_question)
    db.commit()
    return True


def batch_delete_questions(db: Session, question_ids: List[int]):
    db.query(Question).filter(Question.id.in_(question_ids)).delete(synchronize_session=False)
    db.commit()
    return True


def copy_question(db: Session, question_id: int):
    db_question = get_question(db, question_id)
    if not db_question:
        return None

    new_question = Question(
        question_type=db_question.question_type,
        title=db_question.title + " (副本)",
        options=db_question.options,
        answer=db_question.answer,
        analysis=db_question.analysis,
        difficulty=db_question.difficulty,
        category_id=db_question.category_id,
        tags=db_question.tags.copy(),
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question


def get_wrong_records(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    mastered: Optional[bool] = None,
    category_id: Optional[int] = None,
):
    query = db.query(WrongRecord)
    if mastered is not None:
        query = query.filter(WrongRecord.mastered == mastered)
    else:
        query = query.filter(WrongRecord.mastered == False)
    if category_id:
        query = query.join(Question).filter(Question.category_id == category_id)
    total = query.count()
    records = query.order_by(WrongRecord.last_wrong_at.desc()).offset(skip).limit(limit).all()
    return total, records


def get_wrong_record_by_question(db: Session, question_id: int):
    return db.query(WrongRecord).filter(WrongRecord.question_id == question_id).first()


def add_wrong_record(db: Session, question_id: int):
    from datetime import datetime, timedelta

    record = get_wrong_record_by_question(db, question_id)
    if record:
        record.wrong_count += 1
        record.last_wrong_at = datetime.utcnow()
        record.mastered = False
        record.review_stage = min(record.review_stage + 1, 5)
    else:
        record = WrongRecord(
            question_id=question_id,
            wrong_count=1,
            review_stage=1,
        )
        db.add(record)

    intervals = [1, 2, 4, 7, 15, 30]
    stage = min(record.review_stage, len(intervals) - 1)
    record.next_review_at = datetime.utcnow() + timedelta(days=intervals[stage])

    db.commit()
    db.refresh(record)
    return record


def mark_wrong_mastered(db: Session, wrong_record_id: int):
    record = db.query(WrongRecord).filter(WrongRecord.id == wrong_record_id).first()
    if record:
        record.mastered = True
        db.commit()
        db.refresh(record)
    return record


def batch_mark_wrong_mastered(db: Session, ids: list):
    records = db.query(WrongRecord).filter(WrongRecord.id.in_(ids)).all()
    for record in records:
        record.mastered = True
    db.commit()
    return len(records)


def get_today_review_count(db: Session):
    from datetime import datetime, date
    today = date.today()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())
    return db.query(WrongRecord).filter(
        WrongRecord.mastered == False,
        WrongRecord.next_review_at <= end,
    ).count()


def create_answer_record(db: Session, record_data):
    db_record = AnswerRecord(**record_data.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def get_answer_records(db: Session, question_id: Optional[int] = None, limit: int = 100):
    query = db.query(AnswerRecord)
    if question_id:
        query = query.filter(AnswerRecord.question_id == question_id)
    return query.order_by(AnswerRecord.created_at.desc()).limit(limit).all()


def get_favorite_folders(db: Session):
    return db.query(FavoriteFolder).order_by(FavoriteFolder.id).all()


def create_favorite_folder(db: Session, folder: FavoriteFolderCreate):
    db_folder = FavoriteFolder(**folder.model_dump())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder


def update_favorite_folder(db: Session, folder_id: int, folder: FavoriteFolderUpdate):
    db_folder = db.query(FavoriteFolder).filter(FavoriteFolder.id == folder_id).first()
    if not db_folder:
        return None
    update_data = folder.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_folder, key, value)
    db.commit()
    db.refresh(db_folder)
    return db_folder


def delete_favorite_folder(db: Session, folder_id: int):
    db_folder = db.query(FavoriteFolder).filter(FavoriteFolder.id == folder_id).first()
    if not db_folder:
        return False
    db.delete(db_folder)
    db.commit()
    return True


def get_favorites(db: Session, folder_id: Optional[int] = None, skip: int = 0, limit: int = 20):
    query = db.query(Favorite)
    if folder_id:
        query = query.filter(Favorite.folder_id == folder_id)
    total = query.count()
    favorites = query.order_by(Favorite.created_at.desc()).offset(skip).limit(limit).all()
    return total, favorites


def is_favorited(db: Session, question_id: int):
    return db.query(Favorite).filter(Favorite.question_id == question_id).first() is not None


def add_favorite(db: Session, question_id: int, folder_id: Optional[int] = None):
    if is_favorited(db, question_id):
        return db.query(Favorite).filter(Favorite.question_id == question_id).first()
    db_favorite = Favorite(question_id=question_id, folder_id=folder_id)
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


def remove_favorite(db: Session, question_id: int):
    db_favorite = db.query(Favorite).filter(Favorite.question_id == question_id).first()
    if not db_favorite:
        return False
    db.delete(db_favorite)
    db.commit()
    return True


def get_practice_questions(
    db: Session,
    category_id: Optional[int] = None,
    tag_ids: Optional[List[int]] = None,
    difficulty: Optional[str] = None,
    question_count: int = 10,
    source: str = "all",
    shuffle: bool = True,
):
    query = db.query(Question)

    if source == "wrong":
        query = query.join(WrongRecord).filter(WrongRecord.mastered == False)
    elif source == "favorite":
        query = query.join(Favorite)

    if category_id:
        query = query.filter(Question.category_id == category_id)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    if tag_ids:
        query = query.filter(Question.tags.any(Tag.id.in_(tag_ids)))

    questions = query.all()
    if shuffle:
        random.shuffle(questions)

    return questions[:question_count]


def create_study_session(db: Session, session_data: StudySessionCreate):
    import uuid
    session_id = str(uuid.uuid4())
    db_session = StudySession(
        session_id=session_id,
        **session_data.model_dump(),
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_study_session(db: Session, session_id: str):
    return db.query(StudySession).filter(StudySession.session_id == session_id).first()


def update_study_session(db: Session, session_id: str, session_data: StudySessionUpdate):
    db_session = get_study_session(db, session_id)
    if not db_session:
        return None
    update_data = session_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_session, key, value)
    db.commit()
    db.refresh(db_session)
    return db_session


def add_focus_record(db: Session, record_data: FocusRecordCreate):
    db_record = FocusRecord(**record_data.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def get_focus_records(db: Session, session_id: Optional[str] = None, days: int = 7):
    from datetime import datetime, timedelta
    query = db.query(FocusRecord)
    if session_id:
        query = query.filter(FocusRecord.session_id == session_id)
    else:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(FocusRecord.timestamp >= start_date)
    return query.order_by(FocusRecord.timestamp.desc()).all()


def get_dashboard_stats(db: Session):
    from datetime import datetime, timedelta

    total_questions = db.query(Question).count()
    total_answered = db.query(AnswerRecord).count()
    total_correct = db.query(AnswerRecord).filter(AnswerRecord.is_correct == True).count()
    correct_rate = (total_correct / total_answered * 100) if total_answered > 0 else 0

    total_wrong = db.query(WrongRecord).filter(WrongRecord.mastered == False).count()
    total_favorites = db.query(Favorite).count()
    today_review = get_today_review_count(db)

    return {
        "total_questions": total_questions,
        "total_answered": total_answered,
        "correct_rate": round(correct_rate, 2),
        "total_wrong": total_wrong,
        "total_favorites": total_favorites,
        "today_review_count": today_review,
    }


def get_daily_stats(db: Session, days: int = 7):
    from datetime import datetime, timedelta, date

    result = []
    today = date.today()

    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        start = datetime.combine(d, datetime.min.time())
        end = datetime.combine(d, datetime.max.time())

        records = db.query(AnswerRecord).filter(
            AnswerRecord.created_at >= start,
            AnswerRecord.created_at <= end,
        ).all()

        total = len(records)
        correct = sum(1 for r in records if r.is_correct)
        rate = (correct / total * 100) if total > 0 else 0

        result.append({
            "date": d.isoformat(),
            "total": total,
            "correct": correct,
            "correct_rate": round(rate, 2),
        })

    return result


def get_category_stats(db: Session):
    categories = db.query(Category).all()
    result = []

    for cat in categories:
        questions = db.query(Question).filter(Question.category_id == cat.id).all()
        total = len(questions)

        if total == 0:
            correct_rate = 0
            mastery = "未开始"
        else:
            q_ids = [q.id for q in questions]
            records = db.query(AnswerRecord).filter(AnswerRecord.question_id.in_(q_ids)).all()
            if records:
                correct = sum(1 for r in records if r.is_correct)
                correct_rate = round(correct / len(records) * 100, 2)
            else:
                correct_rate = 0

            if correct_rate >= 90:
                mastery = "熟练掌握"
            elif correct_rate >= 70:
                mastery = "基本掌握"
            elif correct_rate >= 50:
                mastery = "初步掌握"
            else:
                mastery = "待加强"

        result.append({
            "category_id": cat.id,
            "category_name": cat.name,
            "total": total,
            "correct_rate": correct_rate,
            "mastery_level": mastery,
        })

    return result


def get_focus_stats(db: Session, days: int = 7):
    from datetime import datetime, timedelta, date

    focus_records = get_focus_records(db, days=days)

    total_minutes = sum(r.duration for r in focus_records) / 60
    avg_score = sum(r.focus_score for r in focus_records) / len(focus_records) if focus_records else 0

    behavior_dist = {}
    for r in focus_records:
        behavior_dist[r.behavior] = behavior_dist.get(r.behavior, 0) + r.duration

    daily_focus = []
    today = date.today()
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        day_records = [r for r in focus_records if r.timestamp.date() == d]
        day_minutes = sum(r.duration for r in day_records) / 60
        day_avg = sum(r.focus_score for r in day_records) / len(day_records) if day_records else 0
        daily_focus.append({
            "date": d.isoformat(),
            "focus_minutes": round(day_minutes, 1),
            "avg_focus_score": round(day_avg, 2),
        })

    return {
        "total_focus_minutes": round(total_minutes, 1),
        "avg_focus_score": round(avg_score, 2),
        "behavior_distribution": behavior_dist,
        "daily_focus": daily_focus,
    }
