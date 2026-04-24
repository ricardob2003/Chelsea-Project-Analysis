-- =============================================================================
-- MART / VIEWS SCHEMA DDL
-- Layer: mart + views
-- Purpose:
--   mart  — reserved for future materialized aggregates (currently empty)
--   views — semantic layer consumed directly by the API
--
-- All views read from staged.* tables.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS mart;
CREATE SCHEMA IF NOT EXISTS views;
