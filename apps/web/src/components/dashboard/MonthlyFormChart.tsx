import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { fetchTeamForm, type TeamForm } from '@/lib/api';

interface MonthlyFormChartProps {
  season: string;
}

interface MonthRow {
  month: string;       // "Aug", "Sep", etc.
  monthOrder: number;  // for sorting
  games: number;
  pts: number;
  ppm: number;
  gd: number;
  xgd: number | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthly(matches: TeamForm[]): MonthRow[] {
  const buckets: Record<number, { pts: number; gd: number; xgd: number | null; count: number }> = {};

  for (const m of matches) {
    const month = new Date(m.match_date).getMonth(); // 0-indexed
    if (!buckets[month]) buckets[month] = { pts: 0, gd: 0, xgd: null, count: 0 };
    buckets[month].pts += m.points;
    buckets[month].gd += m.goal_diff;
    if (m.xg != null && m.xg_against != null) {
      buckets[month].xgd = (buckets[month].xgd ?? 0) + (m.xg - m.xg_against);
    }
    buckets[month].count++;
  }

  // PL season runs Aug→May — order months in season order
  const seasonOrder = [7, 8, 9, 10, 11, 0, 1, 2, 3, 4]; // Aug=7 first

  return seasonOrder
    .filter((m) => buckets[m])
    .map((m) => ({
      month: MONTH_NAMES[m],
      monthOrder: m,
      games: buckets[m].count,
      pts: buckets[m].pts,
      ppm: Math.round((buckets[m].pts / buckets[m].count) * 100) / 100,
      gd: buckets[m].gd,
      xgd: buckets[m].xgd != null
        ? Math.round((buckets[m].xgd as number) * 10) / 10
        : null,
    }));
}

const MonthlyFormChart = ({ season }: MonthlyFormChartProps) => {
  const [data, setData] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamForm()
      .then((rows) => {
        const chelsea = rows.filter(
          (r) => r.team_key === 'Chelsea' && r.season_key === season,
        );
        setData(buildMonthly(chelsea));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [season]);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Monthly Form
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Points and goal difference by month · {season}
        </p>
      </div>

      {loading && <div className="h-52 animate-pulse bg-secondary/30 rounded" />}
      {error   && <p className="text-xs text-destructive">Failed: {error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-xs text-muted-foreground">No data for {season}</p>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="pts"
                  orientation="left"
                  tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  label={{ value: 'Pts', angle: -90, position: 'insideLeft', fontSize: 9, fill: 'hsl(215,15%,45%)' }}
                />
                <YAxis
                  yAxisId="gd"
                  orientation="right"
                  tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  label={{ value: 'GD', angle: 90, position: 'insideRight', fontSize: 9, fill: 'hsl(215,15%,45%)' }}
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
                  formatter={(value: number, name: string) => [
                    typeof value === 'number' ? value.toFixed(name === 'PPM' ? 2 : 1) : value,
                    name,
                  ]}
                  labelFormatter={(label, payload) => {
                    const games = payload?.[0]?.payload?.games ?? '';
                    return `${label} (${games} games)`;
                  }}
                />
                <ReferenceLine yAxisId="gd" y={0} stroke="hsl(220, 14%, 30%)" strokeDasharray="3 3" />

                {/* Points bars — coloured by return */}
                <Bar yAxisId="pts" dataKey="pts" name="Points" radius={[3, 3, 0, 0]}>
                  {data.map((d) => (
                    <Cell
                      key={d.month}
                      fill={
                        d.ppm >= 2.0
                          ? '#D4AF37'                     // gold  — strong month
                          : d.ppm >= 1.5
                          ? 'hsl(216, 60%, 45%)'          // blue  — decent
                          : 'hsl(0, 65%, 45%)'            // red   — poor
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>

                {/* GD line */}
                <Line
                  yAxisId="gd"
                  type="monotone"
                  dataKey="gd"
                  name="GD"
                  stroke="hsl(215, 15%, 60%)"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={{ r: 2, fill: 'hsl(215, 15%, 60%)' }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Month summary table */}
          <div className="mt-4 grid gap-1">
            <div className="grid grid-cols-5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">
              <span>Month</span>
              <span className="text-right">Games</span>
              <span className="text-right">Pts</span>
              <span className="text-right">PPM</span>
              <span className="text-right">GD</span>
            </div>
            {data.map((d) => (
              <div
                key={d.month}
                className="grid grid-cols-5 text-[11px] font-mono px-1 py-0.5 rounded hover:bg-secondary/40"
              >
                <span className="text-foreground">{d.month}</span>
                <span className="text-right text-muted-foreground">{d.games}</span>
                <span className="text-right text-foreground">{d.pts}</span>
                <span className={`text-right font-semibold ${
                  d.ppm >= 2.0 ? 'text-chelsea-gold' :
                  d.ppm >= 1.5 ? 'text-foreground' :
                  'text-destructive'
                }`}>
                  {d.ppm.toFixed(2)}
                </span>
                <span className={`text-right ${
                  d.gd > 0 ? 'text-chelsea-gold' :
                  d.gd < 0 ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {d.gd > 0 ? '+' : ''}{d.gd}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyFormChart;
