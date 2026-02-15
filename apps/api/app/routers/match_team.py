from fastapi import APIRouter, Query

from app.db import query_view

router = APIRouter(tags=["match-team"])


@router.get("/match-team")
def get_match_team(limit: int = Query(500, ge=1, le=5000)) -> list[dict]:
    return query_view("vw_match_team", limit)
