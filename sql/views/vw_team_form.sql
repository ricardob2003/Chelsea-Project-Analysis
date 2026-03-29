-- =============================================================================
-- VIEW: vw_team_form
-- Source: staged.stg_match, staged.stg_team_season, staged.dim_season
-- Grain: one row per team per match
--
-- Focus teams:
--   - Traditional top 6 (always included regardless of season finish):
--       Arsenal, Chelsea, Liverpool, Manchester City, Manchester United, Tottenham
--   - Actual top 6 per season (dynamic — catches strong seasons from other teams)
--
-- Metric tracks:
--   - Per-match:   raw outcomes + xG story columns
--   - Rolling 5:   5-match moving averages (form snapshot)
--   - Cumulative:  running season totals (season arc — plot across matchday 1→38)
--
-- xG story columns:
--   xg_conversion_gap    = xg - goals_for       (per match, positive = underperforming xG)
--   luck_gap             = xpts - points         (per match, positive = deserved more than result)
--   cumul_xg_overperf    = SUM(xg - gf) season   (positive = consistent conversion underperformance)
--   cumul_luck_gap       = SUM(xpts - pts) season (positive = results consistently below quality)
-- =============================================================================

CREATE OR REPLACE VIEW views.vw_team_form AS

WITH

-- Traditional top 6 — always included in every season
traditional_top6 (team_key) AS (
    VALUES
        ('Arsenal'),
        ('Chelsea'),
        ('Liverpool'),
        ('Manchester City'),
        ('Manchester United'),
        ('Tottenham')
),

-- Focus teams per season: traditional top 6 + actual top 6 (union, no duplicates)
focus_teams AS (
    -- Traditional top 6 cross-joined to every season with data
    SELECT ds.season_key, t.team_key
    FROM staged.dim_season ds
    CROSS JOIN traditional_top6 t

    UNION

    -- Actual top 6 per season (catches non-traditional teams e.g. Newcastle 2022-23)
    SELECT season_key, team_key
    FROM staged.stg_team_season
    WHERE table_rank <= 6
),

-- Unpivot stg_match to one row per team per match
team_matches AS (

    -- Home perspective
    SELECT
        game_id,
        season_key,
        match_date,
        matchday,
        home_team_key           AS team_key,
        away_team_key           AS opponent_key,
        TRUE                    AS is_home,
        home_goals              AS goals_for,
        away_goals              AS goals_against,
        home_goals - away_goals AS goal_diff,
        home_points             AS points,
        home_xg                 AS xg,
        away_xg                 AS xg_against,
        home_np_xg              AS np_xg,
        away_np_xg              AS np_xg_against,
        home_xpts               AS xpts,
        home_ppda               AS ppda,
        home_deep               AS deep
    FROM staged.stg_match

    UNION ALL

    -- Away perspective
    SELECT
        game_id,
        season_key,
        match_date,
        matchday,
        away_team_key           AS team_key,
        home_team_key           AS opponent_key,
        FALSE                   AS is_home,
        away_goals              AS goals_for,
        home_goals              AS goals_against,
        away_goals - home_goals AS goal_diff,
        away_points             AS points,
        away_xg                 AS xg,
        home_xg                 AS xg_against,
        away_np_xg              AS np_xg,
        home_np_xg              AS np_xg_against,
        away_xpts               AS xpts,
        away_ppda               AS ppda,
        away_deep               AS deep
    FROM staged.stg_match
),

-- Restrict to focus teams only
focus AS (
    SELECT tm.*
    FROM team_matches tm
    JOIN focus_teams ft
        ON  ft.season_key = tm.season_key
        AND ft.team_key   = tm.team_key
),

-- Compute rolling and cumulative metrics via window functions
enriched AS (
    SELECT
        game_id,
        season_key,
        match_date,
        matchday,
        team_key,
        opponent_key,
        is_home,

        -- per-match outcomes
        goals_for,
        goals_against,
        goal_diff,
        points,
        xg,
        xg_against,
        np_xg,
        np_xg_against,
        xpts,
        ppda,
        deep,

        -- per-match xG story
        ROUND((xg - xg_against)::NUMERIC,  4)  AS xgd,
        ROUND((xg - goals_for)::NUMERIC,   4)  AS xg_conversion_gap,  -- positive = creating but not finishing
        ROUND((xpts - points)::NUMERIC,    4)  AS luck_gap,           -- positive = deserved more than result

        -- rolling 5-match form
        ROUND(AVG(points)           OVER w5, 3) AS rolling_pts_5,
        ROUND(AVG(xg)               OVER w5, 3) AS rolling_xg_5,
        ROUND(AVG(xg_against)       OVER w5, 3) AS rolling_xga_5,
        ROUND(AVG(goal_diff)        OVER w5, 3) AS rolling_gd_5,
        ROUND(AVG(xg - xg_against)  OVER w5, 3) AS rolling_xgd_5,

        -- cumulative season totals (season arc — for line chart across matchday 1→38)
        SUM(points)                 OVER ws      AS cumul_pts,
        SUM(goals_for)              OVER ws      AS cumul_gf,
        SUM(goals_against)          OVER ws      AS cumul_ga,
        ROUND(SUM(xg)               OVER ws, 3)  AS cumul_xg,
        ROUND(SUM(xg_against)       OVER ws, 3)  AS cumul_xga,
        ROUND(SUM(xpts)             OVER ws, 3)  AS cumul_xpts,

        -- cumulative xG story divergence lines
        ROUND(SUM(xg - goals_for)   OVER ws, 3)  AS cumul_xg_overperf,  -- positive = consistent underconversion
        ROUND(SUM(xpts - points)    OVER ws, 3)  AS cumul_luck_gap       -- positive = quality not reflected in results

    FROM focus
    WINDOW
        -- rolling 5: current match + 4 preceding (ordered by matchday within team-season)
        w5 AS (
            PARTITION BY team_key, season_key
            ORDER BY matchday
            ROWS BETWEEN 4 PRECEDING AND CURRENT ROW
        ),
        -- cumulative: all matches from start of season up to and including current
        ws AS (
            PARTITION BY team_key, season_key
            ORDER BY matchday
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )
)

SELECT *
FROM enriched
ORDER BY season_key DESC, team_key, matchday;
