# Analytics API

Serves SQL semantic views to the React analytics app.

## Endpoints

- `GET /health`
- `GET /api/team-summary` -> `vw_team_season_summary`
- `GET /api/match-team` -> `vw_match_team`
- `GET /api/squad-structure` -> `vw_squad_structure`
- `GET /api/recruitment-priority` -> `vw_recruitment_priority`

## Run

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Set `DATABASE_URL` before starting.
