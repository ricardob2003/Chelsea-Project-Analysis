"""
Dynamic season window calculation.

The Premier League season runs August → May.
We use the START year to identify a season: 2024 = 2024-25.

- If today is August or later  → current season started this year
- If today is before August    → current season started last year

Examples (assuming football_data uses start year):
  Called in March  2026 → current start = 2025 → window = [2023, 2024, 2025]
  Called in August 2026 → current start = 2026 → window = [2024, 2025, 2026]
"""

from datetime import date


def current_season_start(today: date | None = None) -> int:
    """Return the start year of the current PL season."""
    d = today or date.today()
    return d.year if d.month >= 8 else d.year - 1


def season_window(n: int = 3, today: date | None = None) -> list[int]:
    """
    Return the last `n` season start years up to and including the current season.

    football_data.py and sofascore.py pass these integers directly to their APIs.
    """
    start = current_season_start(today)
    return list(range(start - n + 1, start + 1))


def season_window_understat(n: int = 4, today: date | None = None) -> list[int]:
    """
    Return the last `n` Understat/soccerdata season integers (start-year convention).

    soccerdata uses the year the PL season STARTS:
      seasons=2025 → 2025-26 PL (starting Aug 2025)
      seasons=2024 → 2024-25 PL (starting Aug 2024)

    Example: called in April 2026 → start=2025 → window=[2022,2023,2024,2025]
    """
    start = current_season_start(today)
    return list(range(start - n + 1, start + 1))
