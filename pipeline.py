"""
Full pipeline runner.

Executes all stages in dependency order:
  1. ingest:football_data  — match results, standings, teams (incremental by matchday)
  2. ingest:understat      — match xG, player stats (incremental by game_id)
  3. ingest:sofascore      — standings with home/away splits (full refresh per season)
  4. transform:staged      — clean, normalize, derive metrics (full refresh)
  5. transform:mart+views  — create/replace all views including vw_team_form

Run directly:    pipenv run python pipeline.py
Scheduled by:    scheduler.py (every 7 days)
"""

import logging
import sys

from src.ingest import football_data, understat, sofascore
from src.transform import run_staged, run_mart

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def run() -> None:
    logger.info("=" * 60)
    logger.info("Pipeline start")
    logger.info("=" * 60)

    steps = [
        ("ingest:football_data",  football_data.run),
        ("ingest:understat",      understat.run),
        ("ingest:sofascore",      sofascore.run),
        ("transform:staged",      run_staged.run),
        ("transform:mart+views",  run_mart.run),
    ]

    for name, fn in steps:
        logger.info(f"--- {name} ---")
        try:
            fn()
            logger.info(f"--- {name} done ---")
        except Exception as e:
            logger.error(f"--- {name} FAILED: {e}")
            raise

    logger.info("=" * 60)
    logger.info("Pipeline complete")
    logger.info("=" * 60)


if __name__ == "__main__":
    try:
        run()
    except Exception:
        sys.exit(1)
