from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime


class ResponseModel(BaseModel):
    code: int = 200
    data: Any = None
    msg: str = "success"

    model_config = {
        "from_attributes": True,
        "arbitrary_types_allowed": True,
    }


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = ""
    sort_order: Optional[int] = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class Category(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TagBase(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class Tag(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionBase(BaseModel):
    question_type: str = Field(..., description="single, multiple, judge, short_answer")
    title: str
    options: Optional[List[str]] = []
    answer: List[str]
    analysis: Optional[str] = ""
    difficulty: Optional[str] = "medium"
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    question_type: Optional[str] = None
    title: Optional[str] = None
    options: Optional[List[str]] = None
    answer: Optional[List[str]] = None
    analysis: Optional[str] = None
    difficulty: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None


class Question(QuestionBase):
    id: int
    category: Optional[Category] = None
    tags: List[Tag] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionListResponse(BaseModel):
    total: int
    items: List[Question]
    page: int
    page_size: int


class WrongRecordBase(BaseModel):
    question_id: int
    mastered: Optional[bool] = False


class WrongRecord(WrongRecordBase):
    id: int
    wrong_count: int
    last_wrong_at: datetime
    next_review_at: Optional[datetime] = None
    review_stage: int
    question: Question
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerRecordBase(BaseModel):
    question_id: int
    session_id: Optional[str] = None
    is_correct: bool
    user_answer: List[str]
    time_spent: int
    mode: Optional[str] = "practice"


class AnswerRecordCreate(AnswerRecordBase):
    pass


class AnswerRecord(AnswerRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteBase(BaseModel):
    question_id: int
    folder_id: Optional[int] = None


class FavoriteCreate(FavoriteBase):
    pass


class Favorite(FavoriteBase):
    id: int
    question: Question
    created_at: datetime

    class Config:
        from_attributes = True


class FavoriteFolderBase(BaseModel):
    name: str
    description: Optional[str] = ""


class FavoriteFolderCreate(FavoriteFolderBase):
    pass


class FavoriteFolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class FavoriteFolder(FavoriteFolderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudySessionBase(BaseModel):
    mode: str = "practice"
    total_questions: int = 0


class StudySessionCreate(StudySessionBase):
    pass


class StudySessionUpdate(BaseModel):
    correct_count: Optional[int] = None
    total_time: Optional[int] = None
    avg_focus_score: Optional[float] = None
    status: Optional[str] = None
    end_time: Optional[datetime] = None


class StudySession(StudySessionBase):
    id: int
    session_id: str
    correct_count: int
    total_time: int
    avg_focus_score: float
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


class FocusRecordBase(BaseModel):
    session_id: Optional[str] = None
    focus_score: float
    behavior: str
    duration: float


class FocusRecordCreate(FocusRecordBase):
    pass


class FocusRecord(FocusRecordBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_questions: int
    total_answered: int
    correct_rate: float
    total_wrong: int
    total_favorites: int
    today_review_count: int


class CategoryStats(BaseModel):
    category_id: int
    category_name: str
    total: int
    correct_rate: float
    mastery_level: str


class DailyStats(BaseModel):
    date: str
    total: int
    correct: int
    correct_rate: float


class FocusStats(BaseModel):
    total_focus_minutes: float
    avg_focus_score: float
    behavior_distribution: dict
    daily_focus: List[dict]


class PracticeSessionCreate(BaseModel):
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []
    difficulty: Optional[str] = None
    question_count: int = 10
    mode: str = "practice"
    shuffle: bool = True
    source: Optional[str] = "all"


class PracticeSessionResponse(BaseModel):
    session_id: str
    questions: List[Question]
    mode: str
