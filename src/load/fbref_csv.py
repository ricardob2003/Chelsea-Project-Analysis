"""
FBref manual CSV loader.

FBref blocks automated scraping (403). Export tables manually from:
  https://fbref.com/en/comps/9/YYYY-YY/stats/players/YYYY-YY-Premier-League-Stats

Expected file layout under data/raw/fbref/:
  {season}/standard.csv
  {season}/passing.csv
  {season}/possession.csv
  {season}/defense.csv
  {season}/gk.csv
  {season}/playing_time.csv

Where {season} is the canonical label, e.g. '2023-24'.

Running this script multiple times is safe (ON CONFLICT DO NOTHING).

Usage:
  python -m src.load.fbref_csv               # loads all seasons found in data/raw/fbref/
  python -m src.load.fbref_csv 2023-24       # loads a specific season
"""

import logging
import sys
import uuid
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from src.utils.db import get_connection, log_ingestion

logger = logging.getLogger(__name__)

FBREF_DIR = Path(__file__).resolve().parents[2] / "data" / "raw" / "fbref"


def _clean_col(col: str) -> str:
    """Normalize FBref column names: lowercase, replace spaces/slashes with underscores."""
    return col.strip().lower().replace(" ", "_").replace("/", "_").replace("%", "_pct").replace("+", "_plus_").replace("-", "_minus_")


def _int(val):
    try:
        return int(val) if pd.notna(val) and str(val).strip() not in ("", "N/A") else None
    except (ValueError, TypeError):
        return None


def _float(val):
    try:
        return float(val) if pd.notna(val) and str(val).strip() not in ("", "N/A") else None
    except (ValueError, TypeError):
        return None


def _natural_key(df: pd.DataFrame, season: str) -> pd.DataFrame:
    """Add season column and drop duplicate (player, squad) rows FBref sometimes exports."""
    df = df.copy()
    df["season"] = season
    # FBref exports players who moved mid-season with a '2 teams' squad row — keep all rows
    return df.drop_duplicates(subset=["player", "squad", "season"])


def load_standard(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "standard.csv"
    if not path.exists():
        logger.warning(f"  standard.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)  # FBref CSVs have a merged header row
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]  # drop repeated header rows
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":           str(r["player"]).strip(),
            "squad":            str(r.get("squad", "")).strip(),
            "season":           season,
            "nation":           str(r.get("nation", "")).strip() or None,
            "pos":              str(r.get("pos", "")).strip() or None,
            "age":              str(r.get("age", "")).strip() or None,
            "mp":               _int(r.get("mp")),
            "starts":           _int(r.get("starts")),
            "min":              _int(r.get("min")),
            "min_per_90":       _float(r.get("90s")),
            "goals":            _int(r.get("gls")),
            "assists":          _int(r.get("ast")),
            "g_plus_a":         _int(r.get("g_plus_a")),
            "g_minus_pk":       _int(r.get("g_minus_pk")),
            "pk":               _int(r.get("pk")),
            "pk_att":           _int(r.get("pkatt")),
            "yellow_cards":     _int(r.get("crdy")),
            "red_cards":        _int(r.get("crdr")),
            "xg":               _float(r.get("xg")),
            "npxg":             _float(r.get("npxg")),
            "xag":              _float(r.get("xag")),
            "npxg_plus_xag":    _float(r.get("npxg_plus_xag")),
            "prgc":             _int(r.get("prgc")),
            "prgp":             _int(r.get("prgp")),
            "prgr":             _int(r.get("prgr")),
            "gls_per90":        _float(r.get("gls_per90") or r.get("gls.1")),
            "ast_per90":        _float(r.get("ast_per90") or r.get("ast.1")),
            "g_plus_a_per90":   _float(r.get("g_plus_a_per90") or r.get("g_plus_a.1")),
            "xg_per90":         _float(r.get("xg_per90") or r.get("xg.1")),
            "xag_per90":        _float(r.get("xag_per90") or r.get("xag.1")),
            "_batch_id":        batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_standard (
                player, squad, season, nation, pos, age,
                mp, starts, min, min_per_90,
                goals, assists, g_plus_a, g_minus_pk, pk, pk_att,
                yellow_cards, red_cards,
                xg, npxg, xag, npxg_plus_xag,
                prgc, prgp, prgr,
                gls_per90, ast_per90, g_plus_a_per90, xg_per90, xag_per90,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :nation, :pos, :age,
                :mp, :starts, :min, :min_per_90,
                :goals, :assists, :g_plus_a, :g_minus_pk, :pk, :pk_att,
                :yellow_cards, :red_cards,
                :xg, :npxg, :xag, :npxg_plus_xag,
                :prgc, :prgp, :prgr,
                :gls_per90, :ast_per90, :g_plus_a_per90, :xg_per90, :xag_per90,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "standard", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_standard ({season}): {len(rows)} rows")


def load_passing(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "passing.csv"
    if not path.exists():
        logger.warning(f"  passing.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":           str(r["player"]).strip(),
            "squad":            str(r.get("squad", "")).strip(),
            "season":           season,
            "min":              _int(r.get("min")),
            "cmp":              _int(r.get("cmp")),
            "att":              _int(r.get("att")),
            "cmp_pct":          _float(r.get("cmp_pct")),
            "tot_dist":         _int(r.get("totdist")),
            "prg_dist":         _int(r.get("prgdist")),
            "short_cmp":        _int(r.get("cmp.1")),
            "short_att":        _int(r.get("att.1")),
            "short_cmp_pct":    _float(r.get("cmp_pct.1")),
            "med_cmp":          _int(r.get("cmp.2")),
            "med_att":          _int(r.get("att.2")),
            "med_cmp_pct":      _float(r.get("cmp_pct.2")),
            "long_cmp":         _int(r.get("cmp.3")),
            "long_att":         _int(r.get("att.3")),
            "long_cmp_pct":     _float(r.get("cmp_pct.3")),
            "ast":              _int(r.get("ast")),
            "xag":              _float(r.get("xag")),
            "xa":               _float(r.get("xa")),
            "kp":               _int(r.get("kp")),
            "final_third":      _int(r.get("1_3")),
            "ppa":              _int(r.get("ppa")),
            "crs_pa":           _int(r.get("crspa")),
            "prgp":             _int(r.get("prgp")),
            "_batch_id":        batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_passing (
                player, squad, season, min,
                cmp, att, cmp_pct, tot_dist, prg_dist,
                short_cmp, short_att, short_cmp_pct,
                med_cmp, med_att, med_cmp_pct,
                long_cmp, long_att, long_cmp_pct,
                ast, xag, xa, kp, final_third, ppa, crs_pa, prgp,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :min,
                :cmp, :att, :cmp_pct, :tot_dist, :prg_dist,
                :short_cmp, :short_att, :short_cmp_pct,
                :med_cmp, :med_att, :med_cmp_pct,
                :long_cmp, :long_att, :long_cmp_pct,
                :ast, :xag, :xa, :kp, :final_third, :ppa, :crs_pa, :prgp,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "passing", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_passing ({season}): {len(rows)} rows")


def load_possession(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "possession.csv"
    if not path.exists():
        logger.warning(f"  possession.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":               str(r["player"]).strip(),
            "squad":                str(r.get("squad", "")).strip(),
            "season":               season,
            "min":                  _int(r.get("min")),
            "touches":              _int(r.get("touches")),
            "touches_def_pen":      _int(r.get("def_pen")),
            "touches_def_3rd":      _int(r.get("def_3rd")),
            "touches_mid_3rd":      _int(r.get("mid_3rd")),
            "touches_att_3rd":      _int(r.get("att_3rd")),
            "touches_att_pen":      _int(r.get("att_pen")),
            "live_touches":         _int(r.get("live")),
            "att_take_ons":         _int(r.get("att")),
            "succ_take_ons":        _int(r.get("succ")),
            "succ_take_on_pct":     _float(r.get("succ_pct")),
            "tkld":                 _int(r.get("tkld")),
            "tkld_pct":             _float(r.get("tkld_pct")),
            "carries":              _int(r.get("carries")),
            "tot_carry_dist":       _int(r.get("totdist")),
            "prg_carry_dist":       _int(r.get("prgdist")),
            "prgc":                 _int(r.get("prgc")),
            "carries_final_third":  _int(r.get("1_3")),
            "carries_pen_area":     _int(r.get("cpa")),
            "miscontrols":          _int(r.get("mis")),
            "dispossessed":         _int(r.get("dis")),
            "rec":                  _int(r.get("rec")),
            "prgr":                 _int(r.get("prgr")),
            "_batch_id":            batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_possession (
                player, squad, season, min,
                touches, touches_def_pen, touches_def_3rd, touches_mid_3rd,
                touches_att_3rd, touches_att_pen, live_touches,
                att_take_ons, succ_take_ons, succ_take_on_pct, tkld, tkld_pct,
                carries, tot_carry_dist, prg_carry_dist, prgc,
                carries_final_third, carries_pen_area,
                miscontrols, dispossessed, rec, prgr,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :min,
                :touches, :touches_def_pen, :touches_def_3rd, :touches_mid_3rd,
                :touches_att_3rd, :touches_att_pen, :live_touches,
                :att_take_ons, :succ_take_ons, :succ_take_on_pct, :tkld, :tkld_pct,
                :carries, :tot_carry_dist, :prg_carry_dist, :prgc,
                :carries_final_third, :carries_pen_area,
                :miscontrols, :dispossessed, :rec, :prgr,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "possession", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_possession ({season}): {len(rows)} rows")


def load_defense(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "defense.csv"
    if not path.exists():
        logger.warning(f"  defense.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":           str(r["player"]).strip(),
            "squad":            str(r.get("squad", "")).strip(),
            "season":           season,
            "min":              _int(r.get("min")),
            "tkl":              _int(r.get("tkl")),
            "tkl_won":          _int(r.get("tklw")),
            "tkl_def_3rd":      _int(r.get("def_3rd")),
            "tkl_mid_3rd":      _int(r.get("mid_3rd")),
            "tkl_att_3rd":      _int(r.get("att_3rd")),
            "drib_tkl":         _int(r.get("tkl.1")),
            "drib_att":         _int(r.get("att")),
            "drib_tkl_pct":     _float(r.get("tkl_pct")),
            "drib_past":        _int(r.get("past")),
            "press":            _int(r.get("press")),
            "press_succ":       _int(r.get("succ")),
            "press_pct":        _float(r.get("pct")),
            "press_def_3rd":    _int(r.get("def_3rd.1")),
            "press_mid_3rd":    _int(r.get("mid_3rd.1")),
            "press_att_3rd":    _int(r.get("att_3rd.1")),
            "blocks":           _int(r.get("blocks")),
            "blocked_sh":       _int(r.get("sh")),
            "blocked_pass":     _int(r.get("pass")),
            "interceptions":    _int(r.get("int")),
            "tkl_plus_int":     _int(r.get("tkl_plus_int")),
            "clearances":       _int(r.get("clr")),
            "errors":           _int(r.get("err")),
            "_batch_id":        batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_defense (
                player, squad, season, min,
                tkl, tkl_won, tkl_def_3rd, tkl_mid_3rd, tkl_att_3rd,
                drib_tkl, drib_att, drib_tkl_pct, drib_past,
                press, press_succ, press_pct,
                press_def_3rd, press_mid_3rd, press_att_3rd,
                blocks, blocked_sh, blocked_pass,
                interceptions, tkl_plus_int, clearances, errors,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :min,
                :tkl, :tkl_won, :tkl_def_3rd, :tkl_mid_3rd, :tkl_att_3rd,
                :drib_tkl, :drib_att, :drib_tkl_pct, :drib_past,
                :press, :press_succ, :press_pct,
                :press_def_3rd, :press_mid_3rd, :press_att_3rd,
                :blocks, :blocked_sh, :blocked_pass,
                :interceptions, :tkl_plus_int, :clearances, :errors,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "defense", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_defense ({season}): {len(rows)} rows")


def load_gk(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "gk.csv"
    if not path.exists():
        logger.warning(f"  gk.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":               str(r["player"]).strip(),
            "squad":                str(r.get("squad", "")).strip(),
            "season":               season,
            "min":                  _int(r.get("min")),
            "ga":                   _int(r.get("ga")),
            "ga90":                 _float(r.get("ga90")),
            "sota":                 _int(r.get("sota")),
            "saves":                _int(r.get("saves")),
            "save_pct":             _float(r.get("save_pct")),
            "cs":                   _int(r.get("cs")),
            "cs_pct":               _float(r.get("cs_pct")),
            "pk_att_faced":         _int(r.get("pkatt")),
            "pk_allowed":           _int(r.get("pka")),
            "pk_saved":             _int(r.get("pksv")),
            "pk_missed":            _int(r.get("pkm")),
            "psxg":                 _float(r.get("psxg")),
            "psxg_per_sot":         _float(r.get("psxg_per_sot")),
            "psxg_diff":            _float(r.get("psxg_plus_minus_")),
            "launch_cmp":           _int(r.get("cmp")),
            "launch_att":           _int(r.get("att")),
            "launch_cmp_pct":       _float(r.get("launch_pct")),
            "avg_kick_len":         _float(r.get("avglen")),
            "opp_cross_att":        _int(r.get("opp")),
            "cross_stopped":        _int(r.get("stp")),
            "cross_stopped_pct":    _float(r.get("stp_pct")),
            "swe_opa":              _int(r.get("opa")),
            "avg_swe_dist":         _float(r.get("avgdist")),
            "_batch_id":            batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_gk (
                player, squad, season, min,
                ga, ga90, sota, saves, save_pct, cs, cs_pct,
                pk_att_faced, pk_allowed, pk_saved, pk_missed,
                psxg, psxg_per_sot, psxg_diff,
                launch_cmp, launch_att, launch_cmp_pct, avg_kick_len,
                opp_cross_att, cross_stopped, cross_stopped_pct,
                swe_opa, avg_swe_dist,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :min,
                :ga, :ga90, :sota, :saves, :save_pct, :cs, :cs_pct,
                :pk_att_faced, :pk_allowed, :pk_saved, :pk_missed,
                :psxg, :psxg_per_sot, :psxg_diff,
                :launch_cmp, :launch_att, :launch_cmp_pct, :avg_kick_len,
                :opp_cross_att, :cross_stopped, :cross_stopped_pct,
                :swe_opa, :avg_swe_dist,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "gk", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_gk ({season}): {len(rows)} rows")


def load_playing_time(season: str, batch_id: str) -> None:
    path = FBREF_DIR / season / "playing_time.csv"
    if not path.exists():
        logger.warning(f"  playing_time.csv not found for {season}, skipping")
        return

    df = pd.read_csv(path, header=1)
    df.columns = [_clean_col(c) for c in df.columns]
    df = df[df["player"].notna() & (df["player"] != "Player")]
    df = _natural_key(df, season)

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "player":               str(r["player"]).strip(),
            "squad":                str(r.get("squad", "")).strip(),
            "season":               season,
            "age":                  str(r.get("age", "")).strip() or None,
            "pos":                  str(r.get("pos", "")).strip() or None,
            "mp":                   _int(r.get("mp")),
            "mn":                   _int(r.get("min")),
            "min_pct":              _float(r.get("mn_per_mp")),
            "mn_per_start":         _float(r.get("mn_per_start")),
            "compl":                _int(r.get("compl")),
            "subs":                 _int(r.get("subs")),
            "mn_per_sub":           _float(r.get("mn_per_sub")),
            "unsub":                _int(r.get("unsub")),
            "ppm":                  _float(r.get("ppm")),
            "on_g":                 _int(r.get("on_g")),
            "on_ga":                _int(r.get("on_ga")),
            "plus_minus":           _int(r.get("plus_minus_")),
            "plus_minus_per90":     _float(r.get("plus_minus__per90")),
            "on_xg":                _float(r.get("on_xg")),
            "on_xga":               _float(r.get("on_xga")),
            "xg_plus_minus":        _float(r.get("xg_plus_minus_")),
            "xg_plus_minus_per90":  _float(r.get("xg_plus_minus__per90")),
            "_batch_id":            batch_id,
        })

    with get_connection() as conn:
        conn.execute(text("""
            INSERT INTO raw.fbref_playing_time (
                player, squad, season, age, pos,
                mp, mn, min_pct, mn_per_start, compl,
                subs, mn_per_sub, unsub, ppm,
                on_g, on_ga, plus_minus, plus_minus_per90,
                on_xg, on_xga, xg_plus_minus, xg_plus_minus_per90,
                _batch_id
            ) VALUES (
                :player, :squad, :season, :age, :pos,
                :mp, :mn, :min_pct, :mn_per_start, :compl,
                :subs, :mn_per_sub, :unsub, :ppm,
                :on_g, :on_ga, :plus_minus, :plus_minus_per90,
                :on_xg, :on_xga, :xg_plus_minus, :xg_plus_minus_per90,
                :_batch_id
            )
            ON CONFLICT (player, squad, season) DO NOTHING
        """), rows)
        log_ingestion(conn, "fbref", "playing_time", season,
                      rows_inserted=len(rows), batch_id=batch_id)

    logger.info(f"  fbref_playing_time ({season}): {len(rows)} rows")


# -----------------------------------------------------------------------------
# Entry point
# -----------------------------------------------------------------------------

LOADERS = [load_standard, load_passing, load_possession,
           load_defense, load_gk, load_playing_time]


def run(seasons: list[str] | None = None) -> None:
    """
    Load FBref CSV exports for the given season labels.
    Discovers available seasons automatically if none specified.
    """
    if seasons is None:
        if not FBREF_DIR.exists():
            logger.warning(f"FBref data directory not found: {FBREF_DIR}")
            return
        seasons = [d.name for d in sorted(FBREF_DIR.iterdir()) if d.is_dir()]

    if not seasons:
        logger.warning("No FBref seasons found. Export CSVs from fbref.com first.")
        logger.warning(f"Expected directory: {FBREF_DIR}/{{season}}/{{table}}.csv")
        return

    batch_id = str(uuid.uuid4())[:8]
    logger.info(f"FBref CSV load — batch {batch_id}, seasons {seasons}")

    for season in seasons:
        logger.info(f"Processing season {season}")
        for loader in LOADERS:
            try:
                loader(season, batch_id)
            except Exception as e:
                logger.error(f"  {loader.__name__} failed for {season}: {e}")

    logger.info("FBref CSV load complete")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    seasons = sys.argv[1:] if len(sys.argv) > 1 else None
    run(seasons)
