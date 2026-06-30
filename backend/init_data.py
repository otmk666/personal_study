import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal, Base, engine
from app.crud import crud
from app.schemas.schemas import (
    CategoryCreate, TagCreate, QuestionCreate,
    FavoriteFolderCreate,
)


def init_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("正在初始化示例数据...")

        categories = [
            CategoryCreate(name="计算机基础", description="计算机基础知识", sort_order=1),
            CategoryCreate(name="数据结构", description="数据结构与算法", sort_order=2),
            CategoryCreate(name="操作系统", description="操作系统原理", sort_order=3),
            CategoryCreate(name="计算机网络", description="计算机网络知识", sort_order=4),
            CategoryCreate(name="数据库", description="数据库原理与应用", sort_order=5),
        ]

        created_categories = {}
        for cat in categories:
            if not crud.get_category_by_name(db, cat.name):
                db_cat = crud.create_category(db, cat)
                created_categories[cat.name] = db_cat
                print(f"  创建分类: {cat.name}")
            else:
                created_categories[cat.name] = crud.get_category_by_name(db, cat.name)

        tags = [
            TagCreate(name="高频考点", color="#ef4444"),
            TagCreate(name="重点", color="#f59e0b"),
            TagCreate(name="易错", color="#8b5cf6"),
            TagCreate(name="基础", color="#10b981"),
            TagCreate(name="进阶", color="#3b82f6"),
        ]

        created_tags = {}
        for tag in tags:
            if not crud.get_tag_by_name(db, tag.name):
                db_tag = crud.create_tag(db, tag)
                created_tags[tag.name] = db_tag
                print(f"  创建标签: {tag.name}")
            else:
                created_tags[tag.name] = crud.get_tag_by_name(db, tag.name)

        sample_questions = [
            {
                "question_type": "single",
                "title": "在计算机中，1KB 等于多少字节？",
                "options": ["1000 字节", "1024 字节", "512 字节", "2048 字节"],
                "answer": ["B"],
                "analysis": "在计算机中，数据存储采用二进制，1KB = 2^10 = 1024 字节。注意与十进制的 1000 区分。",
                "difficulty": "easy",
                "category_name": "计算机基础",
                "tag_names": ["基础", "高频考点"],
            },
            {
                "question_type": "single",
                "title": "下列哪种排序算法的平均时间复杂度为 O(n log n)？",
                "options": ["冒泡排序", "插入排序", "快速排序", "选择排序"],
                "answer": ["C"],
                "analysis": "快速排序的平均时间复杂度为 O(n log n)，最坏情况下为 O(n^2)。冒泡、插入、选择排序的平均时间复杂度都是 O(n^2)。",
                "difficulty": "medium",
                "category_name": "数据结构",
                "tag_names": ["重点", "高频考点"],
            },
            {
                "question_type": "multiple",
                "title": "以下哪些是 TCP 协议的特点？（多选）",
                "options": ["面向连接", "可靠传输", "无连接", "流量控制"],
                "answer": ["A", "B", "D"],
                "analysis": "TCP 是面向连接的、可靠的传输层协议，提供流量控制和拥塞控制。UDP 才是无连接的。",
                "difficulty": "medium",
                "category_name": "计算机网络",
                "tag_names": ["重点", "易错"],
            },
            {
                "question_type": "judge",
                "title": "进程和线程的主要区别在于，进程是资源分配的基本单位，线程是 CPU 调度的基本单位。",
                "options": [],
                "answer": ["正确"],
                "analysis": "正确。进程是操作系统进行资源分配和调度的基本单位，线程是 CPU 调度和分派的基本单位。一个进程可以包含多个线程。",
                "difficulty": "easy",
                "category_name": "操作系统",
                "tag_names": ["基础"],
            },
            {
                "question_type": "single",
                "title": "SQL 语言中，用于从表中删除数据的命令是？",
                "options": ["DROP", "DELETE", "REMOVE", "TRUNCATE"],
                "answer": ["B"],
                "analysis": "DELETE 用于删除表中的数据行；DROP 用于删除整个表或数据库；TRUNCATE 也用于删除表中所有数据，但速度更快且不可回滚。",
                "difficulty": "easy",
                "category_name": "数据库",
                "tag_names": ["基础", "易错"],
            },
            {
                "question_type": "short_answer",
                "title": "简述什么是死锁，以及产生死锁的四个必要条件。",
                "options": [],
                "answer": [
                    "死锁是指两个或多个进程在执行过程中，因争夺资源而造成的一种互相等待的现象。\n\n四个必要条件：\n1. 互斥条件：资源不能被共享，只能由一个进程使用\n2. 请求与保持条件：进程已获得至少一个资源，但又提出新的资源请求，而该资源已被其他进程占有\n3. 不剥夺条件：进程已获得的资源，在未使用完之前，不能被强行剥夺\n4. 循环等待条件：存在一种进程资源的循环等待链"
                ],
                "analysis": "死锁是操作系统中的重要概念，四个必要条件缺一不可。预防死锁可以通过破坏其中一个或多个条件来实现。",
                "difficulty": "hard",
                "category_name": "操作系统",
                "tag_names": ["重点", "进阶"],
            },
            {
                "question_type": "single",
                "title": "HTTP 状态码 404 表示什么含义？",
                "options": ["服务器内部错误", "请求成功", "请求的资源不存在", "请求被重定向"],
                "answer": ["C"],
                "analysis": "404 Not Found 表示服务器无法找到请求的资源。500 表示服务器内部错误，200 表示成功，3xx 表示重定向。",
                "difficulty": "easy",
                "category_name": "计算机网络",
                "tag_names": ["基础", "高频考点"],
            },
            {
                "question_type": "multiple",
                "title": "下列哪些属于关系型数据库？（多选）",
                "options": ["MySQL", "MongoDB", "PostgreSQL", "Redis"],
                "answer": ["A", "C"],
                "analysis": "MySQL 和 PostgreSQL 是关系型数据库。MongoDB 是文档型 NoSQL 数据库，Redis 是键值型 NoSQL 数据库。",
                "difficulty": "easy",
                "category_name": "数据库",
                "tag_names": ["基础"],
            },
        ]

        count = 0
        for q in sample_questions:
            cat = created_categories.get(q["category_name"])
            tag_ids = [created_tags[t].id for t in q["tag_names"] if t in created_tags]

            question_data = QuestionCreate(
                question_type=q["question_type"],
                title=q["title"],
                options=q["options"],
                answer=q["answer"],
                analysis=q["analysis"],
                difficulty=q["difficulty"],
                category_id=cat.id if cat else None,
                tag_ids=tag_ids,
            )
            crud.create_question(db, question_data)
            count += 1

        print(f"  创建示例题目: {count} 道")

        folders = [
            FavoriteFolderCreate(name="重点收藏", description="收藏的重点题目"),
            FavoriteFolderCreate(name="错题回顾", description="需要反复练习的题目"),
        ]

        for folder in folders:
            existing = db.query(FavoriteFolderCreate.__class__).filter_by(name=folder.name).first() if False else None
            all_folders = crud.get_favorite_folders(db)
            if not any(f.name == folder.name for f in all_folders):
                crud.create_favorite_folder(db, folder)
                print(f"  创建收藏夹: {folder.name}")

        print("\n数据初始化完成！")

    finally:
        db.close()


if __name__ == "__main__":
    init_data()
