# Metric Definitions

## Scope and Benchmark Rules
- Competition scope: Premier League (`PL`) only.
- Team focus: Chelsea team performance.
- Player benchmark scope: Chelsea players vs league peers.
- Time scope: rolling last 3 seasons and moving forward.
- Benchmark cohorts:
  - UCL cutoff cohort: top `ucl_cutoff_rank` teams (rank 4 or 5 depending on season rule).
  - Champion cohort: rank 1 team.
- Benchmark eligibility:
  - Include in benchmark calculations if `minutes_played >= 600`.
  - Tag high-confidence sample if `minutes_played >= 900`.

## Team Outcome Metrics
1. `points`: total league points earned in season.
2. `matches_played`: total finished league matches in season.
3. `points_per_match`: `points / matches_played`.
4. `table_rank`: league rank by `points DESC, goal_diff DESC, goals_for DESC`.
5. `ucl_cutoff_rank`: dynamic UCL threshold rank (4 or 5 by season rule).
6. `points_vs_ucl_cutoff`: `chelsea_points - points_at_ucl_cutoff_rank`.
7. `points_vs_champion`: `chelsea_points - champion_points`.

## Match Trend and Venue Metrics
8. `rolling_points_per_match_5`: 5-match moving average of points.
9. `rolling_goal_diff_5`: 5-match moving average of goal difference.
10. `home_points_per_match`: home points divided by finished home matches.
11. `away_points_per_match`: away points divided by finished away matches.
12. `home_away_ppm_delta`: `home_points_per_match - away_points_per_match`.
13. `home_points_total`: total points at home.
14. `away_points_total`: total points away.
15. `home_away_points_delta`: `home_points_total - away_points_total`.
16. `points_stddev_rolling_5`: standard deviation of rolling 5-match points trend.
17. `unbeaten_run_max`: longest streak without a loss.
18. `winless_run_max`: longest streak without a win.
19. `points_from_winning_positions`: points secured from matches where Chelsea led.
20. `points_dropped_from_winning_positions`: points lost from matches where Chelsea led but did not take maximum points.
21. `clean_sheet_rate_team`: share of matches with zero goals conceded.

## Squad Benchmark Metrics
22. `depth_gap_vs_ucl_cohort`: Chelsea position-group depth minus UCL cohort average depth.
23. `depth_gap_vs_champion`: Chelsea position-group depth minus champion depth.
24. `minutes_load_gap_vs_ucl_cohort`: Chelsea minutes concentration minus UCL cohort minutes concentration.
25. `minutes_load_gap_vs_champion`: Chelsea minutes concentration minus champion minutes concentration.
26. `per90_gap_vs_ucl_cohort`: Chelsea per90 output minus UCL cohort per90 reference (same position group/metric).
27. `per90_gap_vs_champion`: Chelsea per90 output minus champion per90 reference (same position group/metric).
28. `u23_player_share`: share of squad players classified as U23.
29. `u23_minutes_share`: share of total team minutes played by U23 players.
30. `avg_age_position_group`: average age by position group.

## Individual Player Metrics
31. `minutes_played`: total PL minutes played by player in season.
32. `minutes_rank_in_team`: Chelsea-only ranking by minutes played.
33. `availability_rate`: player minutes divided by total possible Chelsea league minutes.
34. `start_rate`: starts divided by Chelsea finished league matches.
35. `progressive_actions_per90`: progressive actions normalized per 90 (primary progression metric).
36. `g+a_per90`: goals+assists per 90 (fallback when progressive fields are unavailable).
37. `player_progressive_gap_vs_ucl_cohort`: player progressive per90 minus UCL cohort position reference.
38. `player_progressive_gap_vs_champion`: player progressive per90 minus champion position reference.
39. `player_progressive_percentile_league`: league percentile within position group.
40. `sample_confidence_flag`: reliability tag (`>=900` high confidence; 600-899 benchmark-eligible).

## Temporal Consistency Metrics
41. `monthly_points_per_match`: points per match by month.
42. `monthly_ppm_vs_season_baseline`: monthly PPM minus season PPM.
43. `month_underperformance_frequency`: frequency that a month underperforms season baseline across seasons.
44. `december_drop_index`: December PPM minus reference from adjacent months (Nov/Jan average).
45. `monthly_goal_diff_delta`: monthly goal-diff-per-match minus seasonal goal-diff-per-match.

## Defender Metrics
46. `def_actions_per90`: defensive actions per 90.
47. `duel_win_pct`: share of duels won.
48. `aerial_win_pct`: share of aerial duels won.
49. `dribbler_stop_pct`: success rate stopping dribbles.
50. `errors_leading_shot_per90`: errors leading to shots per 90.
51. `errors_leading_goal_per90`: errors leading to goals per 90.

## Goalkeeper Metrics
52. `save_pct`: `saves / shots_on_target_faced`.
53. `goals_conceded_per90`: goals conceded per 90.
54. `clean_sheet_rate`: clean-sheet share while playing.
55. `cross_claim_rate`: successful cross claims rate (if available).
56. `sweeper_actions_per90`: sweeper-style interventions per 90 (if available).
57. `distribution_completion_pct`: pass/distribution completion rate.
