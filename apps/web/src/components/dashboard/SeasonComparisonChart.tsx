import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { fetchTeamSummary } from '@/lib/api';

// Colour by league position tier
function barColor(rank: number): string {
  if (rank <= 4) return 'hsl(142, 71%, 45%)';   // UCL — green
  if (rank <= 6) return 'hsl(38, 92%, 50%)';    // Europa — gold
  if (rank <= 10) return 'hsl(216, 85%, 45%)';  // mid table — blue
  return 'hsl(0, 72%, 51%)';                    // bottom half — red
}

interface ChartRow {
  season: string;
  pts: number;
  rank: number;
  vsChampion: number;
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
          .sort((a, b) => a.season_key.localeCompare(b.season_key))
          .map((r) => ({
            season: r.season_key,
            pts: r.pts,
            rank: r.table_rank,
            vsChampion: r.pts_vs_champion,
          }));
        setData(chelsea);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Season-over-Season Performance
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Points per season · coloured by finish tier
        </p>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-56 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-56 flex items-center">Failed: {error}</p>}

      {!loading && !error && data.length > 0 && (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 10%)',
                  border: '1px solid hsl(38, 92%, 50%)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'hsl(210, 20%, 92%)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '13px',
                  lineHeight: '1.8',
                }}
                labelStyle={{ color: '#D4AF37', fontWeight: 700, fontSize: '14px' }}
                labelFormatter={(label) => `${label}`}
                formatter={(value: number, _: string, props: any) => {
                  const rank = props.payload.rank;
                  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
                  const delta = props.payload.vsChampion;
                  return [`${value} pts · ${rank}${suffix} · vs 1st: ${delta}`, 'Chelsea FC'];
                }}
              />
              {/* UCL cutoff reference lines */}
              <ReferenceLine y={76} stroke="hsl(142, 71%, 35%)" strokeDasharray="3 3"
                label={{ value: 'PL record', position: 'insideTopRight', fontSize: 9, fill: 'hsl(142, 71%, 45%)' }} />
              <Bar dataKey="pts" radius={[4, 4, 0, 0]} barSize={32}>
                {data.map((entry) => (
                  <Cell key={entry.season} fill={barColor(entry.rank)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && (
        <div className="flex items-center gap-4 mt-3">
          {[
            { label: 'UCL (top 4)', color: 'hsl(142, 71%, 45%)' },
            { label: 'Europa (5-6)', color: 'hsl(38, 92%, 50%)' },
            { label: 'Mid (7-10)', color: 'hsl(216, 85%, 45%)' },
            { label: 'Bottom half', color: 'hsl(0, 72%, 51%)' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeasonComparisonChart;
