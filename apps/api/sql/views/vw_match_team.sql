-- =============================================================================
-- VIEW: vw_match_team
-- Source: staged.stg_match
-- Grain: one row per team per match (home + away unpivoted)
--
-- Purpose: Match-level team stats from both perspectives.
-- Used by: /api/match-team endpoint → rolling form, match timeline
-- =============================================================================

CREATE OR REPLACE VIEW views.vw_match_team AS

-- Home perspective
SELECT
    game_id,
    season_key,
    match_date,
    matchday,
    home_team_key       AS team_key,
    away_team_key       AS opponent_key,
    TRUE                AS is_home,
    home_goals          AS goals_for,
    away_goals          AS goals_against,
    home_points         AS points,
    home_xg             AS xg,
    away_xg             AS xg_against,
    home_np_xg          AS np_xg,
    away_np_xg          AS np_xg_against,
    home_xg_diff        AS np_xg_diff,
    home_ppda           AS ppda,
    away_ppda           AS opp_ppda,
    home_deep           AS deep,
    away_deep           AS opp_deep,
    home_xpts           AS xpts
FROM staged.stg_match

UNION ALL

-- Away perspective
SELECT
    game_id,
    season_key,
    match_date,
    matchday,
    away_team_key       AS team_key,
    home_team_key       AS opponent_key,
    FALSE               AS is_home,
    away_goals          AS goals_for,
    home_goals          AS goals_against,
    away_points         AS points,
    away_xg             AS xg,
    home_xg             AS xg_against,
    away_np_xg          AS np_xg,
    home_np_xg          AS np_xg_against,
    away_xg_diff        AS np_xg_diff,
    away_ppda           AS ppda,
    home_ppda           AS opp_ppda,
    away_deep           AS deep,
    home_deep           AS opp_deep,
    away_xpts           AS xpts
FROM staged.stg_match

ORDER BY season_key DESC, match_date DESC;
