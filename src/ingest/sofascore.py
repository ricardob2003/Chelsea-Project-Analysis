"""
Sofascore ingestion — full refresh per season.

Pulls:
  - sofascore_standings  (final season table: W/D/L/GF/GA/GD/Pts per team)

Grain: team-season (20 rows per season).
Full refresh — small table, safe to wipe and reload each run.
"""

import logging
import uuid

import soccerdata as sd
import pandas as pd
from sqlalchemy import text

from src.utils.db import get_connection, log_ingestion

logger = logging.getLogger(__name__)

LEAGUE = "ENG-Premier League"

# soccerdata Sofascore uses the START year of the season.
# Pass start year to get the correct season:
#   2021 → 2021-22, 2022 → 2022-23, 2023 → 2023-24, 2024 → 2024-25, 2025 → 2025-26
SEASON_CODE_MAP = {
    2021: "2122",
    2022: "2223",
    2023: "2324",
    2024: "2425",
    2025: "2526",
}


def _insert_standings(conn, df: pd.DataFrame, season: str, batch_id: str) -> int:
    if df.empty:
        return 0

    df = df.reset_index()

    # Full refresh — delete existing rows for this season
    conn.execute(text(
        "DELETE FROM raw.sofascore_standings WHERE season = :season"
    ), {"season": season})

    rows = []
    for _, r in df.iterrows():
        def _int(col):
            val = r.get(col)
            try:
                return int(val) if pd.notna(val) else None
            except (ValueError, TypeError):
                return None

        rows.append({
            "team":    str(r.get("team", "")).strip(),
            "season":  season,
            "mp":      _int("MP"),
            "w":       _int("W"),
            "d":       _int("D"),
            "l":       _int("L"),
            "gf":      _int("GF"),
            "ga":      _int("GA"),
            "gd":      _int("GD"),
            "pts":     _int("Pts"),
            "_batch_id": batch_id,
        })

    conn.execute(text("""
        INSERT INTO raw.sofascore_standings (
            team, season, mp, w, d, l, gf, ga, gd, pts, _batch_id
        ) VALUES (
            :team, :season, :mp, :w, :d, :l, :gf, :ga, :gd, :pts, :_batch_id
        )
        ON CONFLICT (team, season) DO NOTHING
    """), rows)

    return len(rows)


def run(seasons: list[int] | None = None) -> None:
    if seasons is None:
        seasons = [2022, 2023, 2024, 2025]

    batch_id = str(uuid.uuid4())[:8]
    logger.info(f"Sofascore ingest — batch {batch_id}, seasons {seasons}")

    for sd_season in seasons:
        season_code = SEASON_CODE_MAP.get(sd_season)
        if not season_code:
            logger.warning(f"No season code mapping for {sd_season}, skipping")
            continue

        logger.info(f"Processing season {sd_season} → {season_code}")

        try:
            scraper = sd.Sofascore(leagues=LEAGUE, seasons=sd_season)
            df = scraper.read_league_table()

            with get_connection() as conn:
                inserted = _insert_standings(conn, df, season_code, batch_id)
                log_ingestion(conn, "sofascore", "standings", season_code,
                              rows_inserted=inserted, batch_id=batch_id)

            logger.info(f"  standings ({season_code}): {inserted} rows")

        except Exception as e:
            logger.error(f"  Failed for season {sd_season}: {e}")
            with get_connection() as conn:
                log_ingestion(conn, "sofascore", "standings", season_code,
                              rows_inserted=0, status="failed",
                              error_message=str(e), batch_id=batch_id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
