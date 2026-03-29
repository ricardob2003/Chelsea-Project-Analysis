-- =============================================================================
-- VIEW: vw_squad_structure
-- Source: staged.stg_player_season
-- Grain: one row per player per team per season
--
-- Purpose: Squad-level player performance data for all PL teams across seasons.
--          Filter by team_key = 'Chelsea' on the client for squad dashboard.
-- Used by: /api/squad-structure endpoint → Squad Table, Pitch Formation
-- =============================================================================

CREATE OR REPLACE VIEW views.vw_squad_structure AS
SELECT
    ps.season_key,
    ps.team_key,
    ps.player_id,
    ps.player_name,
    ps.position_group,
    ps.position_raw,

    -- playing time
    ps.matches,
    ps.minutes,
    ps.availability_rate,
    ps.sample_confidence,

    -- season totals
    ps.goals,
    ps.assists,
    ps.shots,
    ps.key_passes,
    ps.xg,
    ps.np_xg,
    ps.xa,
    ps.xg_chain,
    ps.xg_buildup,
    ps.yellow_cards,
    ps.red_cards,

    -- per 90 metrics
    ps.g_per90,
    ps.a_per90,
    ps.g_plus_a_per90,
    ps.xg_per90,
    ps.np_xg_per90,
    ps.xa_per90,
    ps.shots_per90,
    ps.key_passes_per90,
    ps.xg_chain_per90,

    -- team context (rank + UCL gap for filtering)
    ts.table_rank,
    ts.pts_vs_ucl_cutoff

FROM staged.stg_player_season ps
JOIN staged.stg_team_season ts
    ON  ts.season_key = ps.season_key
    AND ts.team_key   = ps.team_key
ORDER BY ps.season_key DESC, ps.team_key, ps.minutes DESC;
