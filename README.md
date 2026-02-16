# Chelsea Recruitment Engine

Data and analytics project to prioritize Chelsea recruitment decisions using Premier League performance, squad structure, and market data.

### A. Project Question + Purpose

#### Primary Question

Where should Chelsea focus recruitment (U-22 strategy) to maximize **Premier League** outcomes:

1. Consistent **UCL qualification (Top 4)**
2. Realistic **title contention (Top 2 / defined points threshold)**

#### Purpose

Build a structured decision-support system that transforms match, squad, and league performance data into:

- Recruitment priorities by position/role
- Evidence-based performance gap diagnostics
- Strategic recommendations grounded in measurable KPIs

This system replaces narrative-driven analysis with reproducible, data-backed evaluation of Chelsea’s recruitment strategy.

---

### Project Structure

```text
chelsea-recruitment-engine/
├── README.md
├── docker-compose.yml
├── .env.example
├── Pipfile
│
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── db.py
│   │   │   └── routers/
│   │   └── requirements.txt
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── api/
│       │   ├── components/
│       │   ├── features/
│       │   └── pages/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── data/
│   └── raw/
│       ├── premier_league/
│       ├── fbref/
│       ├── transfermarkt/
│       └── whoscored/
│   └── staged/
│
├── sql/
│   ├── create_schema.sql
│   ├── raw/
│   ├── staged/
│   ├── mart/
│   └── views/
│
├── src/
│   ├── ingest/
│   ├── load/
│   ├── orchestration/
│   ├── quality/
│   ├── transform/
│   └── utils/
│
├── dashboards/
│   └── tableau/
│       ├── chelsea_recruitment.twbx
│       ├── chelsea_recruitment.twb
│       └── README.md
│
└── docs/
    ├── project_spec.md
    ├── data_model.md
    ├── metric_definitions.md
    └── field_coverage_draft.md
```
