import os
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()


def get_engine():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set in .env")
    return create_engine(url, future=True)


@contextmanager
def get_connection():
    engine = get_engine()
    with engine.connect() as conn:
        yield conn
        conn.commit()


def log_ingestion(conn, source: str, entity: str, season: str | None,
                  rows_inserted: int, status: str = "success",
                  last_matchday: int | None = None,
                  last_game_id: int | None = None,
                  error_message: str | None = None,
                  batch_id: str | None = None) -> None:
    conn.execute(text("""
        INSERT INTO raw.ingestion_log
            (source, entity, season, last_matchday, last_game_id,
             rows_inserted, status, error_message, last_loaded_at)
        VALUES
            (:source, :entity, :season, :last_matchday, :last_game_id,
             :rows_inserted, :status, :error_message, NOW())
    """), {
        "source": source,
        "entity": entity,
        "season": season,
        "last_matchday": last_matchday,
        "last_game_id": last_game_id,
        "rows_inserted": rows_inserted,
        "status": status,
        "error_message": error_message,
    })


def get_last_watermark(conn, source: str, entity: str, season: str) -> dict:
    """Return the most recent successful ingestion watermark for a source/entity/season."""
    row = conn.execute(text("""
        SELECT last_matchday, last_game_id, last_loaded_at
        FROM raw.ingestion_log
        WHERE source = :source
          AND entity = :entity
          AND season = :season
          AND status = 'success'
        ORDER BY last_loaded_at DESC
        LIMIT 1
    """), {"source": source, "entity": entity, "season": season}).mappings().first()

    if row:
        return dict(row)
    return {"last_matchday": None, "last_game_id": None, "last_loaded_at": None}
