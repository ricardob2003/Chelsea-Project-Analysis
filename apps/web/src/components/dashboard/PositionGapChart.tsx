import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { fetchRecruitmentPriority, type RecruitmentPriority } from '@/lib/api';

interface PositionGapChartProps {
  season: string;
}

interface ChartRow {
  position: string;
  shortName: string;
  gapScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  chelseaGpA: number;
  top4GpA: number | null;
}

const priorityColors: Record<string, string> = {
  critical: 'hsl(0, 72%, 51%)',
  high:     'hsl(38, 92%, 50%)',
  medium:   'hsl(216, 85%, 45%)',
  low:      'hsl(142, 71%, 45%)',
};

function toPriority(gap: number): ChartRow['priority'] {
  const abs = Math.abs(gap);
  if (abs >= 0.15) return 'critical';
  if (abs >= 0.10) return 'high';
  if (abs >= 0.05) return 'medium';
  return 'low';
}

function toChartRows(rows: RecruitmentPriority[]): ChartRow[] {
  return rows
    .map((r) => {
      const gap = r.gap_g_plus_a_per90 ?? 0; // negative = Chelsea behind
      return {
        position: r.position_group,
        shortName: r.position_group,
        gapScore: Math.round(Math.abs(gap) * 100), // scale to 0-20 range
        priority: gap < 0 ? toPriority(gap) : 'low',
        chelseaGpA: r.chelsea_g_plus_a_per90,
        top4GpA: r.top4_g_plus_a_per90,
      };
    })
    .sort((a, b) => b.gapScore - a.gapScore);
}

const PositionGapChart = ({ season }: PositionGapChartProps) => {
  const [data, setData] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecruitmentPriority()
      .then((rows) => {
        const filtered = rows.filter((r) => r.season_key === season);
        setData(toChartRows(filtered));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [season]);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Performance Gap by Position
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Chelsea G+A/90 vs top-4 benchmark · {season}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(['critical', 'high', 'medium', 'low'] as const).map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors[p] }} />
              <span className="text-[10px] text-muted-foreground capitalize">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-64 flex items-center">Loading...</p>}
      {error && <p className="text-xs text-destructive h-64 flex items-center">Failed to load: {error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-xs text-muted-foreground h-64 flex items-center">No data for {season}</p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis
                type="number"
                domain={[0, 20]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fontSize: 11, fill: 'hsl(210, 20%, 85%)', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 12%)',
                  border: '1px solid hsl(220, 14%, 22%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(210, 20%, 92%)',
                  fontFamily: 'JetBrains Mono',
                }}
                formatter={(value: number, _: string, props: any) => [
                  `Gap: ${value} | Chelsea: ${props.payload.chelseaGpA?.toFixed(3)} | Top4: ${props.payload.top4GpA?.toFixed(3) ?? 'N/A'}`,
                  props.payload.position,
                ]}
              />
              <ReferenceLine x={10} stroke="hsl(220, 14%, 25%)" strokeDasharray="3 3" />
              <Bar dataKey="gapScore" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry) => (
                  <Cell key={entry.position} fill={priorityColors[entry.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PositionGapChart;
