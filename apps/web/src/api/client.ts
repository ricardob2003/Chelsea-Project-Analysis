const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const analyticsApi = {
  getTeamSummary: () => get<Record<string, unknown>[]>("/team-summary"),
  getMatchTeam: () => get<Record<string, unknown>[]>("/match-team"),
  getRecruitmentPriority: () => get<Record<string, unknown>[]>("/recruitment-priority"),
  getSquadStructure: () => get<Record<string, unknown>[]>("/squad-structure")
};
