-- =============================================================================
-- TRANSFORM: stg_team_season
-- Sources:
--   Primary:    raw.sofascore_standings  (completed seasons)
--   Supplement: raw.fd_standings         (current/live season where sofascore fails)
-- Grain: one row per team per season
--
-- Logic:
--   1. Sofascore standings → outcomes for completed seasons
--   2. fd_standings → latest snapshot for any season not covered by sofascore
--   3. hist_xg → join xG data for seasons 2021-22 through 2023-24
--   4. Compute: table_rank, pts_per_match, pts_vs_champion, pts_vs_ucl_cutoff
--   5. Normalize team names via team_name_map
-- =============================================================================

TRUNCATE staged.stg_team_season;

-- ============================================================
-- Source 1: Sofascore (completed seasons)
-- ============================================================
WITH

sofascore AS (
    SELECT
        ds.season_key,
        ds.ucl_slot_rank,
        tnm.team_key,
        ss.mp,
        ss.w,
        ss.d,
        ss.l,
        ss.gf,
        ss.ga,
        ss.gd,
        ss.pts,
        ROUND(ss.pts::NUMERIC / NULLIF(ss.mp, 0), 3)    AS pts_per_match
    FROM raw.sofascore_standings ss
    JOIN staged.team_name_map tnm ON tnm.raw_name = ss.team
    JOIN staged.dim_season ds     ON ds.season_code = ss.season
),

ranked AS (
    SELECT
        *,
        RANK() OVER (PARTITION BY season_key ORDER BY pts DESC, gd DESC, gf DESC)
            AS table_rank
    FROM sofascore
),

benchmarks AS (
    SELECT
        season_key,
        ucl_slot_rank,
        MAX(pts)                                          AS rank1_pts,
        MAX(CASE WHEN table_rank = ucl_slot_rank
                 THEN pts END)                           AS ucl_cutoff_pts
    FROM ranked
    GROUP BY season_key, ucl_slot_rank
),

xg AS (
    SELECT
        CASE hx.season
            WHEN '2021-22' THEN '2021-22'
            WHEN '2022-23' THEN '2022-23'
            WHEN '2023-24' THEN '2023-24'
        END                                              AS season_key,
        COALESCE(tnm.team_key, hx.team)                 AS team_key,
        hx.xg,
        hx.xga,
        hx.xgd
    FROM raw.hist_xg hx
    LEFT JOIN staged.team_name_map tnm ON tnm.raw_name = hx.team
)

INSERT INTO staged.stg_team_season (
    season_key, team_key,
    mp, w, d, l, gf, ga, gd, pts, pts_per_match,
    table_rank,
    ucl_cutoff_rank, champion_pts, ucl_cutoff_pts,
    pts_vs_champion, pts_vs_ucl_cutoff,
    xg, xga, xgd,
    standings_source, xg_source
)
SELECT
    r.season_key,
    r.team_key,
    r.mp, r.w, r.d, r.l, r.gf, r.ga, r.gd, r.pts, r.pts_per_match,
    r.table_rank,
    b.ucl_slot_rank,
    b.rank1_pts                                          AS champion_pts,
    b.ucl_cutoff_pts,
    r.pts - b.rank1_pts                                  AS pts_vs_champion,
    r.pts - b.ucl_cutoff_pts                             AS pts_vs_ucl_cutoff,
    x.xg,
    x.xga,
    x.xgd,
    'sofascore'                                          AS standings_source,
    CASE WHEN x.xg IS NOT NULL THEN 'hist_xg' END        AS xg_source
FROM ranked r
JOIN benchmarks b ON b.season_key = r.season_key
LEFT JOIN xg x
    ON x.season_key = r.season_key
    AND x.team_key  = r.team_key;

-- ============================================================
-- Source 2: football-data.org standings
-- Supplements sofascore for any season not already inserted
-- (primarily for the live 2025-26 season where sofascore fails)
-- Uses the latest matchday snapshot available per team.
-- ============================================================
WITH

fd_latest AS (
    -- Pick the most recent matchday snapshot per team-season
    SELECT DISTINCT ON (fds.season, fds.team_id)
        ds.season_key,
        ds.ucl_slot_rank,
        tnm.team_key,
        fds.played_games                                 AS mp,
        fds.won                                          AS w,
        fds.draw                                         AS d,
        fds.lost                                         AS l,
        fds.goals_for                                    AS gf,
        fds.goals_against                                AS ga,
        fds.goal_difference                              AS gd,
        fds.points                                       AS pts,
        ROUND(fds.points::NUMERIC / NULLIF(fds.played_games, 0), 3) AS pts_per_match
    FROM raw.fd_standings fds
    JOIN staged.team_name_map tnm ON tnm.raw_name = fds.team_name
    JOIN staged.dim_season ds     ON ds.season_code = fds.season
    -- Only consider seasons not already populated from sofascore
    WHERE NOT EXISTS (
        SELECT 1 FROM staged.stg_team_season sts
        WHERE sts.season_key = ds.season_key
    )
    ORDER BY fds.season, fds.team_id, fds.matchday DESC
),

fd_ranked AS (
    SELECT
        *,
        RANK() OVER (PARTITION BY season_key ORDER BY pts DESC, gd DESC, gf DESC)
            AS table_rank
    FROM fd_latest
),

fd_benchmarks AS (
    SELECT
        season_key,
        ucl_slot_rank,
        MAX(pts)                                         AS rank1_pts,
        MAX(CASE WHEN table_rank = ucl_slot_rank
                 THEN pts END)                           AS ucl_cutoff_pts
    FROM fd_ranked
    GROUP BY season_key, ucl_slot_rank
)

INSERT INTO staged.stg_team_season (
    season_key, team_key,
    mp, w, d, l, gf, ga, gd, pts, pts_per_match,
    table_rank,
    ucl_cutoff_rank, champion_pts, ucl_cutoff_pts,
    pts_vs_champion, pts_vs_ucl_cutoff,
    xg, xga, xgd,
    standings_source, xg_source
)
SELECT
    r.season_key,
    r.team_key,
    r.mp, r.w, r.d, r.l, r.gf, r.ga, r.gd, r.pts, r.pts_per_match,
    r.table_rank,
    b.ucl_slot_rank,
    b.rank1_pts                                          AS champion_pts,
    b.ucl_cutoff_pts,
    r.pts - b.rank1_pts                                  AS pts_vs_champion,
    r.pts - b.ucl_cutoff_pts                             AS pts_vs_ucl_cutoff,
    NULL                                                 AS xg,
    NULL                                                 AS xga,
    NULL                                                 AS xgd,
    'football_data'                                      AS standings_source,
    NULL                                                 AS xg_source
FROM fd_ranked r
JOIN fd_benchmarks b ON b.season_key = r.season_key
ON CONFLICT (season_key, team_key) DO NOTHING;
