-- =============================================================================
-- VIEW: vw_team_season_summary
-- Source: staged.stg_team_season
-- Grain: one row per team per season
--
-- Purpose: League table outcomes + xG context for every team-season.
-- Used by: /api/team-summary endpoint → League History, KPI cards
-- =============================================================================

CREATE OR REPLACE VIEW views.vw_team_season_summary AS
SELECT
    season_key,
    team_key,

    -- league table
    table_rank,
    mp, w, d, l,
    gf, ga, gd,
    pts,
    pts_per_match,

    -- benchmark context
    ucl_cutoff_rank,
    champion_pts,
    ucl_cutoff_pts,
    pts_vs_champion,
    pts_vs_ucl_cutoff,

    -- xG (available from hist_xg for 2021-22 to 2023-24)
    xg,
    xga,
    xgd,

    -- provenance
    standings_source,
    xg_source

FROM staged.stg_team_season
ORDER BY season_key DESC, table_rank ASC;
