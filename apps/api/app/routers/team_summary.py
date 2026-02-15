from fastapi import APIRouter, Query

from app.db import query_view

router = APIRouter(tags=["team-summary"])


@router.get("/team-summary")
def get_team_summary(limit: int = Query(200, ge=1, le=2000)) -> list[dict]:
    return query_view("vw_team_season_summary", limit)
