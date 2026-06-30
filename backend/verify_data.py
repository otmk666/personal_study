import sys
sys.path.insert(0, r'd:\HuaweiMoveData\Users\Mm269\Desktop\个人复习题库\backend')

from app.core.database import SessionLocal
from app.models.models import Question, Category, AnswerRecord, WrongRecord, Favorite, StudySession
from datetime import datetime, timedelta

db = SessionLocal()

print('=== 题目统计 ===')
cats = db.query(Category).all()
for cat in cats:
    count = db.query(Question).filter(Question.category_id == cat.id).count()
    print(f'  {cat.name}: {count} 题')

print(f'\n总题目数: {db.query(Question).count()}')

print('\n=== 近7天数据 ===')
today = datetime.now()
for i in range(6, -1, -1):
    day = today - timedelta(days=i)
    day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    records = db.query(AnswerRecord).filter(
        AnswerRecord.created_at >= day_start,
        AnswerRecord.created_at < day_end
    ).count()
    correct = db.query(AnswerRecord).filter(
        AnswerRecord.created_at >= day_start,
        AnswerRecord.created_at < day_end,
        AnswerRecord.is_correct == True
    ).count()
    sessions = db.query(StudySession).filter(
        StudySession.start_time >= day_start,
        StudySession.start_time < day_end
    ).count()
    date_str = day.strftime('%m-%d')
    print(f'  {date_str}: {records}题 正确{correct} 会话{sessions}')

print(f'\n总答题记录: {db.query(AnswerRecord).count()}')
print(f'错题本总数: {db.query(WrongRecord).count()}')
print(f'  待复习: {db.query(WrongRecord).filter(WrongRecord.mastered == False).count()}')
print(f'  已掌握: {db.query(WrongRecord).filter(WrongRecord.mastered == True).count()}')
print(f'收藏题目: {db.query(Favorite).count()}')
print(f'学习会话: {db.query(StudySession).count()}')

db.close()
