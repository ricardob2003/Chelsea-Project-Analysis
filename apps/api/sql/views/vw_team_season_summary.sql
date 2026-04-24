-- =============================================================================
-- VIEW: vw_team_season_summary
-- Source: staged.stg_team_season
-- Grain: one row per team per season
--
-- Purpose: League table outcomes + xG context for every team-season.
-- Used by: /api/team-summary endpoint → League History, KPI cards
-- =============================================================================

DROP VIEW IF EXISTS views.vw_team_season_summary;
CREATE VIEW views.vw_team_season_summary AS

-- Aggregate season-level xpts from match data (sum of per-match xpts per team per season)
WITH season_xpts AS (
    SELECT
        season_key,
        home_team_key AS team_key,
        ROUND(SUM(home_xpts)::NUMERIC, 1) AS xpts
    FROM staged.stg_match
    WHERE home_xpts IS NOT NULL
    GROUP BY season_key, home_team_key

    UNION ALL

    SELECT
        season_key,
        away_team_key AS team_key,
        ROUND(SUM(away_xpts)::NUMERIC, 1) AS xpts
    FROM staged.stg_match
    WHERE away_xpts IS NOT NULL
    GROUP BY season_key, away_team_key
),
season_xpts_agg AS (
    SELECT season_key, team_key, SUM(xpts) AS xpts
    FROM season_xpts
    GROUP BY season_key, team_key
)

SELECT
    ts.season_key,
    ts.team_key,

    -- league table
    ts.table_rank,
    ts.mp, ts.w, ts.d, ts.l,
    ts.gf, ts.ga, ts.gd,
    ts.pts,
    ts.pts_per_match,

    -- benchmark context
    ts.ucl_cutoff_rank,
    ts.champion_pts,
    ts.ucl_cutoff_pts,
    ts.pts_vs_champion,
    ts.pts_vs_ucl_cutoff,

    -- xG (available from hist_xg for 2021-22 to 2023-24)
    ts.xg,
    ts.xga,
    ts.xgd,

    -- xPts (from understat match-level xpts, available for seasons with match data)
    sx.xpts,

    -- provenance
    ts.standings_source,
    ts.xg_source

FROM staged.stg_team_season ts
LEFT JOIN season_xpts_agg sx
    ON  sx.season_key = ts.season_key
    AND sx.team_key   = ts.team_key
ORDER BY ts.season_key DESC, ts.table_rank ASC;
