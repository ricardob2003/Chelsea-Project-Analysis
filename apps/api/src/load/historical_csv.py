"""
Historical CSV loader — one-time static load.

Loads:
  - data/raw/historical-data/seasonstats.csv   → raw.hist_team_season
  - data/raw/historical-data/*-xg.csv          → raw.hist_xg
  - data/raw/historical-data/*-fixtures.csv    → raw.hist_fixtures

These files do not change. Running this script multiple times is safe
(ON CONFLICT DO NOTHING on all inserts).
"""

import logging
import os
import uuid
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from src.utils.db import get_connection, log_ingestion

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / "historical-data"


# -----------------------------------------------------------------------------
# hist_team_season  ←  seasonstats.csv
# -----------------------------------------------------------------------------

def load_team_season(batch_id: str) -> None:
    path = DATA_DIR / "seasonstats.csv"
    logger.info(f"Loading {path}")

    df = pd.read_csv(path, index_col=0)
    df.columns = [c.strip() for c in df.columns]

    def _int(val):
        try:
            return int(val) if pd.notna(val) and str(val).strip() != "" else None
        except (ValueError, TypeError):
            return None

    def _float(val):
        try:
            return float(val) if pd.notna(val) and str(val).strip() != "" else None
        except (ValueError, TypeError):
            return None

    rows = []
    for _, r in df.iterrows():
        # Derive MP and GD if not present
        w, d, l = _int(r.get("W")), _int(r.get("D")), _int(r.get("L"))
        mp = (w or 0) + (d or 0) + (l or 0) if all(v is not None for v in [w, d, l]) else None
        gf, ga = _int(r.get("GF")), _int(r.get("GA"))
        gd = (gf - ga) if gf is not None and ga is not None else None

        rows.append({
            "squad":    str(r["Squad"]).strip(),
            "season":   str(r["Season"]).strip(),
            "mp":       mp,
            "w":        w,
            "d":        d,
            "l":        l,
            "gf":       gf,
            "ga":       ga,
            "gd":       gd,
            "pts":      _int(r.get("Pts")),
            "sh":       _float(r.get("Sh")),
            "sot":      _float(r.get("SoT")),
            "fk":       _float(r.get("FK")),
            "pk":       _float(r.get("PK")),
            "cmp":      _float(r.get("Cmp")),
            "att":      _float(r.get("Att")),
            "cmp_pct":  _float(r.get("Cmp%")),
            "ck":       _float(r.get("CK")),
            "crdy":     _float(r.get("CrdY")),
            "crdr":     _float(r.get("CrdR")),
            "fls":      _float(r.get("Fls")),
            "pkcon":    _float(r.get("PKcon")),
            "og":       _float(r.get("OG")),
            "_batch_id": batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.hist_team_season (
                squad, season, mp, w, d, l, gf, ga, gd, pts,
                sh, sot, fk, pk, cmp, att, cmp_pct, ck, crdy, crdr,
                fls, pkcon, og, _batch_id
            ) VALUES (
                :squad, :season, :mp, :w, :d, :l, :gf, :ga, :gd, :pts,
                :sh, :sot, :fk, :pk, :cmp, :att, :cmp_pct, :ck, :crdy, :crdr,
                :fls, :pkcon, :og, :_batch_id
            )
            ON CONFLICT (squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "historical_csv", "team_season", season=None,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  hist_team_season: {len(rows)} rows")


# -----------------------------------------------------------------------------
# hist_xg  ←  21-22-xg.csv, 22-23-xg.csv, 23-24-xg.csv
# -----------------------------------------------------------------------------

XG_FILES = {
    "2021-22": "21-22-xg.csv",
    "2022-23": "22-23-xg.csv",
    "2023-24": "23-24-xg.csv",
}


def load_xg(batch_id: str) -> None:
    all_rows = []

    for season_label, filename in XG_FILES.items():
        path = DATA_DIR / filename
        if not path.exists():
            logger.warning(f"  {path} not found, skipping")
            continue

        logger.info(f"Loading {path}")
        df = pd.read_csv(path)
        df.columns = [c.strip() for c in df.columns]

        for _, r in df.iterrows():
            def _f(col):
                val = r.get(col)
                try:
                    return float(val) if pd.notna(val) else None
                except (ValueError, TypeError):
                    return None

            all_rows.append({
                "team":           str(r["Team"]).strip(),
                "season":         season_label,
                "mp":             int(r["MP"]) if pd.notna(r.get("MP")) else None,
                "xg":             _f("xG"),
                "xga":            _f("xGA"),
                "xgd":            _f("xGD"),
                "gf":             int(r["GF"]) if pd.notna(r.get("GF")) else None,
                "ga":             int(r["GA"]) if pd.notna(r.get("GA")) else None,
                "xg_vs_actual":   _f("xG vs Actual"),
                "_batch_id":      batch_id,
            })

    if not all_rows:
        logger.warning("No xG rows loaded")
        return

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.hist_xg (
                team, season, mp, xg, xga, xgd, gf, ga, xg_vs_actual, _batch_id
            ) VALUES (
                :team, :season, :mp, :xg, :xga, :xgd, :gf, :ga, :xg_vs_actual, :_batch_id
            )
            ON CONFLICT (team, season) DO NOTHING
        """), all_rows)
        log_ingestion(conn, "historical_csv", "xg", season=None,
                      rows_inserted=len(all_rows), batch_id=batch_id)

    logger.info(f"  hist_xg: {len(all_rows)} rows across {len(XG_FILES)} seasons")


# -----------------------------------------------------------------------------
# hist_fixtures  ←  23-24-fixtures.csv, 24-25-fixtures.csv
# (different schemas — normalized here before load)
# -----------------------------------------------------------------------------

def _load_fixtures_2324(batch_id: str) -> list[dict]:
    path = DATA_DIR / "23-24-fixtures.csv"
    if not path.exists():
        logger.warning(f"{path} not found")
        return []

    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "season":       "2023-24",
            "home_team":    str(r["home_team_name"]).strip(),
            "away_team":    str(r["away_team_name"]).strip(),
            "match_date":   str(r.get("starting_at", "")).strip(),
            "round_number": int(r["round_number"]) if pd.notna(r.get("round_number")) else None,
            "home_goals":   int(r["home_team_goals"]) if pd.notna(r.get("home_team_goals")) else None,
            "away_goals":   int(r["away_team_goals"]) if pd.notna(r.get("away_team_goals")) else None,
            "venue":        None,
            "referee":      None,
            "attendance":   None,
            "_batch_id":    batch_id,
        })
    return rows


def _load_fixtures_2425(batch_id: str) -> list[dict]:
    path = DATA_DIR / "24-25-fixtures.csv"
    if not path.exists():
        logger.warning(f"{path} not found")
        return []

    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]

    rows = []
    for _, r in df.iterrows():
        # 24-25 file: Home, Away, HomeScore, AwayScore, Date, Venue, Referee, Attendance
        home_score = r.get("HomeScore")
        away_score = r.get("AwayScore")
        attendance = r.get("Attendance")

        rows.append({
            "season":       "2024-25",
            "home_team":    str(r["Home"]).strip(),
            "away_team":    str(r["Away"]).strip(),
            "match_date":   str(r.get("Date", "")).strip(),
            "round_number": int(r["week"]) if pd.notna(r.get("week")) else None,
            "home_goals":   int(home_score) if pd.notna(home_score) else None,
            "away_goals":   int(away_score) if pd.notna(away_score) else None,
            "venue":        str(r["Venue"]).strip() if pd.notna(r.get("Venue")) else None,
            "referee":      str(r["Referee"]).strip() if pd.notna(r.get("Referee")) else None,
            "attendance":   int(attendance) if pd.notna(attendance) else None,
            "_batch_id":    batch_id,
        })
    return rows


def load_fixtures(batch_id: str) -> None:
    rows = _load_fixtures_2324(batch_id) + _load_fixtures_2425(batch_id)

    if not rows:
        logger.warning("No fixture rows to load")
        return

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.hist_fixtures (
                season, home_team, away_team, match_date,
                round_number, home_goals, away_goals,
                venue, referee, attendance, _batch_id
            ) VALUES (
                :season, :home_team, :away_team, :match_date,
                :round_number, :home_goals, :away_goals,
                :venue, :referee, :attendance, :_batch_id
            )
            ON CONFLICT (season, home_team, away_team, match_date) DO NOTHING
        """), rows)
        log_ingestion(conn, "historical_csv", "fixtures", season=None,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  hist_fixtures: {len(rows)} rows")


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------

def run() -> None:
    batch_id = str(uuid.uuid4())[:8]
    logger.info(f"Historical CSV load — batch {batch_id}")

    load_team_season(batch_id)
    load_xg(batch_id)
    load_fixtures(batch_id)

    logger.info("Historical CSV load complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
