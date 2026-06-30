from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.schemas.schemas import CategoryCreate, CategoryUpdate, TagCreate, TagUpdate
from app.crud import crud

router = APIRouter(prefix="/categories", tags=["分类管理"])


def _category_to_dict(c):
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "sort_order": c.sort_order,
        "created_at": c.created_at.isoformat(),
    }


def _tag_to_dict(t):
    return {
        "id": t.id,
        "name": t.name,
        "color": t.color,
        "created_at": t.created_at.isoformat(),
    }


@router.get("")
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    categories = crud.get_categories(db, skip=skip, limit=limit)
    items = [_category_to_dict(c) for c in categories]
    return {"code": 200, "data": items, "msg": "success"}


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = crud.get_category(db, category_id)
    if not category:
        return {"code": 404, "msg": "分类不存在"}
    return {"code": 200, "data": _category_to_dict(category), "msg": "success"}


@router.post("")
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    if crud.get_category_by_name(db, category.name):
        return {"code": 400, "msg": "分类名称已存在"}
    db_category = crud.create_category(db, category)
    return {"code": 200, "data": {"id": db_category.id}, "msg": "创建成功"}


@router.put("/{category_id}")
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = crud.update_category(db, category_id, category)
    if not db_category:
        return {"code": 404, "msg": "分类不存在"}
    return {"code": 200, "data": {"id": db_category.id}, "msg": "更新成功"}


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    success = crud.delete_category(db, category_id)
    if not success:
        return {"code": 404, "msg": "分类不存在"}
    return {"code": 200, "msg": "删除成功"}


tag_router = APIRouter(prefix="/tags", tags=["标签管理"])


@tag_router.get("")
def list_tags(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    tags = crud.get_tags(db, skip=skip, limit=limit)
    items = [_tag_to_dict(t) for t in tags]
    return {"code": 200, "data": items, "msg": "success"}


@tag_router.get("/{tag_id}")
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = crud.get_tag(db, tag_id)
    if not tag:
        return {"code": 404, "msg": "标签不存在"}
    return {"code": 200, "data": _tag_to_dict(tag), "msg": "success"}


@tag_router.post("")
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    if crud.get_tag_by_name(db, tag.name):
        return {"code": 400, "msg": "标签名称已存在"}
    db_tag = crud.create_tag(db, tag)
    return {"code": 200, "data": {"id": db_tag.id}, "msg": "创建成功"}


@tag_router.put("/{tag_id}")
def update_tag(tag_id: int, tag: TagUpdate, db: Session = Depends(get_db)):
    db_tag = crud.update_tag(db, tag_id, tag)
    if not db_tag:
        return {"code": 404, "msg": "标签不存在"}
    return {"code": 200, "data": {"id": db_tag.id}, "msg": "更新成功"}


@tag_router.delete("/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    success = crud.delete_tag(db, tag_id)
    if not success:
        return {"code": 404, "msg": "标签不存在"}
    return {"code": 200, "msg": "删除成功"}
