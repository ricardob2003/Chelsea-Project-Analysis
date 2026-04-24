import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchTeamSummary, type TeamSeasonSummary } from '@/lib/api';
import { TEAM_COLORS } from '@/lib/teamColors';

const TOP6 = ['Chelsea', 'Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'];

type ChartRow = Record<string, string | number>;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const entries = payload
    .filter((p: any) => p.value != null)
    .map((p: any) => ({ name: p.name as string, pts: p.value as number, color: p.stroke }))
    .sort((a: any, b: any) => b.pts - a.pts);

  const leaderPts = entries[0]?.pts ?? 0;

  return (
    <div style={{
      backgroundColor: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(38, 92%, 50%)',
      borderRadius: 10,
      padding: '10px 14px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
      minWidth: 210,
    }}>
      <p style={{ color: 'hsl(215,15%,55%)', marginBottom: 8, fontSize: 10 }}>{label}</p>
      {entries.map((e: any, i: number) => {
        const gap = e.pts - leaderPts;
        const isChelsea = e.name === 'Chelsea';
        return (
          <div key={e.name} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: i < entries.length - 1 ? 5 : 0,
            paddingBottom: i < entries.length - 1 ? 5 : 0,
            borderBottom: i < entries.length - 1 ? '1px solid hsl(220,14%,18%)' : 'none',
          }}>
            <span style={{ color: 'hsl(215,15%,50%)', width: 14, textAlign: 'right', flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: e.color, flexShrink: 0,
            }} />
            <span style={{
              flex: 1,
              color: isChelsea ? '#D4AF37' : 'hsl(210,20%,85%)',
              fontWeight: isChelsea ? 700 : 400,
            }}>
              {e.name}
            </span>
            <span style={{ color: isChelsea ? '#D4AF37' : 'hsl(210,20%,85%)', fontWeight: 600 }}>
              {e.pts}
            </span>
            {gap < 0 && (
              <span style={{ color: 'hsl(215,15%,45%)', fontSize: 10, width: 28, textAlign: 'right' }}>
                {gap}
              </span>
            )}
            {gap === 0 && (
              <span style={{ color: 'hsl(38,92%,50%)', fontSize: 10, width: 28, textAlign: 'right' }}>
                ldr
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

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

  const teams = TOP6.filter((t) => data.some((d) => d[t] != null));
  return { teams, data };
}

const Top6History = () => {
  const [chart, setChart]     = useState<{ teams: string[]; data: ChartRow[] }>({ teams: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchTeamSummary()
      .then((rows) => setChart(buildChart(rows)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5 flex flex-col h-full">
      {/* Header */}
      <div className="mb-3 shrink-0">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Top 6 — Points Across Seasons
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Final league points per season · traditional top 6
        </p>
      </div>

      {/* Inline legend */}
      {!loading && !error && chart.teams.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 shrink-0">
          {chart.teams.map((team) => (
            <div key={team} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: TEAM_COLORS[team] ?? '#94A3B8' }}
              />
              <span
                className="text-[10px] font-mono"
                style={{
                  color: team === 'Chelsea' ? '#D4AF37' : 'hsl(215,15%,60%)',
                  fontWeight: team === 'Chelsea' ? 700 : 400,
                }}
              >
                {team}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chart — flex-1 so it fills remaining card height */}
      {loading && <p className="text-xs text-muted-foreground flex-1 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive flex-1 flex items-center">Failed: {error}</p>}
      {!loading && !error && chart.data.length === 0 && (
        <p className="text-xs text-muted-foreground flex-1 flex items-center">No data available</p>
      )}

      {!loading && !error && chart.data.length > 0 && (
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart.data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <XAxis
                dataKey="season"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[20, 105]}
                ticks={[20, 40, 60, 80, 100]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={72}
                stroke="hsl(142, 71%, 35%)"
                strokeDasharray="4 3"
                label={{ value: 'UCL ~72', position: 'insideTopRight', fontSize: 9, fill: 'hsl(142, 71%, 45%)' }}
              />
              {chart.teams.map((team) => (
                <Line
                  key={team}
                  type="monotone"
                  dataKey={team}
                  stroke={TEAM_COLORS[team] ?? '#94A3B8'}
                  strokeWidth={team === 'Chelsea' ? 2.5 : 1.5}
                  strokeOpacity={team === 'Chelsea' ? 1 : 0.55}
                  dot={{ r: team === 'Chelsea' ? 4 : 3, strokeWidth: 0, fill: TEAM_COLORS[team] ?? '#94A3B8', fillOpacity: team === 'Chelsea' ? 1 : 0.6 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
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

export default Top6History;
