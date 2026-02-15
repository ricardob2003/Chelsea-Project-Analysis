import { useEffect, useState } from "react";

import { analyticsApi } from "../api/client";

export function RecruitmentBoard() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    analyticsApi.getRecruitmentPriority().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="page">
      <h2>Recruitment Priority Board</h2>
      <p>SQL source: <span className="code">vw_recruitment_priority</span></p>
      <p>Rows loaded: {rows.length}</p>
    </section>
  );
}
