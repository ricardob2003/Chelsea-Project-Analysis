import { useEffect, useState } from "react";

import { analyticsApi } from "../api/client";

export function PitchWeaknessMap() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    analyticsApi.getMatchTeam().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="page">
      <h2>Pitch Weakness Map</h2>
      <p>SQL source: <span className="code">vw_match_team</span></p>
      <p>Rows loaded: {rows.length}</p>
    </section>
  );
}
