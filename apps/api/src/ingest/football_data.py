"""
football-data.org ingestion — batch, incremental by matchday.

Pulls:
  - fd_matches    (match results, scores, status, date)
  - fd_standings  (season standings snapshot per matchday)
  - fd_teams      (team metadata, once per season)

Incremental strategy:
  - Read last loaded matchday from ingestion_log
  - Pull only matchdays > last loaded
  - Insert new rows (ON CONFLICT DO NOTHING for matches/teams)
  - Standings: upsert by (season, team_id, matchday)

Rate limit: 10 requests/minute on free tier.
  Script sleeps between requests to stay within limit.

API key: set FD_API_KEY in .env
"""

import logging
import os
import time
import uuid
from datetime import datetime

import requests
from sqlalchemy import text

from src.utils.db import get_connection, get_last_watermark, log_ingestion

logger = logging.getLogger(__name__)

BASE_URL = "https://api.football-data.org/v4"
COMPETITION = "PL"
REQUEST_DELAY = 7  # seconds between requests (free tier: 10/min)


def _headers() -> dict:
    api_key = os.getenv("FD_API_KEY")
    if not api_key:
        raise RuntimeError("FD_API_KEY is not set in .env")
    return {"X-Auth-Token": api_key}


def _get(path: str) -> dict:
    url = f"{BASE_URL}{path}"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    time.sleep(REQUEST_DELAY)
    return resp.json()


# -----------------------------------------------------------------------------
# Matches
# -----------------------------------------------------------------------------

def _fetch_matches(season_year: int, matchday: int | None = None) -> list[dict]:
    """Fetch all finished PL matches for a season, optionally filtered by matchday."""
    path = f"/competitions/{COMPETITION}/matches?season={season_year}&status=FINISHED"
    if matchday:
        path += f"&matchday={matchday}"
    data = _get(path)
    return data.get("matches", [])


def _insert_matches(conn, matches: list[dict], season: str, batch_id: str) -> int:
    if not matches:
        return 0

    rows = []
    for m in matches:
        score = m.get("score", {})
        full = score.get("fullTime", {})
        rows.append({
            "match_id":         m["id"],
            "season":           season,
            "matchday":         m.get("matchday"),
            "status":           m.get("status"),
            "match_date":       m.get("utcDate"),
            "competition_id":   m.get("competition", {}).get("id"),
            "competition_name": m.get("competition", {}).get("name"),
            "home_team_id":     m.get("homeTeam", {}).get("id"),
            "home_team_name":   m.get("homeTeam", {}).get("name"),
            "away_team_id":     m.get("awayTeam", {}).get("id"),
            "away_team_name":   m.get("awayTeam", {}).get("name"),
            "home_score":       full.get("home"),
            "away_score":       full.get("away"),
            "winner":           score.get("winner"),
            "_batch_id":        batch_id,
        })

    conn.execute(text("""
        INSERT INTO raw.fd_matches (
            match_id, season, matchday, status, match_date,
            competition_id, competition_name,
            home_team_id, home_team_name,
            away_team_id, away_team_name,
            home_score, away_score, winner,
            _batch_id
        ) VALUES (
            :match_id, :season, :matchday, :status, :match_date,
            :competition_id, :competition_name,
            :home_team_id, :home_team_name,
            :away_team_id, :away_team_name,
            :home_score, :away_score, :winner,
            :_batch_id
        )
        ON CONFLICT (match_id) DO NOTHING
    """), rows)

    return len(rows)


# -----------------------------------------------------------------------------
# Standings
# -----------------------------------------------------------------------------

def _fetch_standings(season_year: int, matchday: int | None = None) -> dict:
    path = f"/competitions/{COMPETITION}/standings?season={season_year}"
    if matchday:
        path += f"&matchday={matchday}"
    return _get(path)


def _insert_standings(conn, data: dict, season: str, matchday: int, batch_id: str) -> int:
    standings_groups = data.get("standings", [])
    total_table = next(
        (g for g in standings_groups if g.get("type") == "TOTAL"), None
    )
    if not total_table:
        return 0

    home_table = {
        e["team"]["id"]: e
        for g in standings_groups if g.get("type") == "HOME"
        for e in g.get("table", [])
    }
    away_table = {
        e["team"]["id"]: e
        for g in standings_groups if g.get("type") == "AWAY"
        for e in g.get("table", [])
    }

    rows = []
    for entry in total_table.get("table", []):
        team_id = entry["team"]["id"]
        home = home_table.get(team_id, {})
        away = away_table.get(team_id, {})

        rows.append({
            "season":             season,
            "team_id":            team_id,
            "matchday":           matchday,
            "team_name":          entry["team"].get("name"),
            "team_short_name":    entry["team"].get("shortName"),
            "position":           entry.get("position"),
            "played_games":       entry.get("playedGames"),
            "won":                entry.get("won"),
            "draw":               entry.get("draw"),
            "lost":               entry.get("lost"),
            "points":             entry.get("points"),
            "goals_for":          entry.get("goalsFor"),
            "goals_against":      entry.get("goalsAgainst"),
            "goal_difference":    entry.get("goalDifference"),
            "home_won":           home.get("won"),
            "home_draw":          home.get("draw"),
            "home_lost":          home.get("lost"),
            "home_goals_for":     home.get("goalsFor"),
            "home_goals_against": home.get("goalsAgainst"),
            "away_won":           away.get("won"),
            "away_draw":          away.get("draw"),
            "away_lost":          away.get("lost"),
            "away_goals_for":     away.get("goalsFor"),
            "away_goals_against": away.get("goalsAgainst"),
            "_batch_id":          batch_id,
        })

    conn.execute(text("""
        INSERT INTO raw.fd_standings (
            season, team_id, matchday, team_name, team_short_name,
            position, played_games, won, draw, lost, points,
            goals_for, goals_against, goal_difference,
            home_won, home_draw, home_lost, home_goals_for, home_goals_against,
            away_won, away_draw, away_lost, away_goals_for, away_goals_against,
            _batch_id
        ) VALUES (
            :season, :team_id, :matchday, :team_name, :team_short_name,
            :position, :played_games, :won, :draw, :lost, :points,
            :goals_for, :goals_against, :goal_difference,
            :home_won, :home_draw, :home_lost, :home_goals_for, :home_goals_against,
            :away_won, :away_draw, :away_lost, :away_goals_for, :away_goals_against,
            :_batch_id
        )
        ON CONFLICT (season, team_id, matchday) DO NOTHING
    """), rows)

    return len(rows)


# -----------------------------------------------------------------------------
# Teams
# -----------------------------------------------------------------------------

def _fetch_teams(season_year: int) -> list[dict]:
    data = _get(f"/competitions/{COMPETITION}/teams?season={season_year}")
    return data.get("teams", [])


def _insert_teams(conn, teams: list[dict], season: str, batch_id: str) -> int:
    if not teams:
        return 0

    rows = [{
        "team_id":    t["id"],
        "season":     season,
        "team_name":  t.get("name"),
        "short_name": t.get("shortName"),
        "tla":        t.get("tla"),
        "crest_url":  t.get("crest"),
        "founded":    t.get("founded"),
        "venue":      t.get("venue"),
        "website":    t.get("website"),
        "_batch_id":  batch_id,
    } for t in teams]

    conn.execute(text("""
        INSERT INTO raw.fd_teams (
            team_id, season, team_name, short_name, tla,
            crest_url, founded, venue, website, _batch_id
        ) VALUES (
            :team_id, :season, :team_name, :short_name, :tla,
            :crest_url, :founded, :venue, :website, :_batch_id
        )
        ON CONFLICT (team_id, season) DO NOTHING
    """), rows)

    return len(rows)


# -----------------------------------------------------------------------------
# Orchestration
# -----------------------------------------------------------------------------

def _season_label(season_year: int) -> str:
    """Convert API season year to our canonical label. 2023 -> '2324'"""
    short_start = str(season_year)[2:]
    short_end = str(season_year + 1)[2:]
    return f"{short_start}{short_end}"


def run(season_years: list[int] | None = None) -> None:
    """
    Pull football-data.org data for given seasons.
    season_years: list of season start years, e.g. [2021, 2022, 2023, 2024]
    """
    if season_years is None:
        from src.utils.seasons import season_window
        # Covers the live season + recent buffer. Historical seasons (≤ 2023-24)
        # are sourced from raw.hist_team_season (FBref static export), so fd only
        # needs to stay current rather than backfill the full history.
        season_years = season_window(n=3)

    batch_id = str(uuid.uuid4())[:8]
    logger.info(f"football-data.org ingest — batch {batch_id}, seasons {season_years}")

    for season_year in season_years:
        season = _season_label(season_year)
        logger.info(f"Processing season {season_year} → {season}")

        try:
            with get_connection() as conn:
                watermark = get_last_watermark(conn, "football_data", "matches", season)
                last_matchday = watermark.get("last_matchday") or 0

            # --- teams (once per season, idempotent) ---
            logger.info(f"  Fetching teams for {season_year}")
            teams = _fetch_teams(season_year)
            with get_connection() as conn:
                t_inserted = _insert_teams(conn, teams, season, batch_id)
                log_ingestion(conn, "football_data", "teams", season,
                              rows_inserted=t_inserted, batch_id=batch_id)
            logger.info(f"  Teams: {t_inserted} rows")

            # --- matches (all finished, incremental by matchday) ---
            logger.info(f"  Fetching matches from matchday {last_matchday + 1}")
            all_matches = _fetch_matches(season_year)
            new_matches = [
                m for m in all_matches
                if m.get("matchday", 0) > last_matchday
                and m.get("status") == "FINISHED"
            ]

            if not new_matches:
                logger.info(f"  No new matches for {season}, skipping")
                continue

            max_matchday = max(m.get("matchday", 0) for m in new_matches)
            logger.info(f"  {len(new_matches)} new matches (up to matchday {max_matchday})")

            with get_connection() as conn:
                m_inserted = _insert_matches(conn, new_matches, season, batch_id)
                log_ingestion(conn, "football_data", "matches", season,
                              rows_inserted=m_inserted,
                              last_matchday=max_matchday,
                              batch_id=batch_id)
            logger.info(f"  Matches: {m_inserted} rows")

            # --- standings snapshot at latest matchday ---
            logger.info(f"  Fetching standings at matchday {max_matchday}")
            standings_data = _fetch_standings(season_year, matchday=max_matchday)
            with get_connection() as conn:
                s_inserted = _insert_standings(conn, standings_data, season,
                                               max_matchday, batch_id)
                log_ingestion(conn, "football_data", "standings", season,
                              rows_inserted=s_inserted,
                              last_matchday=max_matchday,
                              batch_id=batch_id)
            logger.info(f"  Standings: {s_inserted} rows")

        except Exception as e:
            logger.error(f"  Failed for season {season_year}: {e}")
            with get_connection() as conn:
                log_ingestion(conn, "football_data", "matches", season,
                              rows_inserted=0, status="failed",
                              error_message=str(e), batch_id=batch_id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
