-- =============================================================================
-- STAGED SCHEMA DDL
-- Layer: staged
-- Purpose: Clean, normalize, and standardize raw data. Apply business rules.
--          Single source of truth for canonical team names, season keys,
--          position groups, and derived fields.
--
-- Design rules:
--   - Canonical team names are established here and enforced downstream
--   - Season keys follow the format 'YYYY-YY' (e.g. '2022-23')
--   - Position groups: GK | DEF | MID | FWD
--   - All per90 metrics derived here, not in mart
--   - TRUNCATE + INSERT pattern (full refresh per run)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS staged;

-- =============================================================================
-- LOOKUP TABLES (seeded once, updated manually)
-- =============================================================================

-- Canonical season definitions
-- UCL slot rule: 4 spots until 2023-24 reform, 5 from 2024-25 onward
CREATE TABLE IF NOT EXISTS staged.dim_season (
    season_key          TEXT        PRIMARY KEY,  -- '2022-23'
    season_code         TEXT        NOT NULL,     -- '2223' (used in raw tables)
    season_start_year   INT         NOT NULL,
    season_end_year     INT         NOT NULL,
    ucl_slot_rank       INT         NOT NULL,     -- qualifying rank threshold
    is_complete         BOOLEAN     NOT NULL DEFAULT FALSE,
    notes               TEXT
);

-- Canonical team identity
CREATE TABLE IF NOT EXISTS staged.dim_team (
    team_key            TEXT        PRIMARY KEY   -- canonical name e.g. 'Manchester City'
);

-- Team name aliases — maps raw source names to canonical team_key
CREATE TABLE IF NOT EXISTS staged.team_name_map (
    raw_name            TEXT        PRIMARY KEY,
    team_key            TEXT        NOT NULL REFERENCES staged.dim_team(team_key)
);

-- =============================================================================
-- STAGED FACT TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS staged.stg_team_season (
    season_key          TEXT        NOT NULL,
    team_key            TEXT        NOT NULL,

    -- outcomes
    mp                  INT,
    w                   INT,
    d                   INT,
    l                   INT,
    gf                  INT,
    ga                  INT,
    gd                  INT,
    pts                 INT,
    pts_per_match       NUMERIC(5,3),
    table_rank          INT,

    -- home/away (available from Sofascore)
    home_w              INT,
    home_d              INT,
    home_l              INT,
    home_gf             INT,
    home_ga             INT,
    away_w              INT,
    away_d              INT,
    away_l              INT,
    away_gf             INT,
    away_ga             INT,
    home_pts            INT,
    away_pts            INT,
    home_pts_per_match  NUMERIC(5,3),
    away_pts_per_match  NUMERIC(5,3),

    -- xG (from hist_xg where available)
    xg                  NUMERIC(6,2),
    xga                 NUMERIC(6,2),
    xgd                 NUMERIC(6,2),

    -- benchmark gaps (computed vs champion and UCL cutoff)
    ucl_cutoff_rank     INT,
    champion_pts        INT,
    ucl_cutoff_pts      INT,
    pts_vs_champion     INT,
    pts_vs_ucl_cutoff   INT,

    -- source tracking
    standings_source    TEXT,   -- 'sofascore' | 'hist_team_season'
    xg_source           TEXT,   -- 'hist_xg' | null

    _loaded_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (season_key, team_key)
);

CREATE TABLE IF NOT EXISTS staged.stg_match (
    game_id             INT         NOT NULL,
    season_key          TEXT        NOT NULL,
    match_date          DATE        NOT NULL,

    home_team_key       TEXT        NOT NULL,
    away_team_key       TEXT        NOT NULL,
    home_goals          INT,
    away_goals          INT,
    home_points         INT,    -- 3/1/0
    away_points         INT,

    -- xG
    home_xg             NUMERIC(6,4),
    away_xg             NUMERIC(6,4),
    home_np_xg          NUMERIC(6,4),
    away_np_xg          NUMERIC(6,4),
    home_xg_diff        NUMERIC(6,4),   -- xg - np_xg_difference
    away_xg_diff        NUMERIC(6,4),

    -- pressing / chance creation
    home_ppda           NUMERIC(8,4),
    away_ppda           NUMERIC(8,4),
    home_deep           INT,
    away_deep           INT,

    -- expected points
    home_xpts           NUMERIC(6,4),
    away_xpts           NUMERIC(6,4),

    -- derived
    matchday            INT,    -- sequential within season (1..38)

    _loaded_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (game_id)
);

CREATE TABLE IF NOT EXISTS staged.stg_player_season (
    player_id           INT         NOT NULL,
    player_name         TEXT        NOT NULL,
    team_key            TEXT        NOT NULL,
    season_key          TEXT        NOT NULL,

    -- position
    position_raw        TEXT,
    position_group      TEXT,   -- GK | DEF | MID | FWD

    -- playing time
    matches             INT,
    minutes             INT,
    availability_rate   NUMERIC(5,4),   -- minutes / (team_mp * 90)
    sample_confidence   TEXT,   -- 'high' (>=900) | 'eligible' (600-899) | 'low' (<600)

    -- output (season totals)
    goals               INT,
    assists             INT,
    shots               INT,
    key_passes          INT,
    xg                  NUMERIC(8,4),
    np_xg               NUMERIC(8,4),
    xa                  NUMERIC(8,4),
    xg_chain            NUMERIC(8,4),
    xg_buildup          NUMERIC(8,4),
    yellow_cards        INT,
    red_cards           INT,

    -- per 90 metrics (primary analytical grain)
    g_per90             NUMERIC(6,3),
    a_per90             NUMERIC(6,3),
    g_plus_a_per90      NUMERIC(6,3),
    xg_per90            NUMERIC(6,3),
    np_xg_per90         NUMERIC(6,3),
    xa_per90            NUMERIC(6,3),
    shots_per90         NUMERIC(6,3),
    key_passes_per90    NUMERIC(6,3),
    xg_chain_per90      NUMERIC(6,3),

    _loaded_at          TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (player_id, team_key, season_key)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_stg_team_season_team   ON staged.stg_team_season (team_key);
CREATE INDEX IF NOT EXISTS idx_stg_team_season_season ON staged.stg_team_season (season_key);
CREATE INDEX IF NOT EXISTS idx_stg_match_season       ON staged.stg_match (season_key);
CREATE INDEX IF NOT EXISTS idx_stg_match_home         ON staged.stg_match (home_team_key, season_key);
CREATE INDEX IF NOT EXISTS idx_stg_match_away         ON staged.stg_match (away_team_key, season_key);
CREATE INDEX IF NOT EXISTS idx_stg_player_season      ON staged.stg_player_season (season_key, team_key);
CREATE INDEX IF NOT EXISTS idx_stg_player_pos_group   ON staged.stg_player_season (season_key, position_group);
