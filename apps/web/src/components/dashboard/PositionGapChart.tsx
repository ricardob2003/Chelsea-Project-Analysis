import { positionGaps } from '@/data/chelseaData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const priorityColors: Record<string, string> = {
  critical: 'hsl(0, 72%, 51%)',
  high: 'hsl(38, 92%, 50%)',
  medium: 'hsl(216, 85%, 45%)',
  low: 'hsl(142, 71%, 45%)',
};

const PositionGapChart = () => {
  const sorted = [...positionGaps].sort((a, b) => b.gapScore - a.gapScore);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Performance Gap by Position
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Current rating vs. top-4 benchmark target</p>
        </div>
        <div className="flex items-center gap-3">
          {['critical', 'high', 'medium', 'low'].map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColors[p] }} />
              <span className="text-[10px] text-muted-foreground capitalize">{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20 }}>
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
              formatter={(value: number, _name: string, props: any) => [
                `Gap: ${value} pts | Current: ${props.payload.currentRating} | Target: ${props.payload.targetRating}`,
                props.payload.position,
              ]}
            />
            <ReferenceLine x={10} stroke="hsl(220, 14%, 25%)" strokeDasharray="3 3" />
            <Bar dataKey="gapScore" radius={[0, 4, 4, 0]} barSize={20}>
              {sorted.map((entry) => (
                <Cell key={entry.position} fill={priorityColors[entry.priority]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PositionGapChart;
