"""
Live season refresh — pulls latest data and re-runs the transform.

Runs in order:
  1. football_data  — standings snapshot + match results for the current season
  2. understat      — match xG + player season stats for the current season
  3. run_staged     — transforms raw → staged → views

Run this whenever you want the dashboard to reflect the latest results:

    pipenv run python -m src.ingest.refresh

Options:
    --seasons 2024 2025    Override which season start years to pull (default: current window)
    --skip-transform       Ingest only, skip the transform step
    --transform-only       Skip ingest, just re-run the transform
"""

import argparse
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh live season data")
    parser.add_argument(
        "--seasons", nargs="+", type=int, default=None,
        help="Season start years to ingest, e.g. --seasons 2024 2025",
    )
    parser.add_argument(
        "--skip-transform", action="store_true",
        help="Run ingest only — skip the staged transform",
    )
    parser.add_argument(
        "--transform-only", action="store_true",
        help="Skip ingest — re-run the staged transform only",
    )
    args = parser.parse_args()

    if not args.transform_only:
        # ── football-data.org ──────────────────────────────────────────────────
        logger.info("━━━  football-data ingest  ━━━")
        try:
            from src.ingest import football_data
            football_data.run(season_years=args.seasons)
            logger.info("football-data: done")
        except Exception as e:
            logger.error("football-data FAILED: %s", e)
            sys.exit(1)

        # ── Understat ──────────────────────────────────────────────────────────
        logger.info("━━━  understat ingest  ━━━")
        try:
            from src.ingest import understat
            understat.run(seasons=args.seasons)
            logger.info("understat: done")
        except Exception as e:
            logger.error("understat FAILED: %s", e)
            # Non-fatal — understat sometimes fails on live matches with no xG yet
            logger.warning("Continuing to transform despite understat failure")

    if not args.skip_transform:
        # ── staged transform ───────────────────────────────────────────────────
        logger.info("━━━  staged transform  ━━━")
        try:
            from src.transform import run_staged
            run_staged.run()
            logger.info("staged: done")
        except Exception as e:
            logger.error("staged FAILED: %s", e)
            sys.exit(1)

        # ── mart / views ───────────────────────────────────────────────────────
        logger.info("━━━  mart transform  ━━━")
        try:
            from src.transform import run_mart
            run_mart.run()
            logger.info("mart: done")
        except Exception as e:
            logger.error("mart FAILED: %s", e)
            sys.exit(1)

    logger.info("━━━  refresh complete  ━━━")


if __name__ == "__main__":
    main()
