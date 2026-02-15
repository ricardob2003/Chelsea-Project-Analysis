import { useEffect, useState } from "react";

import { analyticsApi } from "../api/client";

export function U22FitFilter() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    analyticsApi.getSquadStructure().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="page">
      <h2>U-22 Fit Filter</h2>
      <p>SQL source: <span className="code">vw_squad_structure</span></p>
      <p>Rows loaded: {rows.length}</p>
    </section>
  );
}
