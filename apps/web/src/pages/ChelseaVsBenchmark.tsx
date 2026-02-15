import { useEffect, useState } from "react";

import { analyticsApi } from "../api/client";

export function ChelseaVsBenchmark() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    analyticsApi.getTeamSummary().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="page">
      <h2>Chelsea vs Benchmark</h2>
      <p>SQL source: <span className="code">vw_team_season_summary</span></p>
      <p>Rows loaded: {rows.length}</p>
    </section>
  );
}
