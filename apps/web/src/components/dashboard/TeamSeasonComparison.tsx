import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Cell, LabelList, ResponsiveContainer, Tooltip,
} from 'recharts';
import { fetchTeamSummary } from '@/lib/api';
import { TEAM_COLORS } from '@/lib/teamColors';

interface RowData {
  team: string;
  pts: number;
  gap: number;   // pts − leader (≤ 0)
  rank: number;
}

interface Props {
  season: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: RowData = payload[0].payload;
  const suffix = d.rank === 1 ? 'st' : d.rank === 2 ? 'nd' : d.rank === 3 ? 'rd' : 'th';
  return (
    <div style={{
      backgroundColor: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(38, 92%, 50%)',
      borderRadius: 8,
      padding: '8px 12px',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11,
    }}>
      <p style={{ color: TEAM_COLORS[d.team] ?? 'hsl(210,20%,85%)', fontWeight: 700, marginBottom: 4 }}>
        {d.team}
      </p>
      <p style={{ color: 'hsl(210,20%,85%)' }}>{d.pts} pts · {d.rank}{suffix}</p>
      {d.gap < 0 && (
        <p style={{ color: 'hsl(215,15%,55%)' }}>{d.gap} vs leader</p>
      )}
    </div>
  );
};

const TeamSeasonComparison = ({ season }: Props) => {
  const [data, setData]     = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchTeamSummary()
      .then((rows) => {
        const TOP6 = ['Chelsea', 'Arsenal', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'];
        const seasonRows = rows.filter(
          (r) => TOP6.includes(r.team_key) && r.season_key === season && r.pts > 0,
        );
        const sorted = [...seasonRows].sort((a, b) => b.pts - a.pts);
        const leaderPts = sorted[0]?.pts ?? 0;
        setData(
          sorted.map((r, i) => ({
            team: r.team_key,
            pts: r.pts,
            gap: r.pts - leaderPts,
            rank: i + 1,
          })),
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [season]);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Top 6 — {season} League Points
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ranked highest → lowest · gap shown vs leader
        </p>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-52 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-52 flex items-center">Failed: {error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-xs text-muted-foreground h-52 flex items-center">No data for {season}</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ left: 8, right: 56, top: 4, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="team"
                width={120}
                tick={({ x, y, payload }) => {
                  const isChelsea = payload.value === 'Chelsea';
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill={isChelsea ? '#D4AF37' : 'hsl(215,15%,65%)'}
                      fontSize={10}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isChelsea ? 700 : 400}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(220,14%,18%)' }} />
              <Bar dataKey="pts" radius={[0, 4, 4, 0]} barSize={18}>
                {data.map((entry) => (
                  <Cell
                    key={entry.team}
                    fill={TEAM_COLORS[entry.team] ?? 'hsl(215,15%,45%)'}
                    fillOpacity={entry.team === 'Chelsea' ? 1 : 0.7}
                  />
                ))}
                <LabelList
                  content={({ x, y, width, height, value, index }) => {
                    if (index == null || data[index] == null) return null;
                    const { gap, team } = data[index];
                    const isChelsea = team === 'Chelsea';
                    const px = (x as number) + (width as number) + 6;
                    const py = (y as number) + (height as number) / 2 + 4;
                    return (
                      <text
                        x={px}
                        y={py}
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                        fill={isChelsea ? '#D4AF37' : 'hsl(215,15%,65%)'}
                        fontWeight={isChelsea ? 700 : 400}
                      >
                        {value}{gap < 0 ? ` (${gap})` : ''}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default TeamSeasonComparison;
