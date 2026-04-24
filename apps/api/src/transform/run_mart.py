"""
Mart layer runner.

Executes in dependency order:
  1. create_schema  — mart + views schemas (idempotent)
  2. vw_team_season_summary
  3. vw_match_team
  4. vw_squad_structure
  5. vw_recruitment_priority

Run after every staged transform run.
"""

import logging
from pathlib import Path

from sqlalchemy import text

from src.utils.db import get_connection

logger = logging.getLogger(__name__)

MART_SQL_DIR  = Path(__file__).resolve().parents[2] / "sql" / "mart"
VIEWS_SQL_DIR = Path(__file__).resolve().parents[2] / "sql" / "views"

STEPS = [
    ("create_schema",          MART_SQL_DIR,  "create_schema.sql"),
    ("vw_team_season_summary", VIEWS_SQL_DIR, "vw_team_season_summary.sql"),
    ("vw_match_team",          VIEWS_SQL_DIR, "vw_match_team.sql"),
    ("vw_team_form",           VIEWS_SQL_DIR, "vw_team_form.sql"),
    ("vw_squad_structure",     VIEWS_SQL_DIR, "vw_squad_structure.sql"),
    ("vw_recruitment_priority",VIEWS_SQL_DIR, "vw_recruitment_priority.sql"),
]


def run_sql_file(conn, path: Path) -> None:
    sql = path.read_text()
    for statement in sql.split(";"):
        stmt = statement.strip()
        if stmt:
            conn.execute(text(stmt))


def run() -> None:
    logger.info("Starting mart transform run")

    for step_name, sql_dir, filename in STEPS:
        path = sql_dir / filename
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
