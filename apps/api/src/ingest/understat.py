"""
Understat ingestion — batch, incremental by game_id.

Pulls:
  - understat_matches        (match-level xG, ppda, np_xg, deep completions)
  - understat_player_match   (player-match-level: mins, goals, xg, xa, etc.)
  - understat_player_season  (player-season aggregates: mins, goals, xg, xa, etc.)

Incremental strategy:
  - matches/player_match: incremental by game_id
  - player_season: full refresh per season (small table, ~570 rows)
"""

import logging
import uuid
from datetime import datetime

import pandas as pd
import soccerdata as sd
from sqlalchemy import text

from src.utils.db import get_connection, get_last_watermark, log_ingestion

logger = logging.getLogger(__name__)

# Maps CLI start-year integer → (soccerdata season specifier, raw storage code).
# Integer season IDs are ambiguous in soccerdata — use string "YY-YY" format instead.
# CLI integer = the year the PL season STARTS.
SEASON_MAP: dict[int, tuple[str, str]] = {
    2020: ("20-21", "2021"),   # 2020-21 PL
    2021: ("21-22", "2122"),   # 2021-22 PL
    2022: ("22-23", "2223"),   # 2022-23 PL
    2023: ("23-24", "2324"),   # 2023-24 PL
    2024: ("24-25", "2425"),   # 2024-25 PL
    2025: ("25-26", "2526"),   # 2025-26 PL (current)
}

LEAGUE = "ENG-Premier League"


def _get_loaded_game_ids(conn, season: str) -> set[int]:
    rows = conn.execute(text(
        "SELECT game_id FROM raw.understat_matches WHERE season = :season"
    ), {"season": season}).fetchall()
    return {r[0] for r in rows}


def _insert_matches(conn, df: pd.DataFrame, season: str, batch_id: str) -> int:
    if df.empty:
        return 0

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "game_id":          int(r["game_id"]),
            "season":           season,
            "match_date":       pd.to_datetime(r["date"]) if pd.notna(r.get("date")) else None,
            "league_id":        int(r["league_id"]) if pd.notna(r.get("league_id")) else None,
            "season_id":        int(r["season_id"]) if pd.notna(r.get("season_id")) else None,
            "home_team_id":     int(r["home_team_id"]) if pd.notna(r.get("home_team_id")) else None,
            "away_team_id":     int(r["away_team_id"]) if pd.notna(r.get("away_team_id")) else None,
            "home_team":        r.get("home_team"),
            "away_team":        r.get("away_team"),
            "home_team_code":   r.get("home_team_code"),
            "away_team_code":   r.get("away_team_code"),
            "home_goals":       int(r["home_goals"]) if pd.notna(r.get("home_goals")) else None,
            "away_goals":       int(r["away_goals"]) if pd.notna(r.get("away_goals")) else None,
            "is_result":        bool(r.get("is_result", False)),
            "has_data":         bool(r.get("has_data", False)),
            "home_xg":          float(r["home_xg"]) if pd.notna(r.get("home_xg")) else None,
            "away_xg":          float(r["away_xg"]) if pd.notna(r.get("away_xg")) else None,
            "home_np_xg":       float(r["home_np_xg"]) if pd.notna(r.get("home_np_xg")) else None,
            "away_np_xg":       float(r["away_np_xg"]) if pd.notna(r.get("away_np_xg")) else None,
            "home_np_xg_diff":  float(r["home_np_xg_difference"]) if pd.notna(r.get("home_np_xg_difference")) else None,
            "away_np_xg_diff":  float(r["away_np_xg_difference"]) if pd.notna(r.get("away_np_xg_difference")) else None,
            "home_ppda":        float(r["home_ppda"]) if pd.notna(r.get("home_ppda")) else None,
            "away_ppda":        float(r["away_ppda"]) if pd.notna(r.get("away_ppda")) else None,
            "home_deep":        int(r["home_deep_completions"]) if pd.notna(r.get("home_deep_completions")) else None,
            "away_deep":        int(r["away_deep_completions"]) if pd.notna(r.get("away_deep_completions")) else None,
            "home_points":      int(r["home_points"]) if pd.notna(r.get("home_points")) else None,
            "away_points":      int(r["away_points"]) if pd.notna(r.get("away_points")) else None,
            "home_xpts":        float(r["home_expected_points"]) if pd.notna(r.get("home_expected_points")) else None,
            "away_xpts":        float(r["away_expected_points"]) if pd.notna(r.get("away_expected_points")) else None,
            "source_url":       r.get("url"),
            "_batch_id":        batch_id,
        })

    conn.execute(text("""
        INSERT INTO raw.understat_matches (
            game_id, season, match_date, league_id, season_id,
            home_team_id, away_team_id, home_team, away_team,
            home_team_code, away_team_code, home_goals, away_goals,
            is_result, has_data,
            home_xg, away_xg, home_np_xg, away_np_xg,
            home_np_xg_diff, away_np_xg_diff,
            home_ppda, away_ppda, home_deep, away_deep,
            home_points, away_points, home_xpts, away_xpts,
            source_url, _batch_id
        ) VALUES (
            :game_id, :season, :match_date, :league_id, :season_id,
            :home_team_id, :away_team_id, :home_team, :away_team,
            :home_team_code, :away_team_code, :home_goals, :away_goals,
            :is_result, :has_data,
            :home_xg, :away_xg, :home_np_xg, :away_np_xg,
            :home_np_xg_diff, :away_np_xg_diff,
            :home_ppda, :away_ppda, :home_deep, :away_deep,
            :home_points, :away_points, :home_xpts, :away_xpts,
            :source_url, :_batch_id
        )
        ON CONFLICT (game_id) DO NOTHING
    """), rows)

    return len(rows)


def _insert_player_match(conn, df: pd.DataFrame, season: str, batch_id: str) -> int:
    if df.empty:
        return 0

    df = df.reset_index()
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "game_id":      int(r["game_id"]) if pd.notna(r.get("game_id")) else None,
            "player_id":    int(r["player_id"]) if pd.notna(r.get("player_id")) else None,
            "team":         str(r.get("team", "")),
            "season":       season,
            "league_id":    int(r["league_id"]) if pd.notna(r.get("league_id")) else None,
            "season_id":    int(r["season_id"]) if pd.notna(r.get("season_id")) else None,
            "team_id":      int(r["team_id"]) if pd.notna(r.get("team_id")) else None,
            "player_name":  str(r.get("player", "")),
            "position":     r.get("position"),
            "position_id":  int(r["position_id"]) if pd.notna(r.get("position_id")) else None,
            "minutes":      int(r["minutes"]) if pd.notna(r.get("minutes")) else None,
            "goals":        int(r["goals"]) if pd.notna(r.get("goals")) else None,
            "own_goals":    int(r["own_goals"]) if pd.notna(r.get("own_goals")) else None,
            "shots":        int(r["shots"]) if pd.notna(r.get("shots")) else None,
            "xg":           float(r["xg"]) if pd.notna(r.get("xg")) else None,
            "xg_chain":     float(r["xg_chain"]) if pd.notna(r.get("xg_chain")) else None,
            "xg_buildup":   float(r["xg_buildup"]) if pd.notna(r.get("xg_buildup")) else None,
            "assists":      int(r["assists"]) if pd.notna(r.get("assists")) else None,
            "xa":           float(r["xa"]) if pd.notna(r.get("xa")) else None,
            "key_passes":   int(r["key_passes"]) if pd.notna(r.get("key_passes")) else None,
            "yellow_cards": int(r["yellow_cards"]) if pd.notna(r.get("yellow_cards")) else None,
            "red_cards":    int(r["red_cards"]) if pd.notna(r.get("red_cards")) else None,
            "_batch_id":    batch_id,
        })

    conn.execute(text("""
        INSERT INTO raw.understat_player_match (
            game_id, player_id, team, season,
            league_id, season_id, team_id, player_name,
            position, position_id, minutes,
            goals, own_goals, shots, xg, xg_chain, xg_buildup,
            assists, xa, key_passes, yellow_cards, red_cards,
            _batch_id
        ) VALUES (
            :game_id, :player_id, :team, :season,
            :league_id, :season_id, :team_id, :player_name,
            :position, :position_id, :minutes,
            :goals, :own_goals, :shots, :xg, :xg_chain, :xg_buildup,
            :assists, :xa, :key_passes, :yellow_cards, :red_cards,
            :_batch_id
        )
        ON CONFLICT (game_id, player_id, team) DO NOTHING
    """), rows)

    return len(rows)


def run(seasons: list[int] | None = None) -> None:
    """
    Pull Understat data for the given soccerdata season integers.
    Defaults to last 3 completed seasons + current.
    """
    if seasons is None:
        from src.utils.seasons import season_window_understat
        seasons = season_window_understat(n=5)

    batch_id = str(uuid.uuid4())[:8]
    logger.info(f"Understat ingest — batch {batch_id}, seasons {seasons}")

    for sd_season in seasons:
        mapping = SEASON_MAP.get(sd_season)
        if not mapping:
            logger.warning(f"No season code mapping for {sd_season}, skipping")
            continue

        sd_specifier, season_code = mapping
        logger.info(f"Processing season {sd_season} → {season_code}")

        try:
            scraper = sd.Understat(leagues=LEAGUE, seasons=sd_specifier)
            schedule = scraper.read_schedule().reset_index()
            team_stats = scraper.read_team_match_stats().reset_index()

            # Only process finished matches
            finished = schedule[schedule["is_result"] == True].copy()
            finished_game_ids = set(finished["game_id"].astype(int))

            with get_connection() as conn:
                loaded_ids = _get_loaded_game_ids(conn, season_code)
                new_game_ids = finished_game_ids - loaded_ids

                if not new_game_ids:
                    logger.info(f"  No new matches for {season_code}, skipping match load")
                    log_ingestion(conn, "understat", "matches", season_code,
                                  rows_inserted=0, batch_id=batch_id)
                    # still refresh player season stats even if no new matches
                    player_season = scraper.read_player_season_stats().reset_index()
                    ps_inserted = _insert_player_season(conn, player_season, season_code, batch_id)
                    log_ingestion(conn, "understat", "player_season_stats", season_code,
                                  rows_inserted=ps_inserted, batch_id=batch_id)
                    logger.info(f"  Refreshed {ps_inserted} player season rows")
                    continue

                logger.info(f"  {len(new_game_ids)} new matches to load")

                # --- matches ---
                new_team_stats = team_stats[
                    team_stats["game_id"].astype(int).isin(new_game_ids)
                ].copy()
                m_inserted = _insert_matches(conn, new_team_stats, season_code, batch_id)

                # --- player match stats ---
                player_stats = scraper.read_player_match_stats().reset_index()
                new_player_stats = player_stats[
                    player_stats["game_id"].astype(int).isin(new_game_ids)
                ].copy()
                p_inserted = _insert_player_match(conn, new_player_stats, season_code, batch_id)

                last_game_id = max(new_game_ids) if new_game_ids else None

                log_ingestion(conn, "understat", "matches", season_code,
                              rows_inserted=m_inserted,
                              last_game_id=last_game_id,
                              batch_id=batch_id)
                log_ingestion(conn, "understat", "player_match_stats", season_code,
                              rows_inserted=p_inserted,
                              last_game_id=last_game_id,
                              batch_id=batch_id)

                logger.info(f"  Inserted: {m_inserted} matches, {p_inserted} player rows")

                # --- player season stats (full refresh per season) ---
                player_season = scraper.read_player_season_stats().reset_index()
                ps_inserted = _insert_player_season(conn, player_season, season_code, batch_id)
                log_ingestion(conn, "understat", "player_season_stats", season_code,
                              rows_inserted=ps_inserted,
                              last_game_id=last_game_id,
                              batch_id=batch_id)
                logger.info(f"  Inserted: {ps_inserted} player season rows")

        except Exception as e:
            logger.error(f"  Failed for season {sd_season}: {e}")
            with get_connection() as conn:
                log_ingestion(conn, "understat", "matches", season_code,
                              rows_inserted=0, status="failed",
                              error_message=str(e), batch_id=batch_id)


def _insert_player_season(conn, df: pd.DataFrame, season: str, batch_id: str) -> int:
    if df.empty:
        return 0

    df = df.reset_index()
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player_id":    int(r["player_id"]) if pd.notna(r.get("player_id")) else None,
            "team":         str(r.get("team", "")),
            "season":       season,
            "league_id":    int(r["league_id"]) if pd.notna(r.get("league_id")) else None,
            "season_id":    int(r["season_id"]) if pd.notna(r.get("season_id")) else None,
            "team_id":      int(r["team_id"]) if pd.notna(r.get("team_id")) else None,
            "player_name":  str(r.get("player", "")),
            "position":     r.get("position"),
            "matches":      int(r["matches"]) if pd.notna(r.get("matches")) else None,
            "minutes":      int(r["minutes"]) if pd.notna(r.get("minutes")) else None,
            "goals":        int(r["goals"]) if pd.notna(r.get("goals")) else None,
            "xg":           float(r["xg"]) if pd.notna(r.get("xg")) else None,
            "np_goals":     int(r["np_goals"]) if pd.notna(r.get("np_goals")) else None,
            "np_xg":        float(r["np_xg"]) if pd.notna(r.get("np_xg")) else None,
            "assists":      int(r["assists"]) if pd.notna(r.get("assists")) else None,
            "xa":           float(r["xa"]) if pd.notna(r.get("xa")) else None,
            "shots":        int(r["shots"]) if pd.notna(r.get("shots")) else None,
            "key_passes":   int(r["key_passes"]) if pd.notna(r.get("key_passes")) else None,
            "yellow_cards": int(r["yellow_cards"]) if pd.notna(r.get("yellow_cards")) else None,
            "red_cards":    int(r["red_cards"]) if pd.notna(r.get("red_cards")) else None,
            "xg_chain":     float(r["xg_chain"]) if pd.notna(r.get("xg_chain")) else None,
            "xg_buildup":   float(r["xg_buildup"]) if pd.notna(r.get("xg_buildup")) else None,
            "_batch_id":    batch_id,
        })

    # Full refresh per season — delete existing rows first
    conn.execute(text(
        "DELETE FROM raw.understat_player_season WHERE season = :season"
    ), {"season": season})

    conn.execute(text("""
        INSERT INTO raw.understat_player_season (
            player_id, team, season, league_id, season_id, team_id,
            player_name, position, matches, minutes,
            goals, xg, np_goals, np_xg, assists, xa,
            shots, key_passes, yellow_cards, red_cards,
            xg_chain, xg_buildup, _batch_id
        ) VALUES (
            :player_id, :team, :season, :league_id, :season_id, :team_id,
            :player_name, :position, :matches, :minutes,
            :goals, :xg, :np_goals, :np_xg, :assists, :xa,
            :shots, :key_passes, :yellow_cards, :red_cards,
            :xg_chain, :xg_buildup, :_batch_id
        )
        ON CONFLICT (player_id, team, season) DO NOTHING
    """), rows)

    return len(rows)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    run()
