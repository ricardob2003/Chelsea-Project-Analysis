"""
Simple weekly scheduler.

Runs the full pipeline every 7 days.
Checks for pending jobs every hour — minimal CPU cost.

Start:  pipenv run python scheduler.py
Stop:   Ctrl+C

Logs are written to stdout. Redirect to a file if you want persistence:
  pipenv run python scheduler.py >> logs/scheduler.log 2>&1
"""

import logging
import schedule
import time

from pipeline import run

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)


def _run_pipeline() -> None:
    logger.info("Scheduled run triggered")
    try:
        run()
    except Exception as e:
        logger.error(f"Scheduled run failed: {e}")
        # Do not re-raise — keep the scheduler alive for the next run


schedule.every(7).days.do(_run_pipeline)

if __name__ == "__main__":
    logger.info("Scheduler started — pipeline runs every 7 days")
    logger.info(f"Next run: {schedule.next_run()}")

    while True:
        schedule.run_pending()
        time.sleep(3600)  # check every hour
