import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';
import { fetchTeamSummary } from '@/lib/api';

interface TooltipPayload {
  season: string;
  pts: number;
  xpts: number | null;
  rank: number;
  vsChampion: number;
  ptsVsXpts: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: TooltipPayload = payload[0].payload;
  const rank = d.rank;
  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  const delta = d.ptsVsXpts;
  const deltaColor = delta == null ? '' : delta >= 0 ? '#4ade80' : '#f87171';

  return (
    <div style={{
      backgroundColor: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(38, 92%, 50%)',
      borderRadius: 10,
      padding: '12px 16px',
      fontFamily: 'JetBrains Mono, monospace',
      minWidth: 200,
    }}>
      <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <span style={{ color: 'hsl(215,15%,60%)' }}>Actual pts</span>
          <span style={{ color: 'hsl(210,20%,92%)', fontWeight: 600 }}>{d.pts} · {rank}{suffix}</span>
        </div>
        {d.xpts != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
            <span style={{ color: 'hsl(215,15%,60%)' }}>xPts</span>
            <span style={{ color: 'hsl(215,15%,75%)' }}>{d.xpts}</span>
          </div>
        )}
        {delta != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 4, paddingTop: 4, borderTop: '1px solid hsl(220,14%,22%)' }}>
            <span style={{ color: 'hsl(215,15%,60%)' }}>vs xPts</span>
            <span style={{ color: deltaColor, fontWeight: 600 }}>{delta >= 0 ? '+' : ''}{delta}</span>
          </div>
        )}
      </div>
    </div>
  );
};

function barColor(rank: number): string {
  if (rank <= 4) return 'hsl(142, 71%, 45%)';   // UCL — green
  if (rank <= 6) return 'hsl(38, 92%, 50%)';    // Europa — gold
  if (rank <= 10) return 'hsl(216, 85%, 45%)';  // mid table — blue
  return 'hsl(0, 72%, 51%)';                    // bottom half — red
}

interface ChartRow {
  season: string;
  pts: number;
  xpts: number | null;
  rank: number;
  vsChampion: number;
  ptsVsXpts: number | null; // actual - xpts: positive = overperformed
}

const SeasonComparisonChart = () => {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamSummary()
      .then((rows) => {
        const chelsea: ChartRow[] = rows
          .filter((r) => r.team_key === 'Chelsea' && r.pts > 0)
          .sort((a, b) => b.pts - a.pts)
          .map((r) => ({
            season: r.season_key,
            pts: r.pts,
            xpts: r.xpts,
            rank: r.table_rank,
            vsChampion: r.pts_vs_champion,
            ptsVsXpts: r.xpts != null ? Math.round((r.pts - r.xpts) * 10) / 10 : null,
          }));
        setData(chelsea);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Actual vs Expected Points
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ranked highest → lowest pts · bars coloured by finish · dashed = xPts
        </p>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-56 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-56 flex items-center">Failed: {error}</p>}

      {!loading && !error && data.length > 0 && (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <XAxis
                dataKey="season"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* UCL zone reference */}
              <ReferenceLine
                y={72}
                stroke="hsl(142, 71%, 35%)"
                strokeDasharray="4 3"
                label={{ value: 'UCL zone ~72', position: 'insideTopRight', fontSize: 9, fill: 'hsl(142, 71%, 45%)' }}
              />
              <Bar dataKey="pts" radius={[4, 4, 0, 0]} barSize={30} name="pts">
                {data.map((entry) => (
                  <Cell key={entry.season} fill={barColor(entry.rank)} fillOpacity={0.85} />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="xpts"
                stroke="hsl(215, 15%, 65%)"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={{ r: 3, fill: 'hsl(215, 15%, 65%)', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                name="xpts"
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && (
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {[
            { label: 'UCL (top 4)',  color: 'hsl(142, 71%, 45%)' },
            { label: 'Europa (5-6)', color: 'hsl(38, 92%, 50%)' },
            { label: 'Mid (7-10)',   color: 'hsl(216, 85%, 45%)' },
            { label: 'Bottom half', color: 'hsl(0, 72%, 51%)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-5 border-t-2 border-dashed" style={{ borderColor: 'hsl(215, 15%, 65%)' }} />
            <span className="text-[10px] text-muted-foreground">xPts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonComparisonChart;
