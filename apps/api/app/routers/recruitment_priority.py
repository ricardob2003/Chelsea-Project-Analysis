from fastapi import APIRouter, Query

from app.db import query_view

router = APIRouter(tags=["recruitment-priority"])


@router.get("/recruitment-priority")
def get_recruitment_priority(limit: int = Query(200, ge=1, le=2000)) -> list[dict]:
    return query_view("vw_recruitment_priority", limit)
