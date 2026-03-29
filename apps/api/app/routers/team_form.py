from fastapi import APIRouter, Query

from app.db import query_view

router = APIRouter(tags=["team-form"])


@router.get("/team-form")
def get_team_form(limit: int = Query(5000, ge=1, le=20000)) -> list[dict]:
    return query_view("vw_team_form", limit)
