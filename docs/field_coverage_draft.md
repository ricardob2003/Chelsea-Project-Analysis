# Field Coverage Draft

This draft maps approved metrics to available sources and highlights where fallback logic or additional data is required.

## Source Set Used

- `football-data.org` API (fixtures, matches, standings, team metadata).
- Existing historical CSVs under `data/raw` (xG, fixtures, club stats snapshots).
- Existing/planned player-level datasets (FBref/WhoScored style exports).
- Optional market context from Transfermarkt-style data.

## Coverage Matrix

| Metric / Family                                                      | Required Fields                                                          | Primary Source                            | Secondary / Fallback                               | Coverage                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------- | --------------------------------------- |
| points, matches_played, points_per_match                             | match result, status, team ids, scoreline                                | football-data matches                     | fixtures CSV                                       | Full                                    |
| table_rank, points_vs_champion                                       | standings rank/points/GD/GF                                              | football-data standings                   | standings snapshot CSV                             | Full                                    |
| ucl_cutoff_rank, points_vs_ucl_cutoff                                | standings + season UCL-slot rule                                         | football-data + rule table                | manual rule table                                  | Partial (rule table needed)             |
| home/away totals and PPM metrics                                     | home/away flag + points per match                                        | football-data matches                     | fixtures CSV                                       | Full                                    |
| rolling\_\* and points_stddev_rolling_5                              | ordered match points/GD series                                           | football-data matches                     | fixtures CSV                                       | Full                                    |
| unbeaten_run_max, winless_run_max                                    | ordered match results                                                    | football-data matches                     | fixtures CSV                                       | Full                                    |
| monthly\_\* temporal metrics                                         | match month + points/GD + season baselines                               | football-data matches                     | fixtures CSV                                       | Full                                    |
| points_from_winning_positions, points_dropped_from_winning_positions | match state timeline (lead events)                                       | event-level feed (WhoScored/FBref events) | none robust                                        | Missing/High Risk                       |
| clean_sheet_rate_team                                                | goals conceded by match                                                  | football-data matches                     | fixtures CSV                                       | Full                                    |
| u23_player_share, avg_age_position_group                             | player DOB/age, position, squad membership                               | squad/player-season datasets              | transfermarkt profile data                         | Partial (position normalization needed) |
| u23_minutes_share                                                    | player minutes + U23 flag                                                | player-season datasets                    | none                                               | Partial                                 |
| depth/minutes-load/per90 gaps vs cohorts                             | player minutes, position groups, cohort membership                       | player-season datasets + standings        | fallback to simpler minutes-only benchmarks        | Partial                                 |
| minutes_played, rank, availability, start_rate                       | minutes, starts, team matches                                            | player-season datasets + football-data    | none                                               | Partial to Full                         |
| progressive_actions_per90                                            | progressive passes/carries/receptions + minutes                          | player-season datasets                    | `g+a_per90` fallback                               | Partial                                 |
| g+a_per90 fallback                                                   | goals, assists, minutes                                                  | player-season datasets                    | football-data scorer endpoints if limited          | Partial to Full                         |
| player progressive gaps/percentile                                   | progressive per90 + peer distribution + position group                   | player-season datasets + standings        | `g+a_per90` fallback                               | Partial                                 |
| sample_confidence_flag                                               | minutes_played                                                           | player-season datasets                    | none                                               | Full                                    |
| defender metrics (46-51)                                             | tackles/interceptions/blocks/duels/errors + minutes                      | player event datasets                     | none                                               | Partial to Missing by provider          |
| goalkeeper metrics (52-57)                                           | saves, SOT faced, goals, claims, sweeper actions, distribution + minutes | GK event datasets                         | football-data for basic goals/clean sheets context | Partial to Missing by provider          |
