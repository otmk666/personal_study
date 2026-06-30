from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500), default="")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    questions = relationship("Question", back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(20), default="#3b82f6")
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", secondary=question_tags, back_populates="tags")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_type = Column(String(20), nullable=False)
    title = Column(Text, nullable=False)
    options = Column(JSON, default=list)
    answer = Column(JSON, default=list)
    analysis = Column(Text, default="")
    difficulty = Column(String(10), default="medium")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="questions")
    tags = relationship("Tag", secondary=question_tags, back_populates="questions")
    wrong_records = relationship("WrongRecord", back_populates="question")
    answer_records = relationship("AnswerRecord", back_populates="question")


class WrongRecord(Base):
    __tablename__ = "wrong_records"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    wrong_count = Column(Integer, default=1)
    last_wrong_at = Column(DateTime, default=datetime.utcnow)
    mastered = Column(Boolean, default=False)
    next_review_at = Column(DateTime, nullable=True)
    review_stage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="wrong_records")


class AnswerRecord(Base):
    __tablename__ = "answer_records"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    session_id = Column(String(100), nullable=True)
    is_correct = Column(Boolean, default=False)
    user_answer = Column(JSON, default=list)
    time_spent = Column(Integer, default=0)
    mode = Column(String(20), default="practice")
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question", back_populates="answer_records")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("favorite_folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question")
    folder = relationship("FavoriteFolder", back_populates="favorites")


class FavoriteFolder(Base):
    __tablename__ = "favorite_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    favorites = relationship("Favorite", back_populates="folder")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False)
    mode = Column(String(20), default="practice")
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    total_time = Column(Integer, default=0)
    avg_focus_score = Column(Float, default=0)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="in_progress")

    focus_records = relationship("FocusRecord", back_populates="session")


class FocusRecord(Base):
    __tablename__ = "focus_records"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), ForeignKey("study_sessions.session_id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    focus_score = Column(Float, default=100)
    behavior = Column(String(50), default="focused")
    duration = Column(Float, default=0)

    session = relationship("StudySession", back_populates="focus_records")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
