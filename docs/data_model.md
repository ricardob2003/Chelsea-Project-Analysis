# Data Model

## Data Sources

| Source | Grain | What it provides | Used for |
|---|---|---|---|
| **hist_team_season** (`raw.hist_team_season`) | Team-season | W/D/L/GF/GA/GD/Pts + shooting/discipline stats | Primary standings source for all completed historical seasons (up to 2023-24) |
| **football-data.org** (`fd_*`) | Season + matchday snapshot | W/D/L/GF/GA/GD/Pts, home/away splits | Standings for live/recent seasons not yet in hist_team_season (2024-25 onward) |
| **hist_xg** (`raw.hist_xg`) | Team-season | xG, xGA, xGD | Historical xG enrichment (2021-22 → 2023-24) |
| **Understat** (`understat_*`) | Match + player-season | xG, xA, np_xG per match and per player | xG enrichment on matches and player performance |
| **Sofascore** (`sofascore_*`) | Reserved | Per-match player ratings, shot maps, incidents | Not currently active — reserved for future player-rating work |

### Standings source split

```
Seasons ≤ 2023-24  →  raw.hist_team_season  (FBref static export, covers 1888 onward)
Seasons ≥ 2024-25  →  raw.fd_standings      (football-data.org, live + rolling window)
```

`hist_team_season` is the authoritative source for completed historical seasons.
`fd_standings` supplements for any season not yet present in hist — primarily the
current live season. The transform checks `WHERE NOT EXISTS` before inserting from fd,
so there is no overlap conflict.

### Why not Sofascore for standings

Sofascore was previously the primary standings source but was removed because:
1. Its season-code scheme required a fragile one-time migration patch that re-applied incorrectly each run
2. It fails to return data for live seasons
3. It provides no data not already in `hist_team_season` or `fd_standings`

Sofascore's genuine value is at the match/player-rating grain (per-match ratings,
shot maps, incident timelines) which are not available from any other source, and
is retained for that future use.

---

## Layer Architecture

```
raw        — source data exactly as ingested, no transformations
staged     — cleaned, normalised, joined to canonical keys
mart       — aggregated views ready for the API and dashboards
```

### raw schema tables

| Table | Source | Grain |
|---|---|---|
| `hist_team_season` | FBref static CSV | One row per team × season (all seasons to 2023-24) |
| `hist_xg` | Static CSV | One row per team × season (2021-22 → 2023-24) |
| `fd_matches` | football-data.org | One row per match |
| `fd_standings` | football-data.org | One row per team × season × matchday snapshot |
| `fd_teams` | football-data.org | One row per team × season |
| `understat_matches` | Understat | One row per match (team perspective, home + away) |
| `understat_player_match` | Understat | One row per player × match |
| `understat_player_season` | Understat | One row per player × season |
| `sofascore_standings` | Sofascore | One row per team × season — not used by transforms |
| `ingestion_log` | Pipeline | One row per ingest run |

### staged schema tables

| Table | Grain | Key joins |
|---|---|---|
| `dim_season` | One row per season | Canonical season_key, season_code, UCL slot rank |
| `dim_team` | One row per team | Canonical team_key |
| `team_name_map` | raw_name → team_key | Normalises name variants across all sources |
| `stg_team_season` | One row per team × season | hist_team_season + fd_standings + hist_xg |
| `stg_match` | One row per team × match | understat_matches |
| `stg_player_season` | One row per player × season | understat_player_season |

---

## Season Codes

Seasons are identified by a human-readable `season_key` (e.g. `2024-25`) and a
compact `season_code` used in raw tables from football-data.org and Understat
(e.g. `2425`). `hist_team_season` uses a `/`-separated format (`2023/2024`)
which is converted inline in the transform.

| season_key | season_code | hist format | Notes |
|---|---|---|---|
| 2019-20 | 1920 | 2019/2020 | |
| 2020-21 | 2021 | 2020/2021 | COVID season — Understat uses code `2021` |
| 2021-22 | 2122 | 2021/2022 | |
| 2022-23 | 2223 | 2022/2023 | |
| 2023-24 | 2324 | 2023/2024 | Last season in hist_team_season |
| 2024-25 | 2425 | — | football-data only |
| 2025-26 | 2526 | — | Current season, football-data only |

---

## Ingestion defaults

| Ingest script | Default window | Notes |
|---|---|---|
| `football_data.py` | Last 3 seasons | Live/recent standings only — hist covers everything older |
| `understat.py` | Last 5 seasons | Player and match xG |
| `sofascore.py` | Last 4 seasons | Not wired into transforms — reserved for future use |
