-- =============================================================================
-- RAW SCHEMA DDL
-- Layer: raw
-- Purpose: Land source data exactly as received. No transformation, no business
--          logic. One table per source per entity type.
--
-- Design rules:
--   - Every table has _loaded_at and _batch_id for lineage tracking
--   - Natural keys have UNIQUE constraints for ON CONFLICT DO NOTHING upserts
--   - All source values stored as-is (TEXT for IDs, original numeric types)
--   - No foreign keys at this layer
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS raw;

-- =============================================================================
-- INGESTION CONTROL
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.ingestion_log (
    id              SERIAL PRIMARY KEY,
    source          TEXT        NOT NULL,  -- 'football_data' | 'understat' | 'fbref' | 'historical_csv'
    entity          TEXT        NOT NULL,  -- 'matches' | 'standings' | 'player_match_stats' | etc.
    season          TEXT,                  -- '2024-25' | NULL for cross-season sources
    last_matchday   INT,                   -- last matchday successfully loaded (matchday-based sources)
    last_game_id    INT,                   -- last game_id loaded (game-id-based sources)
    last_loaded_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    rows_inserted   INT         NOT NULL DEFAULT 0,
    status          TEXT        NOT NULL DEFAULT 'success', -- 'success' | 'partial' | 'failed'
    error_message   TEXT
);

-- =============================================================================
-- SOURCE A: FOOTBALL-DATA.ORG
-- Grain: match-level and season-level
-- Incremental key: matchday + season
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.fd_matches (
    -- natural key
    match_id            INT         NOT NULL,
    season              TEXT        NOT NULL,  -- '2024-25'

    -- match metadata
    matchday            INT,
    status              TEXT,                  -- 'FINISHED' | 'SCHEDULED' | 'POSTPONED' | etc.
    match_date          TIMESTAMP,
    competition_id      INT,
    competition_name    TEXT,

    -- teams
    home_team_id        INT,
    home_team_name      TEXT,
    away_team_id        INT,
    away_team_name      TEXT,

    -- result
    home_score          INT,
    away_score          INT,
    winner              TEXT,                  -- 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | NULL

    -- lineage
    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (match_id)
);

CREATE TABLE IF NOT EXISTS raw.fd_standings (
    -- natural key
    season              TEXT        NOT NULL,
    team_id             INT         NOT NULL,
    matchday            INT         NOT NULL,  -- snapshot at this matchday (0 = final)

    -- standings data
    team_name           TEXT,
    team_short_name     TEXT,
    position            INT,
    played_games        INT,
    won                 INT,
    draw                INT,
    lost                INT,
    points              INT,
    goals_for           INT,
    goals_against       INT,
    goal_difference     INT,

    -- home/away splits (if available)
    home_won            INT,
    home_draw           INT,
    home_lost           INT,
    home_goals_for      INT,
    home_goals_against  INT,
    away_won            INT,
    away_draw           INT,
    away_lost           INT,
    away_goals_for      INT,
    away_goals_against  INT,

    -- lineage
    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (season, team_id, matchday)
);

CREATE TABLE IF NOT EXISTS raw.fd_teams (
    team_id             INT         NOT NULL,
    season              TEXT        NOT NULL,

    team_name           TEXT,
    short_name          TEXT,
    tla                 TEXT,        -- three-letter abbreviation
    crest_url           TEXT,
    founded             INT,
    venue               TEXT,
    website             TEXT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (team_id, season)
);

-- =============================================================================
-- SOURCE B: UNDERSTAT (via soccerdata)
-- Grain: match-level and player-match-level
-- Incremental key: game_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.understat_matches (
    -- natural key
    game_id             INT         NOT NULL,
    season              TEXT        NOT NULL,   -- '2324'

    -- match metadata
    match_date          TIMESTAMP,
    league_id           INT,
    season_id           INT,
    home_team_id        INT,
    away_team_id        INT,
    home_team           TEXT,
    away_team           TEXT,
    home_team_code      TEXT,
    away_team_code      TEXT,

    -- result
    home_goals          INT,
    away_goals          INT,
    is_result           BOOLEAN,
    has_data            BOOLEAN,

    -- xG and advanced
    home_xg             NUMERIC(6,4),
    away_xg             NUMERIC(6,4),
    home_np_xg          NUMERIC(6,4),
    away_np_xg          NUMERIC(6,4),
    home_np_xg_diff     NUMERIC(6,4),
    away_np_xg_diff     NUMERIC(6,4),
    home_ppda           NUMERIC(8,4),
    away_ppda           NUMERIC(8,4),
    home_deep           INT,
    away_deep           INT,
    home_points         INT,
    away_points         INT,
    home_xpts           NUMERIC(6,4),
    away_xpts           NUMERIC(6,4),

    source_url          TEXT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (game_id)
);

CREATE TABLE IF NOT EXISTS raw.understat_player_match (
    -- natural key
    game_id             INT         NOT NULL,
    player_id           INT         NOT NULL,
    team                TEXT        NOT NULL,

    -- context
    season              TEXT        NOT NULL,
    league_id           INT,
    season_id           INT,
    team_id             INT,
    player_name         TEXT,

    -- appearance
    position            TEXT,
    position_id         INT,
    minutes             INT,

    -- output
    goals               INT,
    own_goals           INT,
    shots               INT,
    xg                  NUMERIC(8,6),
    xg_chain            NUMERIC(8,6),
    xg_buildup          NUMERIC(8,6),
    assists             INT,
    xa                  NUMERIC(8,6),
    key_passes          INT,
    yellow_cards        INT,
    red_cards           INT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (game_id, player_id, team)
);

-- =============================================================================
-- SOURCE B (cont): UNDERSTAT player season stats
-- Grain: player-season (aggregated across all matches in the season)
-- Incremental key: full refresh per season (small table, ~570 rows)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.understat_player_season (
    -- natural key
    player_id           INT         NOT NULL,
    team                TEXT        NOT NULL,
    season              TEXT        NOT NULL,   -- '2324'

    -- context
    league_id           INT,
    season_id           INT,
    team_id             INT,
    player_name         TEXT,
    position            TEXT,

    -- playing time
    matches             INT,
    minutes             INT,

    -- output
    goals               INT,
    xg                  NUMERIC(8,4),
    np_goals            INT,
    np_xg               NUMERIC(8,4),
    assists             INT,
    xa                  NUMERIC(8,4),
    shots               INT,
    key_passes          INT,
    yellow_cards        INT,
    red_cards           INT,
    xg_chain            NUMERIC(8,4),
    xg_buildup          NUMERIC(8,4),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player_id, team, season)
);

-- =============================================================================
-- SOURCE E: SOFASCORE (via soccerdata)
-- Grain: team-season standings
-- Full refresh per season
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.sofascore_standings (
    -- natural key
    team                TEXT        NOT NULL,
    season              TEXT        NOT NULL,   -- '2324'

    mp                  INT,
    w                   INT,
    d                   INT,
    l                   INT,
    gf                  INT,
    ga                  INT,
    gd                  INT,
    pts                 INT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (team, season)
);

-- =============================================================================
-- SOURCE C: FBREF (manual CSV exports)
-- Grain: player-season
-- Full refresh per season (small tables, ~500-600 rows per season)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.fbref_standard (
    -- natural key
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    -- profile
    nation              TEXT,
    pos                 TEXT,
    age                 TEXT,       -- keep as TEXT, FBref exports as '24-123' (age-days)

    -- playing time
    mp                  INT,
    starts              INT,
    min                 INT,
    min_per_90          NUMERIC(5,2),

    -- output
    goals               INT,
    assists             INT,
    g_plus_a            INT,
    g_minus_pk          INT,
    pk                  INT,
    pk_att              INT,
    yellow_cards        INT,
    red_cards           INT,

    -- expected
    xg                  NUMERIC(6,2),
    npxg                NUMERIC(6,2),
    xag                 NUMERIC(6,2),
    npxg_plus_xag       NUMERIC(6,2),

    -- progressive
    prgc                INT,        -- progressive carries
    prgp                INT,        -- progressive passes
    prgr                INT,        -- progressive passes received

    -- per 90
    gls_per90           NUMERIC(5,2),
    ast_per90           NUMERIC(5,2),
    g_plus_a_per90      NUMERIC(5,2),
    xg_per90            NUMERIC(5,2),
    xag_per90           NUMERIC(5,2),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

CREATE TABLE IF NOT EXISTS raw.fbref_passing (
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    min                 INT,
    cmp                 INT,        -- passes completed
    att                 INT,        -- passes attempted
    cmp_pct             NUMERIC(5,1),
    tot_dist            INT,
    prg_dist            INT,
    -- short/med/long pass completion
    short_cmp           INT,
    short_att           INT,
    short_cmp_pct       NUMERIC(5,1),
    med_cmp             INT,
    med_att             INT,
    med_cmp_pct         NUMERIC(5,1),
    long_cmp            INT,
    long_att            INT,
    long_cmp_pct        NUMERIC(5,1),
    -- key passes
    ast                 INT,
    xag                 NUMERIC(6,2),
    xa                  NUMERIC(6,2),
    kp                  INT,        -- key passes
    final_third         INT,        -- passes into final third
    ppa                 INT,        -- passes into penalty area
    crs_pa              INT,        -- crosses into penalty area
    prgp                INT,        -- progressive passes

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

CREATE TABLE IF NOT EXISTS raw.fbref_possession (
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    min                 INT,
    touches             INT,
    touches_def_pen     INT,
    touches_def_3rd     INT,
    touches_mid_3rd     INT,
    touches_att_3rd     INT,
    touches_att_pen     INT,
    live_touches        INT,
    -- take-ons
    att_take_ons        INT,
    succ_take_ons       INT,
    succ_take_on_pct    NUMERIC(5,1),
    tkld                INT,
    tkld_pct            NUMERIC(5,1),
    -- carries
    carries             INT,
    tot_carry_dist      INT,
    prg_carry_dist      INT,
    prgc                INT,        -- progressive carries
    carries_final_third INT,
    carries_pen_area    INT,
    miscontrols         INT,
    dispossessed        INT,
    -- receiving
    rec                 INT,        -- passes received
    prgr                INT,        -- progressive passes received

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

CREATE TABLE IF NOT EXISTS raw.fbref_defense (
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    min                 INT,
    -- tackles
    tkl                 INT,
    tkl_won             INT,
    tkl_def_3rd         INT,
    tkl_mid_3rd         INT,
    tkl_att_3rd         INT,
    -- vs dribbles
    drib_tkl            INT,
    drib_att            INT,
    drib_tkl_pct        NUMERIC(5,1),
    drib_past           INT,
    -- pressures
    press               INT,
    press_succ          INT,
    press_pct           NUMERIC(5,1),
    press_def_3rd       INT,
    press_mid_3rd       INT,
    press_att_3rd       INT,
    -- blocks
    blocks              INT,
    blocked_sh          INT,
    blocked_pass        INT,
    interceptions       INT,
    tkl_plus_int        INT,
    clearances          INT,
    errors              INT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

CREATE TABLE IF NOT EXISTS raw.fbref_gk (
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    min                 INT,
    -- shot stopping
    ga                  INT,        -- goals allowed
    ga90                NUMERIC(5,2),
    sota                INT,        -- shots on target against
    saves               INT,
    save_pct            NUMERIC(5,1),
    cs                  INT,        -- clean sheets
    cs_pct              NUMERIC(5,1),
    -- penalty
    pk_att_faced        INT,
    pk_allowed          INT,
    pk_saved            INT,
    pk_missed           INT,
    -- advanced (if available)
    psxg                NUMERIC(6,2),  -- post-shot xG
    psxg_per_sot        NUMERIC(5,2),
    psxg_diff           NUMERIC(6,2),
    -- distribution
    launch_cmp          INT,
    launch_att          INT,
    launch_cmp_pct      NUMERIC(5,1),
    avg_kick_len        NUMERIC(5,1),
    -- crosses / sweeping
    opp_cross_att       INT,
    cross_stopped       INT,
    cross_stopped_pct   NUMERIC(5,1),
    swe_opa             INT,        -- sweeper actions outside penalty area
    avg_swe_dist        NUMERIC(5,1),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

CREATE TABLE IF NOT EXISTS raw.fbref_playing_time (
    player              TEXT        NOT NULL,
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,

    age                 TEXT,
    pos                 TEXT,
    mp                  INT,
    mn                  INT,        -- minutes played
    min_pct             NUMERIC(5,1),
    mn_per_start        NUMERIC(5,1),
    compl               INT,        -- complete games played
    subs                INT,
    mn_per_sub          NUMERIC(5,1),
    unsub               INT,        -- games not subbed off
    ppm                 NUMERIC(5,3),-- points per match when player plays
    on_g                INT,        -- goals scored while on pitch
    on_ga               INT,        -- goals against while on pitch
    plus_minus          INT,
    plus_minus_per90    NUMERIC(5,2),
    on_xg               NUMERIC(6,2),
    on_xga              NUMERIC(6,2),
    xg_plus_minus       NUMERIC(6,2),
    xg_plus_minus_per90 NUMERIC(5,2),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (player, squad, season)
);

-- =============================================================================
-- SOURCE D: HISTORICAL CSVs (one-time load, static)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raw.hist_team_season (
    squad               TEXT        NOT NULL,
    season              TEXT        NOT NULL,  -- '2023/2024'

    mp                  INT,
    w                   INT,
    d                   INT,
    l                   INT,
    gf                  INT,
    ga                  INT,
    gd                  INT,
    pts                 INT,
    -- available only for older seasons
    sh                  NUMERIC(8,1),
    sot                 NUMERIC(8,1),
    fk                  NUMERIC(8,1),
    pk                  NUMERIC(8,1),
    cmp                 NUMERIC(10,1),
    att                 NUMERIC(10,1),
    cmp_pct             NUMERIC(5,1),
    ck                  NUMERIC(8,1),
    crdy                NUMERIC(8,1),
    crdr                NUMERIC(8,1),
    fls                 NUMERIC(8,1),
    pkcon               NUMERIC(8,1),
    og                  NUMERIC(8,1),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (squad, season)
);

CREATE TABLE IF NOT EXISTS raw.hist_xg (
    team                TEXT        NOT NULL,
    season              TEXT        NOT NULL,  -- '2021-22'

    mp                  INT,
    xg                  NUMERIC(6,2),
    xga                 NUMERIC(6,2),
    xgd                 NUMERIC(6,2),
    gf                  INT,
    ga                  INT,
    xg_vs_actual        NUMERIC(6,2),

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (team, season)
);

CREATE TABLE IF NOT EXISTS raw.hist_fixtures (
    season              TEXT        NOT NULL,
    home_team           TEXT        NOT NULL,
    away_team           TEXT        NOT NULL,
    match_date          TEXT,       -- keep as TEXT: source has inconsistent date formats

    round_number        INT,
    home_goals          INT,
    away_goals          INT,
    -- fields present only in 24-25 file
    venue               TEXT,
    referee             TEXT,
    attendance          INT,

    _loaded_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
    _batch_id           TEXT        NOT NULL,

    UNIQUE (season, home_team, away_team, match_date)
);

-- =============================================================================
-- INDEXES
-- Support common filter patterns in staged transformation queries
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_fd_matches_season       ON raw.fd_matches (season);
CREATE INDEX IF NOT EXISTS idx_fd_matches_matchday     ON raw.fd_matches (season, matchday);
CREATE INDEX IF NOT EXISTS idx_fd_standings_season     ON raw.fd_standings (season);
CREATE INDEX IF NOT EXISTS idx_understat_matches_season ON raw.understat_matches (season);
CREATE INDEX IF NOT EXISTS idx_understat_pm_season     ON raw.understat_player_match (season);
CREATE INDEX IF NOT EXISTS idx_understat_pm_player     ON raw.understat_player_match (player_id);
CREATE INDEX IF NOT EXISTS idx_fbref_standard_season   ON raw.fbref_standard (season);
CREATE INDEX IF NOT EXISTS idx_fbref_standard_squad    ON raw.fbref_standard (squad, season);
CREATE INDEX IF NOT EXISTS idx_hist_team_season            ON raw.hist_team_season (squad, season);
CREATE INDEX IF NOT EXISTS idx_understat_ps_season         ON raw.understat_player_season (season);
CREATE INDEX IF NOT EXISTS idx_understat_ps_player         ON raw.understat_player_season (player_id);
CREATE INDEX IF NOT EXISTS idx_understat_ps_team           ON raw.understat_player_season (team, season);
CREATE INDEX IF NOT EXISTS idx_sofascore_standings_season  ON raw.sofascore_standings (season);
CREATE INDEX IF NOT EXISTS idx_ingestion_log_source        ON raw.ingestion_log (source, entity, season);
