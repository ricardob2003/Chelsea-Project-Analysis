"""
One-time patch: fix raw.sofascore_standings season codes.

Root cause: soccerdata Sofascore uses START year (seasons=2024 → 2024-25),
but the original sofascore.py assumed END year. Every season was stored one
slot too early:
  seasons=2022 → fetched 2022-23 data → stored as "2122"  (should be "2223")
  seasons=2023 → fetched 2023-24 data → stored as "2223"  (should be "2324")
  seasons=2024 → fetched 2024-25 data → stored as "2324"  (should be "2425")
  seasons=2025 → failed (live season) → stored partial  as "2425"  (drop it)

Idempotency: checks whether '2122' has any rows. The original buggy sofascore.py
stored 2022-23 data in '2122' (one slot too early). After the patch runs, '2122'
is emptied (data moved to '2223'). On a fresh install with the fixed sofascore.py,
'2122' is also empty. Either way: empty '2122' means skip.
"""

import logging

from sqlalchemy import text

from src.utils.db import get_connection

logger = logging.getLogger(__name__)


def run() -> None:
    with get_connection() as conn:
        # The original bug stored data in codes shifted one year early.
        # '2122' was the first affected slot — it held 2022-23 data instead of nothing.
        # After the patch runs, '2122' is emptied (data moved to '2223').
        # On a fresh install with the fixed sofascore.py, '2122' is also empty.
        # Either way: if '2122' is empty, nothing to do.
        n_2122 = conn.execute(text(
            "SELECT COUNT(*) AS n FROM raw.sofascore_standings WHERE season = '2122'"
        )).mappings().first()
        if int(n_2122["n"]) == 0:
            logger.info("patch_sofascore: already patched or fresh install — '2122' is empty, skipping")
            return

        row_2324 = conn.execute(text(
            "SELECT mp FROM raw.sofascore_standings WHERE season = '2324' AND team = 'Chelsea' LIMIT 1"
        )).mappings().first()
        mp_2324 = int(row_2324["mp"]) if row_2324 and row_2324["mp"] is not None else 0

        row_2425 = conn.execute(text(
            "SELECT mp FROM raw.sofascore_standings WHERE season = '2425' AND team = 'Chelsea' LIMIT 1"
        )).mappings().first()
        mp_2425 = int(row_2425["mp"]) if row_2425 and row_2425["mp"] is not None else 0

        logger.info(
            "patch_sofascore: patching — Chelsea mp in '2324'=%d, '2425'=%d",
            mp_2324, mp_2425,
        )

        # Phase 1 — rename to conflict-free temp codes
        conn.execute(text("UPDATE raw.sofascore_standings SET season = 'TMP_A' WHERE season = '2122'"))
        conn.execute(text("UPDATE raw.sofascore_standings SET season = 'TMP_B' WHERE season = '2223'"))
        conn.execute(text("UPDATE raw.sofascore_standings SET season = 'TMP_C' WHERE season = '2324'"))
        # Drop the partial / failed live-season data
        conn.execute(text("DELETE FROM raw.sofascore_standings WHERE season = '2425'"))

        # Phase 2 — rename to correct codes
        conn.execute(text("UPDATE raw.sofascore_standings SET season = '2223' WHERE season = 'TMP_A'"))
        conn.execute(text("UPDATE raw.sofascore_standings SET season = '2324' WHERE season = 'TMP_B'"))
        conn.execute(text("UPDATE raw.sofascore_standings SET season = '2425' WHERE season = 'TMP_C'"))

        final = conn.execute(text("""
            SELECT season, COUNT(*) AS n
            FROM raw.sofascore_standings
            GROUP BY season ORDER BY season
        """)).mappings().all()
        for row in final:
            logger.info("  season=%s rows=%d", row["season"], row["n"])

        logger.info("patch_sofascore: done")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
