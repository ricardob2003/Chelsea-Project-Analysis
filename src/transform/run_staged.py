"""
Staged layer transform runner.

Executes SQL transforms in dependency order:
  1. create_staged_schema  — DDL (idempotent)
  2. seed_lookups          — dim_season, dim_team, team_name_map
  3. stg_team_season       — requires lookups + sofascore_standings + hist_xg
  4. stg_match             — requires lookups + understat_matches
  5. stg_player_season     — requires lookups + stg_match + understat_player_season

Run after every ingestion batch.
"""

import logging
from pathlib import Path

from sqlalchemy import text

from src.utils.db import get_connection

logger = logging.getLogger(__name__)

SQL_DIR = Path(__file__).resolve().parents[2] / "sql" / "staged"

STEPS = [
    ("create_staged_schema",       "create_staged_schema.sql"),
    ("seed_lookups",               "seed_lookups.sql"),
    # One-time patch: corrects sofascore season codes that were off-by-one
    # due to a bug where start year was treated as end year.
    # Safe to re-run: idempotent once old codes are gone.
    ("patch_sofascore_standings",  "patch_sofascore_standings.sql"),
    ("stg_team_season",            "transform_stg_team_season.sql"),
    ("stg_match",                  "transform_stg_match.sql"),
    ("stg_player_season",          "transform_stg_player_season.sql"),
]


def run_sql_file(conn, path: Path) -> None:
    sql = path.read_text()
    # Split on statement boundaries — handle both single and multi-statement files
    for statement in sql.split(";"):
        stmt = statement.strip()
        if stmt:
            conn.execute(text(stmt))


def run() -> None:
    logger.info("Starting staged transform run")

    for step_name, filename in STEPS:
        path = SQL_DIR / filename
        if not path.exists():
            logger.error(f"  [{step_name}] SQL file not found: {path}")
            raise FileNotFoundError(path)

        logger.info(f"  Running: {step_name}")
        try:
            with get_connection() as conn:
                run_sql_file(conn, path)
            logger.info(f"  Done:    {step_name}")
        except Exception as e:
            logger.error(f"  FAILED:  {step_name} — {e}")
            raise


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
