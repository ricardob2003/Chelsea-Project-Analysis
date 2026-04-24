# Chelsea Recruitment Intelligence Engine

Data and analytics platform for evaluating Chelsea FC's sporting and recruitment performance across Premier League seasons.

---

## Running the stack

Three terminals, started in this order:

```bash
# Terminal 1 — Postgres (Docker)
docker compose up -d

# Terminal 2 — FastAPI backend (localhost:8000)
pipenv run uvicorn apps.api.app.main:app --reload --port 8000

# Terminal 3 — React frontend (localhost:8080)
cd apps/web && npm run dev
```

Vite proxies all `/api/*` requests to FastAPI. The browser only ever talks to port 8080.

---

## Refreshing data

```bash
# Pull latest season data + re-run transform (one command)
pipenv run python -m src.ingest.refresh

# Current season only
pipenv run python -m src.ingest.refresh --seasons 2025

# Ingest only (skip transform)
pipenv run python -m src.ingest.refresh --skip-transform

# Transform only (if ingest already ran)
pipenv run python -m src.ingest.refresh --transform-only

# Historical backfill (one-time, for seasons before 2024-25)
# Historical standings come from data/raw/historical-data/seasonstats.csv
# which is loaded by the transform — no separate ingest needed.
# Understat history:
pipenv run python -m src.ingest.refresh --seasons 2021 2022 2023 2024 2025
```

---

## Data pipeline

```
External APIs / CSVs
       ↓
  apps/api/src/ingest/     Python — raw data → raw schema (Postgres)
       ↓
  apps/api/src/transform/  Python + SQL — raw → staged schema
       ↓
  apps/api/sql/views/      SQL views — semantic layer on staged
       ↓
  apps/api/app/            FastAPI — reads views, serves JSON
       ↓
  apps/web/                React + Recharts — dashboard
```

### Data sources

| Source | What it provides | Ingest script |
|---|---|---|
| `hist_team_season` | Season standings ≤ 2023-24 (FBref static CSV) | Loaded by transform |
| `football-data.org` | Live standings + match results 2024-25 → present | `football_data.py` |
| `Understat` | Match xG, player season stats | `understat.py` |
| `hist_xg` | Team xG/xGA for 2021-22 → 2023-24 (static CSV) | Loaded by transform |
| `Sofascore` | Reserved — per-match player ratings (future) | `sofascore.py` |

---

## Project structure

```
├── apps/
│   ├── api/                        All backend logic
│   │   ├── app/                    FastAPI application
│   │   │   ├── main.py             App entrypoint, router registration
│   │   │   ├── db.py               DB connection
│   │   │   └── routers/            One file per API endpoint
│   │   ├── src/                    Data pipeline
│   │   │   ├── ingest/
│   │   │   │   ├── refresh.py      Orchestration — run this to update data
│   │   │   │   ├── football_data.py  football-data.org ingest
│   │   │   │   └── understat.py    Understat xG ingest
│   │   │   ├── transform/
│   │   │   │   ├── run_staged.py   Staged transform orchestration
│   │   │   │   └── run_mart.py     View layer orchestration
│   │   │   └── utils/
│   │   │       ├── db.py           SQLAlchemy helpers
│   │   │       └── seasons.py      Dynamic season window calculation
│   │   ├── sql/
│   │   │   ├── raw/                Raw schema DDL
│   │   │   ├── staged/             Transform SQL (5 steps)
│   │   │   └── views/              Semantic views (one per API endpoint)
│   │   ├── data/raw/historical-data/  Static CSVs (season stats, xG)
│   │   ├── pipeline.py             Full pipeline runner (ingest + transform)
│   │   └── scheduler.py            Weekly cron wrapper around pipeline.py
│   └── web/                        React frontend (Vite + shadcn/ui + Recharts)
│       └── src/
│           ├── components/dashboard/  Dashboard UI components
│           ├── lib/api.ts             Typed API client
│           └── pages/                 Overview, Sporting, Financials, Squad
│
├── docs/           project_spec.md, data_model.md, metric_definitions.md
├── docker-compose.yml   Postgres on port 5434
├── Pipfile              Python dependencies
└── .env                 DATABASE_URL, FD_API_KEY, PYTHONPATH=apps/api
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://pl-user:<password>@localhost:5434/pl-team-datamart
FD_API_KEY=<your football-data.org API key>
PYTHONPATH=apps/api
```
