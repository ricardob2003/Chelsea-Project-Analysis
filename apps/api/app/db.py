import os
from decimal import Decimal
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return url


_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(get_database_url(), future=True)
    return _engine


def query_view(view_name: str, limit: int = 500) -> list[dict[str, Any]]:
    stmt = text(f"SELECT * FROM views.{view_name} LIMIT :limit")
    with _get_engine().connect() as conn:
        rows = conn.execute(stmt, {"limit": limit}).mappings().all()
    return [
        {k: float(v) if isinstance(v, Decimal) else v for k, v in dict(row).items()}
        for row in rows
    ]
