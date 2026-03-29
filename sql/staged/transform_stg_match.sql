-- =============================================================================
-- TRANSFORM: stg_match
-- Source: raw.understat_matches
-- Grain: one row per match
--
-- Logic:
--   1. Derive season_key from match_date (authoritative — ignores raw season_code)
--   2. Normalize team names to canonical keys
--   3. Derive home_points / away_points from goals
--   4. Derive matchday as sequential rank within (season, home_team)
-- =============================================================================

TRUNCATE staged.stg_match;

WITH

-- Map raw team names to canonical and resolve season from match date
base AS (
    SELECT
        um.game_id,
        um.match_date::DATE                         AS match_date,
        -- Derive season from date (PL seasons run Aug-May)
        CASE
            WHEN um.match_date::DATE BETWEEN '2019-08-01' AND '2020-07-31' THEN '2019-20'
            WHEN um.match_date::DATE BETWEEN '2020-08-01' AND '2021-07-31' THEN '2020-21'
            WHEN um.match_date::DATE BETWEEN '2021-08-01' AND '2022-07-31' THEN '2021-22'
            WHEN um.match_date::DATE BETWEEN '2022-08-01' AND '2023-07-31' THEN '2022-23'
            WHEN um.match_date::DATE BETWEEN '2023-08-01' AND '2024-07-31' THEN '2023-24'
            WHEN um.match_date::DATE BETWEEN '2024-08-01' AND '2025-07-31' THEN '2024-25'
            WHEN um.match_date::DATE BETWEEN '2025-08-01' AND '2026-07-31' THEN '2025-26'
        END                                         AS season_key,
        ht.team_key                                 AS home_team_key,
        at.team_key                                 AS away_team_key,
        um.home_goals,
        um.away_goals,
        um.home_xg,
        um.away_xg,
        um.home_np_xg,
        um.away_np_xg,
        um.home_np_xg_diff,
        um.away_np_xg_diff,
        um.home_ppda,
        um.away_ppda,
        um.home_deep,
        um.away_deep,
        um.home_xpts,
        um.away_xpts
    FROM raw.understat_matches um
    LEFT JOIN staged.team_name_map ht ON ht.raw_name = um.home_team
    LEFT JOIN staged.team_name_map at ON at.raw_name = um.away_team
    WHERE um.home_goals IS NOT NULL   -- only completed matches
),

-- Derive points from goals
with_points AS (
    SELECT
        *,
        CASE
            WHEN home_goals > away_goals THEN 3
            WHEN home_goals = away_goals THEN 1
            ELSE 0
        END AS home_points,
        CASE
            WHEN away_goals > home_goals THEN 3
            WHEN away_goals = home_goals THEN 1
            ELSE 0
        END AS away_points
    FROM base
    WHERE season_key IS NOT NULL
          AND home_team_key IS NOT NULL
          AND away_team_key IS NOT NULL
),

-- Derive matchday as sequential match number within season per team
-- (rank by date within each team's home matches)
matchdays AS (
    SELECT
        game_id,
        RANK() OVER (
            PARTITION BY season_key, home_team_key
            ORDER BY match_date
        ) AS matchday
    FROM with_points
)

INSERT INTO staged.stg_match (
    game_id, season_key, match_date,
    home_team_key, away_team_key,
    home_goals, away_goals, home_points, away_points,
    home_xg, away_xg, home_np_xg, away_np_xg,
    home_xg_diff, away_xg_diff,
    home_ppda, away_ppda, home_deep, away_deep,
    home_xpts, away_xpts, matchday
)
SELECT
    p.game_id, p.season_key, p.match_date,
    p.home_team_key, p.away_team_key,
    p.home_goals, p.away_goals, p.home_points, p.away_points,
    p.home_xg, p.away_xg, p.home_np_xg, p.away_np_xg,
    p.home_np_xg_diff, p.away_np_xg_diff,
    p.home_ppda, p.away_ppda, p.home_deep, p.away_deep,
    p.home_xpts, p.away_xpts,
    md.matchday
FROM with_points p
JOIN matchdays md ON md.game_id = p.game_id;
