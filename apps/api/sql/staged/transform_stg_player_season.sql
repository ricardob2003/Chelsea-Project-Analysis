-- =============================================================================
-- TRANSFORM: stg_player_season
-- Source: raw.understat_player_season
-- Grain: one row per player per team per season
--
-- Logic:
--   1. Map raw season_code to correct season_key via match date evidence
--      (raw.understat_player_season season_code '2021' = 2020-21 data)
--   2. Normalize team names to canonical keys
--   3. Derive canonical position_group from Understat position codes
--   4. Compute per90 metrics (only where minutes > 0)
--   5. Flag sample confidence (>=900 min = high, 600-899 = eligible, <600 = low)
--   6. Compute availability_rate vs team's total matches that season
-- =============================================================================

TRUNCATE staged.stg_player_season;

WITH

-- Correct season_key mapping for Understat player_season
-- Understat codes by END year: '2021' = 2020-21, '2122' = 2021-22, etc.
-- Based on match date evidence from stg_match
season_map AS (
    SELECT season_code, season_key FROM staged.dim_season
),

-- Team match counts per season (for availability_rate denominator)
team_mp AS (
    SELECT
        season_key,
        home_team_key                   AS team_key,
        COUNT(*)                        AS mp
    FROM staged.stg_match
    GROUP BY season_key, home_team_key
),

-- Core player data with team and season resolution
base AS (
    SELECT
        ups.player_id,
        ups.player_name,
        tnm.team_key,
        sm.season_key,
        ups.position                    AS position_raw,
        -- Position group from Understat codes
        -- Understat encodes positions as space-separated flags: D M F GK S
        -- S = substitute (append), not a position
        -- First meaningful code determines group
        CASE
            WHEN ups.position LIKE '%GK%'               THEN 'GK'
            WHEN ups.position ~ '^D( |$)'
              OR ups.position ~ ' D( |$)'               THEN 'DEF'
            WHEN ups.position ~ '^D M'
              OR ups.position = 'D M S'                 THEN 'MID'
            WHEN ups.position ~ '^M'
              OR ups.position = 'M S'
              OR ups.position = 'M'                     THEN 'MID'
            WHEN ups.position ~ '^F'
              OR ups.position ~ 'F M'
              OR ups.position = 'F S'                   THEN 'FWD'
            WHEN ups.position = 'S'                     THEN NULL  -- pure sub, no starts
            ELSE NULL
        END                             AS position_group,
        ups.matches,
        ups.minutes,
        ups.goals,
        ups.assists,
        ups.shots,
        ups.key_passes,
        ups.xg,
        ups.np_xg,
        ups.xa,
        ups.xg_chain,
        ups.xg_buildup,
        ups.yellow_cards,
        ups.red_cards
    FROM raw.understat_player_season ups
    JOIN season_map sm  ON sm.season_code = ups.season
    LEFT JOIN staged.team_name_map tnm ON tnm.raw_name = ups.team
    WHERE tnm.team_key IS NOT NULL
),

-- Compute per90s and flags
enriched AS (
    SELECT
        b.*,
        -- Availability rate: player minutes / (team_mp * 90)
        ROUND(
            b.minutes::NUMERIC / NULLIF(tm.mp * 90, 0),
        4)                              AS availability_rate,
        -- Sample confidence flag
        CASE
            WHEN b.minutes >= 900  THEN 'high'
            WHEN b.minutes >= 600  THEN 'eligible'
            ELSE                        'low'
        END                             AS sample_confidence,
        -- Per 90 metrics (NULL if no minutes)
        CASE WHEN b.minutes > 0 THEN ROUND(b.goals::NUMERIC    / b.minutes * 90, 3) END AS g_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.assists::NUMERIC  / b.minutes * 90, 3) END AS a_per90,
        CASE WHEN b.minutes > 0 THEN ROUND((b.goals + b.assists)::NUMERIC / b.minutes * 90, 3) END AS g_plus_a_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.xg::NUMERIC       / b.minutes * 90, 3) END AS xg_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.np_xg::NUMERIC    / b.minutes * 90, 3) END AS np_xg_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.xa::NUMERIC       / b.minutes * 90, 3) END AS xa_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.shots::NUMERIC    / b.minutes * 90, 3) END AS shots_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.key_passes::NUMERIC / b.minutes * 90, 3) END AS key_passes_per90,
        CASE WHEN b.minutes > 0 THEN ROUND(b.xg_chain::NUMERIC / b.minutes * 90, 3) END AS xg_chain_per90
    FROM base b
    LEFT JOIN team_mp tm
        ON  tm.season_key = b.season_key
        AND tm.team_key   = b.team_key
)

INSERT INTO staged.stg_player_season (
    player_id, player_name, team_key, season_key,
    position_raw, position_group,
    matches, minutes, availability_rate, sample_confidence,
    goals, assists, shots, key_passes,
    xg, np_xg, xa, xg_chain, xg_buildup,
    yellow_cards, red_cards,
    g_per90, a_per90, g_plus_a_per90,
    xg_per90, np_xg_per90, xa_per90,
    shots_per90, key_passes_per90, xg_chain_per90
)
SELECT
    player_id, player_name, team_key, season_key,
    position_raw, position_group,
    matches, minutes, availability_rate, sample_confidence,
    goals, assists, shots, key_passes,
    xg, np_xg, xa, xg_chain, xg_buildup,
    yellow_cards, red_cards,
    g_per90, a_per90, g_plus_a_per90,
    xg_per90, np_xg_per90, xa_per90,
    shots_per90, key_passes_per90, xg_chain_per90
FROM enriched;
