-- =============================================================================
-- VIEW: vw_recruitment_priority
-- Sources: staged.stg_player_season, staged.stg_team_season
-- Grain: one row per position_group per season
--
-- Purpose: Compare Chelsea's per-position per90 averages against the top-4
--          average for the same season. Gaps surface recruitment priorities.
--
-- Logic:
--   1. Identify top-4 teams per season via stg_team_season.table_rank
--   2. Filter to players with >= 600 min (eligible sample confidence)
--   3. Aggregate Chelsea and top-4 averages per position group per season
--   4. Compute gap columns (Chelsea minus top4 — negative = Chelsea behind)
-- =============================================================================

CREATE OR REPLACE VIEW views.vw_recruitment_priority AS

WITH

-- Top-4 teams per season (dynamic — changes each year)
top4 AS (
    SELECT season_key, team_key
    FROM staged.stg_team_season
    WHERE table_rank <= 4
),

-- All eligible players tagged with Chelsea / top-4 membership
players AS (
    SELECT
        ps.season_key,
        ps.position_group,
        ps.team_key,
        ps.minutes,
        ps.xg_per90,
        ps.np_xg_per90,
        ps.xa_per90,
        ps.shots_per90,
        ps.key_passes_per90,
        ps.xg_chain_per90,
        ps.g_per90,
        ps.a_per90,
        ps.g_plus_a_per90,
        (ps.team_key = 'Chelsea')                           AS is_chelsea,
        (t4.team_key IS NOT NULL)                           AS is_top4
    FROM staged.stg_player_season ps
    LEFT JOIN top4 t4
        ON  t4.season_key = ps.season_key
        AND t4.team_key   = ps.team_key
    WHERE ps.position_group IS NOT NULL
      AND ps.minutes >= 600   -- eligible or high confidence only
),

chelsea_agg AS (
    SELECT
        season_key,
        position_group,
        COUNT(*)                                AS chelsea_players,
        ROUND(AVG(xg_per90),         3)         AS chelsea_xg_per90,
        ROUND(AVG(np_xg_per90),      3)         AS chelsea_np_xg_per90,
        ROUND(AVG(xa_per90),         3)         AS chelsea_xa_per90,
        ROUND(AVG(shots_per90),      3)         AS chelsea_shots_per90,
        ROUND(AVG(key_passes_per90), 3)         AS chelsea_kp_per90,
        ROUND(AVG(xg_chain_per90),   3)         AS chelsea_xg_chain_per90,
        ROUND(AVG(g_per90),          3)         AS chelsea_g_per90,
        ROUND(AVG(a_per90),          3)         AS chelsea_a_per90,
        ROUND(AVG(g_plus_a_per90),   3)         AS chelsea_g_plus_a_per90
    FROM players
    WHERE is_chelsea
    GROUP BY season_key, position_group
),

top4_agg AS (
    SELECT
        season_key,
        position_group,
        COUNT(*)                                AS top4_players,
        ROUND(AVG(xg_per90),         3)         AS top4_xg_per90,
        ROUND(AVG(np_xg_per90),      3)         AS top4_np_xg_per90,
        ROUND(AVG(xa_per90),         3)         AS top4_xa_per90,
        ROUND(AVG(shots_per90),      3)         AS top4_shots_per90,
        ROUND(AVG(key_passes_per90), 3)         AS top4_kp_per90,
        ROUND(AVG(xg_chain_per90),   3)         AS top4_xg_chain_per90,
        ROUND(AVG(g_per90),          3)         AS top4_g_per90,
        ROUND(AVG(a_per90),          3)         AS top4_a_per90,
        ROUND(AVG(g_plus_a_per90),   3)         AS top4_g_plus_a_per90
    FROM players
    WHERE is_top4
    GROUP BY season_key, position_group
)

SELECT
    c.season_key,
    c.position_group,

    -- Chelsea averages
    c.chelsea_players,
    c.chelsea_xg_per90,
    c.chelsea_np_xg_per90,
    c.chelsea_xa_per90,
    c.chelsea_shots_per90,
    c.chelsea_kp_per90,
    c.chelsea_xg_chain_per90,
    c.chelsea_g_per90,
    c.chelsea_a_per90,
    c.chelsea_g_plus_a_per90,

    -- Top-4 benchmarks
    t.top4_players,
    t.top4_xg_per90,
    t.top4_np_xg_per90,
    t.top4_xa_per90,
    t.top4_shots_per90,
    t.top4_kp_per90,
    t.top4_xg_chain_per90,
    t.top4_g_per90,
    t.top4_a_per90,
    t.top4_g_plus_a_per90,

    -- Gaps (Chelsea minus top-4 — negative = Chelsea behind benchmark)
    ROUND(c.chelsea_xg_per90         - t.top4_xg_per90,         3) AS gap_xg_per90,
    ROUND(c.chelsea_np_xg_per90      - t.top4_np_xg_per90,      3) AS gap_np_xg_per90,
    ROUND(c.chelsea_xa_per90         - t.top4_xa_per90,         3) AS gap_xa_per90,
    ROUND(c.chelsea_shots_per90      - t.top4_shots_per90,      3) AS gap_shots_per90,
    ROUND(c.chelsea_kp_per90         - t.top4_kp_per90,         3) AS gap_kp_per90,
    ROUND(c.chelsea_xg_chain_per90   - t.top4_xg_chain_per90,   3) AS gap_xg_chain_per90,
    ROUND(c.chelsea_g_per90          - t.top4_g_per90,          3) AS gap_g_per90,
    ROUND(c.chelsea_a_per90          - t.top4_a_per90,          3) AS gap_a_per90,
    ROUND(c.chelsea_g_plus_a_per90   - t.top4_g_plus_a_per90,   3) AS gap_g_plus_a_per90

FROM chelsea_agg c
LEFT JOIN top4_agg t USING (season_key, position_group)
ORDER BY c.season_key DESC, c.position_group;
