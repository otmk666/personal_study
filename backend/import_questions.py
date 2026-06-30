import json
import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.models import Question, Category, Tag, question_tags

def import_questions(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    db = SessionLocal()
    count = 0

    for q_data in data:
        try:
            # 处理答案
            answer = q_data['answer']
            if isinstance(answer, str):
                answer = [answer]

            # 处理分类
            cat_name = q_data.get('category_name')
            category_id = None
            if cat_name:
                cat = db.query(Category).filter(Category.name == cat_name).first()
                if not cat:
                    cat = Category(name=cat_name)
                    db.add(cat)
                    db.flush()
                category_id = cat.id

            # 处理标签
            tag_ids = []
            for tag_name in q_data.get('tags', []):
                tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name, color='#3b82f6')
                    db.add(tag)
                    db.flush()
                tag_ids.append(tag.id)

            # 创建题目
            question = Question(
                question_type=q_data['question_type'],
                title=q_data['title'],
                options=q_data.get('options', []),
                answer=answer,
                analysis=q_data.get('analysis', ''),
                difficulty=q_data.get('difficulty', 'medium'),
                category_id=category_id,
            )
            db.add(question)
            db.flush()

            # 添加标签关联
            for tag_id in tag_ids:
                stmt = question_tags.insert().values(question_id=question.id, tag_id=tag_id)
                db.execute(stmt)

            count += 1
        except Exception as e:
            print(f'Error: {e}, data: {q_data.get("title", "?")[:50]}')

    db.commit()
    db.close()
    print(f'Imported {count} questions from {filepath}')

if __name__ == '__main__':
    import_questions(r'd:\HuaweiMoveData\Users\Mm269\Desktop\个人复习题库\1-50.json')
    import_questions(r'd:\HuaweiMoveData\Users\Mm269\Desktop\个人复习题库\51-100.json')
    print('Done!')
