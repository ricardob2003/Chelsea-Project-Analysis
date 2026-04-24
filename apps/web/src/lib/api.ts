// =============================================================================
// API client — typed fetch functions for each backend endpoint
// All requests proxy through Vite to http://localhost:8000
// =============================================================================

const BASE = '/api';

// ---------------------------------------------------------------------------
// Types — mirror the SQL view columns exactly
// ---------------------------------------------------------------------------

export interface TeamSeasonSummary {
  season_key: string;
  team_key: string;
  table_rank: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  pts_per_match: number;
  ucl_cutoff_rank: number;
  champion_pts: number;
  ucl_cutoff_pts: number;
  pts_vs_champion: number;
  pts_vs_ucl_cutoff: number;
  xg: number | null;
  xga: number | null;
  xgd: number | null;
  xpts: number | null;
  standings_source: string;
  xg_source: string | null;
}

export interface RecruitmentPriority {
  season_key: string;
  position_group: string;
  chelsea_players: number;
  chelsea_xg_per90: number;
  chelsea_np_xg_per90: number;
  chelsea_xa_per90: number;
  chelsea_shots_per90: number;
  chelsea_kp_per90: number;
  chelsea_xg_chain_per90: number;
  chelsea_g_per90: number;
  chelsea_a_per90: number;
  chelsea_g_plus_a_per90: number;
  top4_players: number | null;
  top4_xg_per90: number | null;
  top4_np_xg_per90: number | null;
  top4_xa_per90: number | null;
  top4_shots_per90: number | null;
  top4_kp_per90: number | null;
  top4_g_per90: number | null;
  top4_a_per90: number | null;
  top4_g_plus_a_per90: number | null;
  gap_xg_per90: number | null;
  gap_np_xg_per90: number | null;
  gap_xa_per90: number | null;
  gap_shots_per90: number | null;
  gap_kp_per90: number | null;
  gap_g_per90: number | null;
  gap_a_per90: number | null;
  gap_g_plus_a_per90: number | null;
}

export interface SquadPlayer {
  season_key: string;
  team_key: string;
  player_id: number;
  player_name: string;
  position_group: string;
  position_raw: string;
  matches: number;
  minutes: number;
  availability_rate: number;
  sample_confidence: string;
  goals: number;
  assists: number;
  xg: number;
  np_xg: number;
  xa: number;
  g_per90: number | null;
  a_per90: number | null;
  g_plus_a_per90: number | null;
  xg_per90: number | null;
  np_xg_per90: number | null;
  xa_per90: number | null;
  shots_per90: number | null;
  key_passes_per90: number | null;
  table_rank: number;
  pts_vs_ucl_cutoff: number;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

async function get<T>(path: string, limit = 500): Promise<T> {
  const res = await fetch(`${BASE}${path}?limit=${limit}`);
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
  return res.json();
}

export interface TeamForm {
  game_id: number;
  season_key: string;
  match_date: string;
  matchday: number;
  team_key: string;
  opponent_key: string;
  is_home: boolean;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
  xg: number | null;
  xg_against: number | null;
  xpts: number | null;
  xgd: number | null;
  xg_conversion_gap: number | null;
  luck_gap: number | null;
  rolling_pts_5: number | null;
  rolling_xg_5: number | null;
  rolling_xga_5: number | null;
  rolling_gd_5: number | null;
  rolling_xgd_5: number | null;
  cumul_pts: number;
  cumul_gf: number;
  cumul_ga: number;
  cumul_xg: number | null;
  cumul_xga: number | null;
  cumul_xpts: number | null;
  cumul_xg_overperf: number | null;
  cumul_luck_gap: number | null;
}

export const fetchTeamSummary     = () => get<TeamSeasonSummary[]>('/team-summary', 500);
export const fetchRecruitmentPriority = () => get<RecruitmentPriority[]>('/recruitment-priority', 200);
export const fetchSquadStructure  = () => get<SquadPlayer[]>('/squad-structure', 1000);
export const fetchTeamForm        = () => get<TeamForm[]>('/team-form', 5000);
