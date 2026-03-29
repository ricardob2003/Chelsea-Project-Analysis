-- =============================================================================
-- SEED LOOKUP DATA
-- Canonical seasons, teams, and team name aliases.
-- Run once after create_staged_schema.sql. Safe to re-run (ON CONFLICT DO NOTHING).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- dim_season
-- -----------------------------------------------------------------------------

INSERT INTO staged.dim_season (season_key, season_code, season_start_year, season_end_year, ucl_slot_rank, is_complete, notes)
VALUES
    ('2019-20', '1920', 2019, 2020, 4, TRUE,  'COVID-delayed, ended Aug 2020'),
    ('2020-21', '2021', 2020, 2021, 4, TRUE,  'COVID season — Understat code 2021'),
    ('2021-22', '2122', 2021, 2022, 4, TRUE,  NULL),
    ('2022-23', '2223', 2022, 2023, 4, TRUE,  NULL),
    ('2023-24', '2324', 2023, 2024, 4, TRUE,  NULL),
    ('2024-25', '2425', 2024, 2025, 5, TRUE,  'UCL expanded to 5 PL slots from this season'),
    ('2025-26', '2526', 2025, 2026, 5, FALSE, 'Current season')
ON CONFLICT (season_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- dim_team  (all PL teams in our dataset window)
-- -----------------------------------------------------------------------------

INSERT INTO staged.dim_team (team_key) VALUES
    ('Arsenal'),
    ('Aston Villa'),
    ('Bournemouth'),
    ('Brentford'),
    ('Brighton'),
    ('Burnley'),
    ('Chelsea'),
    ('Crystal Palace'),
    ('Everton'),
    ('Fulham'),
    ('Ipswich Town'),
    ('Leeds United'),
    ('Leicester City'),
    ('Liverpool'),
    ('Luton Town'),
    ('Manchester City'),
    ('Manchester United'),
    ('Newcastle United'),
    ('Norwich City'),
    ('Nottingham Forest'),
    ('Sheffield United'),
    ('Southampton'),
    ('Tottenham'),
    ('Watford'),
    ('West Bromwich Albion'),
    ('West Ham'),
    ('Wolverhampton Wanderers'),
    ('Sunderland'),
    ('Huddersfield Town'),
    ('Swansea City')
ON CONFLICT (team_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- team_name_map  (raw source name → canonical team_key)
-- Sources: understat, sofascore, hist_team_season, hist_fixtures
-- -----------------------------------------------------------------------------

INSERT INTO staged.team_name_map (raw_name, team_key) VALUES
    -- Understat names (generally clean, some truncations)
    ('Arsenal',                     'Arsenal'),
    ('Aston Villa',                 'Aston Villa'),
    ('Bournemouth',                 'Bournemouth'),
    ('Brentford',                   'Brentford'),
    ('Brighton',                    'Brighton'),
    ('Burnley',                     'Burnley'),
    ('Chelsea',                     'Chelsea'),
    ('Crystal Palace',              'Crystal Palace'),
    ('Everton',                     'Everton'),
    ('Fulham',                      'Fulham'),
    ('Ipswich',                     'Ipswich Town'),
    ('Leeds',                       'Leeds United'),
    ('Leicester',                   'Leicester City'),
    ('Liverpool',                   'Liverpool'),
    ('Luton',                       'Luton Town'),
    ('Manchester City',             'Manchester City'),
    ('Manchester United',           'Manchester United'),
    ('Newcastle United',            'Newcastle United'),
    ('Nottingham Forest',           'Nottingham Forest'),
    ('Sheffield United',            'Sheffield United'),
    ('Southampton',                 'Southampton'),
    ('Tottenham',                   'Tottenham'),
    ('West Bromwich Albion',        'West Bromwich Albion'),
    ('West Ham',                    'West Ham'),
    ('Wolverhampton Wanderers',     'Wolverhampton Wanderers'),
    -- Sofascore names (some differ from Understat)
    ('Brighton & Hove Albion',      'Brighton'),
    ('Ipswich Town',                'Ipswich Town'),
    ('Leeds United',                'Leeds United'),
    ('Leicester City',              'Leicester City'),
    ('Luton Town',                  'Luton Town'),
    ('Tottenham Hotspur',           'Tottenham'),
    ('West Ham United',             'West Ham'),
    ('Wolverhampton',               'Wolverhampton Wanderers'),
    ('Sunderland',                  'Sunderland'),         -- relegated, historical
    -- hist_team_season names (FBref export style, often abbreviated)
    ('Manchester Utd',              'Manchester United'),
    ('Newcastle Utd',               'Newcastle United'),
    ('Nott''ham Forest',             'Nottingham Forest'),
    ('Sheffield Utd',               'Sheffield United'),
    ('Wolves',                      'Wolverhampton Wanderers'),
    ('Norwich City',                'Norwich City'),
    ('Watford',                     'Watford'),
    -- hist_fixtures names (vary by source file)
    ('AFC Bournemouth',             'Bournemouth'),
    ('Huddersfield',                'Huddersfield Town'),
    ('Swansea',                     'Swansea City'),
    -- football-data.org names (team names with "FC" suffix)
    ('Arsenal FC',                  'Arsenal'),
    ('Aston Villa FC',              'Aston Villa'),
    ('Brentford FC',                'Brentford'),
    ('Brighton & Hove Albion FC',   'Brighton'),
    ('Burnley FC',                  'Burnley'),
    ('Chelsea FC',                  'Chelsea'),
    ('Crystal Palace FC',           'Crystal Palace'),
    ('Everton FC',                  'Everton'),
    ('Fulham FC',                   'Fulham'),
    ('Ipswich Town FC',             'Ipswich Town'),
    ('Leeds United FC',             'Leeds United'),
    ('Leicester City FC',           'Leicester City'),
    ('Liverpool FC',                'Liverpool'),
    ('Luton Town FC',               'Luton Town'),
    ('Manchester City FC',          'Manchester City'),
    ('Manchester United FC',        'Manchester United'),
    ('Newcastle United FC',         'Newcastle United'),
    ('Nottingham Forest FC',        'Nottingham Forest'),
    ('Sheffield United FC',         'Sheffield United'),
    ('Southampton FC',              'Southampton'),
    ('Tottenham Hotspur FC',        'Tottenham'),
    ('West Ham United FC',          'West Ham'),
    ('Wolverhampton Wanderers FC',  'Wolverhampton Wanderers'),
    ('Bournemouth FC',              'Bournemouth'),
    ('AFC Sunderland',              'Sunderland')
ON CONFLICT (raw_name) DO NOTHING;
