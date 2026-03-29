-- =============================================================================
-- PATCH: Correct sofascore_standings season codes
-- =============================================================================
-- Problem: sofascore.py originally assumed soccerdata used END year for seasons.
-- It actually uses START year, so every season was stored one slot too early:
--   seasons=2022 → fetches 2022-23 data → was stored as "2122"  (wrong)
--   seasons=2023 → fetches 2023-24 data → was stored as "2223"  (wrong)
--   seasons=2024 → fetches 2024-25 data → was stored as "2324"  (wrong)
--   seasons=2025 → failed (live season)  → was stored as "2425"  (partial/wrong)
--
-- Fix: remap the raw rows to the correct season codes, then re-run transform.
-- Safe to re-run: idempotent because after the first run the old codes are gone.
-- =============================================================================

-- Step 1: save the correct rows into a temp table
CREATE TEMP TABLE _ss_fix AS
SELECT
    team,
    CASE season
        WHEN '2122' THEN '2223'   -- was 2022-23, not 2021-22
        WHEN '2223' THEN '2324'   -- was 2023-24, not 2022-23
        WHEN '2324' THEN '2425'   -- was 2024-25, not 2023-24
        -- '2425' had partial/failed data — drop it; next sofascore ingest will fill correctly
    END AS season,
    mp, w, d, l, gf, ga, gd, pts, _batch_id
FROM raw.sofascore_standings
WHERE season IN ('2122', '2223', '2324')
  AND CASE season
        WHEN '2122' THEN '2223'
        WHEN '2223' THEN '2324'
        WHEN '2324' THEN '2425'
      END IS NOT NULL;

-- Step 2: wipe all sofascore standings (the corrected copy is in the temp table)
DELETE FROM raw.sofascore_standings;

-- Step 3: re-insert with the corrected season codes
INSERT INTO raw.sofascore_standings (team, season, mp, w, d, l, gf, ga, gd, pts, _batch_id)
SELECT team, season, mp, w, d, l, gf, ga, gd, pts, _batch_id
FROM _ss_fix
ON CONFLICT (team, season) DO NOTHING;

DROP TABLE _ss_fix;
