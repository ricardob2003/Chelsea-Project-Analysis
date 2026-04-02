import { useEffect, useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { fetchTeamForm, type TeamForm } from '@/lib/api';

interface XGTrackerProps {
  season: string;
}

interface ChartRow {
  matchday: number;
  goals: number;
  xG: number | null;
  luckGap: number | null;  // cumul_xpts - cumul_pts (positive = deserved more)
}

function buildRows(rows: TeamForm[]): ChartRow[] {
  return rows
    .filter((r) => r.team_key === 'Chelsea')
    .sort((a, b) => a.matchday - b.matchday)
    .map((r) => ({
      matchday: r.matchday,
      goals: r.cumul_gf,
      xG: r.cumul_xg,
      luckGap: r.cumul_luck_gap,
    }));
}

const XGTracker = ({ season }: XGTrackerProps) => {
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
  const data = buildRows(seasonRows);
  const hasXG = data.some((d) => d.xG != null);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          xG Performance Tracker
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Chelsea cumulative goals vs xG · luck gap · {season}
        </p>
      </div>

      {loading && <p className="text-xs text-muted-foreground h-64 flex items-center">Loading…</p>}
      {error   && <p className="text-xs text-destructive h-64 flex items-center">Failed: {error}</p>}
      {!loading && !error && data.length === 0 && (
        <p className="text-xs text-muted-foreground h-64 flex items-center">No data for {season}</p>
      )}
      {!loading && !error && data.length > 0 && !hasXG && (
        <p className="text-xs text-muted-foreground h-64 flex items-center">
          xG data not available for {season}
        </p>
      )}

      {!loading && !error && data.length > 0 && hasXG && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <XAxis
                dataKey="matchday"
                type="number"
                domain={[1, 38]}
                ticks={[1, 10, 20, 30, 38]}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Matchday', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'hsl(215, 15%, 45%)' }}
              />
              {/* Left axis — cumulative goals */}
              <YAxis
                yAxisId="goals"
                orientation="left"
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              {/* Right axis — luck gap (centred around 0) */}
              <YAxis
                yAxisId="luck"
                orientation="right"
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
                labelFormatter={(v) => `Matchday ${v}`}
                formatter={(value: number, name: string) => [
                  typeof value === 'number' ? value.toFixed(1) : value,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
              />
              <ReferenceLine yAxisId="luck" y={0} stroke="hsl(220, 14%, 30%)" strokeDasharray="3 3" />

              {/* Luck gap shaded area — positive = deserved more than results gave */}
              <Area
                yAxisId="luck"
                type="monotone"
                dataKey="luckGap"
                name="Luck Gap (xPts−Pts)"
                stroke="hsl(216, 85%, 55%)"
                fill="hsl(216, 85%, 45%)"
                fillOpacity={0.15}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
              {/* xG line */}
              <Line
                yAxisId="goals"
                type="monotone"
                dataKey="xG"
                name="Cumul. xG"
                stroke="hsl(215, 15%, 55%)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                connectNulls
              />
              {/* Actual goals line — Chelsea gold */}
              <Line
                yAxisId="goals"
                type="monotone"
                dataKey="goals"
                name="Cumul. Goals"
                stroke="#D4AF37"
                strokeWidth={2.5}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Reading guide */}
      {!loading && !error && data.length > 0 && hasXG && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-[10px] text-muted-foreground">
            <span className="text-chelsea-gold font-mono">Gold line</span> above dashed = converting above xG
          </div>
          <div className="text-[10px] text-muted-foreground">
            <span style={{ color: 'hsl(216, 85%, 55%)' }} className="font-mono">Blue area</span> above 0 = quality deserved better results
          </div>
        </div>
      )}
    </div>
  );
};

export default XGTracker;
