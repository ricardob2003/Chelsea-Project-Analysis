import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { fetchTeamForm, type TeamForm } from '@/lib/api';
import { TEAM_COLORS, teamColor } from '@/lib/teamColors';

interface TeamFormChartProps {
  season: string;
}

type ChartRow = { matchday: number } & Record<string, number>;

function buildChartData(rows: TeamForm[]): { teams: string[]; data: ChartRow[] } {
  const teams = [...new Set(rows.map((r) => r.team_key))].sort((a, b) =>
    a === 'Chelsea' ? -1 : b === 'Chelsea' ? 1 : a.localeCompare(b),
  );
  const matchdays = [...new Set(rows.map((r) => r.matchday))].sort((a, b) => a - b);

  const data: ChartRow[] = matchdays.map((md) => {
    const row: ChartRow = { matchday: md };
    for (const team of teams) {
      const match = rows.find((r) => r.team_key === team && r.matchday === md);
      if (match != null) row[team] = match.cumul_pts;
    }
    return row;
  });

  return { teams, data };
}

const TeamFormChart = ({ season }: TeamFormChartProps) => {
  const [allRows, setAllRows] = useState<TeamForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamForm()
      .then(setAllRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const seasonRows = allRows.filter((r) => r.season_key === season);
  const { teams, data } = buildChartData(seasonRows);
  const isInProgress = data.length > 0 && data.length < 38;

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Season Points Race
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cumulative points by matchday · {season}{isInProgress ? ' · in progress' : ''}
          </p>
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-64 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-64 flex items-center">Failed to load: {error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-xs text-muted-foreground h-64 flex items-center">No data for {season}</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="matchday"
                type="number"
                domain={[1, 38]}
                ticks={[1, 5, 10, 15, 20, 25, 30, 35, 38]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Matchday', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'hsl(215, 15%, 45%)' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
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
                labelFormatter={(v) => `Matchday ${v}`}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                formatter={(value) => (
                  <span style={{ color: TEAM_COLORS[value] ?? 'hsl(210, 20%, 85%)', fontSize: '10px' }}>
                    {value}
                  </span>
                )}
              />
              {teams.map((team, idx) => (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  stroke={teamColor(team, idx)}
                  strokeWidth={team === 'Chelsea' ? 2.5 : 1.5}
                  dot={false}
                  strokeOpacity={team === 'Chelsea' ? 1 : 0.7}
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

export default TeamFormChart;
