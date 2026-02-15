from fastapi import APIRouter, Query

from app.db import query_view

router = APIRouter(tags=["squad-structure"])


@router.get("/squad-structure")
def get_squad_structure(limit: int = Query(200, ge=1, le=2000)) -> list[dict]:
    return query_view("vw_squad_structure", limit)
