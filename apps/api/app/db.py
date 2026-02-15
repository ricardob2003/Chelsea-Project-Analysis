import os
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return url


engine = create_engine(get_database_url(), future=True)


def query_view(view_name: str, limit: int = 500) -> list[dict[str, Any]]:
    stmt = text(f"SELECT * FROM {view_name} LIMIT :limit")
    with engine.connect() as conn:
        rows = conn.execute(stmt, {"limit": limit}).mappings().all()
    return [dict(row) for row in rows]
