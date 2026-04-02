import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { fetchTeamSummary, type TeamSeasonSummary } from '@/lib/api';
import { TEAM_COLORS } from '@/lib/teamColors';

const TOP6 = ['Chelsea', 'Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'];

type ChartRow = Record<string, string | number>;

function buildChart(rows: TeamSeasonSummary[]): { teams: string[]; data: ChartRow[] } {
  const seasons = [...new Set(
    rows.filter((r) => TOP6.includes(r.team_key) && r.pts > 0).map((r) => r.season_key),
  )].sort();

  const data: ChartRow[] = seasons.map((s) => {
    const row: ChartRow = { season: s };
    for (const team of TOP6) {
      const r = rows.find((d) => d.team_key === team && d.season_key === s);
      if (r && r.pts > 0) row[team] = r.pts;
    }
    return row;
  });

  // Only include teams that have at least one season of data
  const teams = TOP6.filter((t) => data.some((d) => d[t] != null));

  return { teams, data };
}

const TeamSeasonComparison = () => {
  const [chart, setChart] = useState<{ teams: string[]; data: ChartRow[] }>({ teams: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamSummary()
      .then((rows) => setChart(buildChart(rows)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Top 6 — Points Across Seasons
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Final league points per season · traditional top 6
        </p>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-64 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-64 flex items-center">Failed: {error}</p>}
      {!loading && !error && chart.data.length === 0 && (
        <p className="text-xs text-muted-foreground h-64 flex items-center">No data available</p>
      )}

      {!loading && !error && chart.data.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="season"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[20, 100]}
                ticks={[20, 40, 60, 80, 100]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 12%)',
                  border: '1px solid hsl(220, 14%, 22%)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'hsl(210, 20%, 92%)',
                  fontFamily: 'JetBrains Mono',
                }}
                formatter={(value: number, name: string) => [`${value} pts`, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={(value) => (
                  <span style={{ color: TEAM_COLORS[value] ?? '#94A3B8', fontSize: '10px' }}>
                    {value}
                  </span>
                )}
              />
              {chart.teams.map((team) => (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  stroke={TEAM_COLORS[team] ?? '#94A3B8'}
                  strokeWidth={team === 'Chelsea' ? 2.5 : 1.5}
                  strokeOpacity={team === 'Chelsea' ? 1 : 0.7}
                  dot={{ r: 3, strokeWidth: 0, fill: TEAM_COLORS[team] ?? '#94A3B8' }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TeamSeasonComparison;
