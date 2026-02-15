# Analytics Web App (React)

Frontend replacement for the Tableau dashboard.

## Routes

- `/benchmark` -> Chelsea vs Benchmark
- `/pitch-weakness` -> Pitch Weakness Map
- `/recruitment-board` -> Recruitment Priority Board
- `/u22-fit` -> U-22 Fit Filter

Each route maps to one SQL-backed API endpoint.

## Run

```bash
cd apps/web
npm install
npm run dev
```

Optional env var:

- `VITE_API_BASE_URL` (default: `http://localhost:8000/api`)
