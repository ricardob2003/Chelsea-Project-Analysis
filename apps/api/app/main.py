from fastapi import FastAPI

from app.routers import match_team, recruitment_priority, squad_structure, team_summary

app = FastAPI(title="Chelsea Recruitment Analytics API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(team_summary.router, prefix="/api")
app.include_router(match_team.router, prefix="/api")
app.include_router(squad_structure.router, prefix="/api")
app.include_router(recruitment_priority.router, prefix="/api")
