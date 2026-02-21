import { squadPlayers } from '@/data/chelseaData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = {
  up: <TrendingUp className="w-3 h-3 kpi-positive" />,
  down: <TrendingDown className="w-3 h-3 kpi-negative" />,
  stable: <Minus className="w-3 h-3 kpi-neutral" />,
};

const ratingColor = (r: number) => {
  if (r >= 7.5) return 'text-success';
  if (r >= 7.0) return 'text-accent';
  if (r >= 6.5) return 'text-warning';
  return 'text-destructive';
};

const SquadTable = () => {
  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
        Squad Performance Overview
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {['Player', 'Pos', 'Age', 'App', 'Rating', 'Trend', 'xG', 'xA', 'Pass%'].map((h) => (
                <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {squadPlayers.map((p, i) => (
              <tr
                key={p.name}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
              >
                <td className="py-2.5 px-2 font-medium text-foreground">{p.name}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.position}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.age}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.appearances}</td>
                <td className={`py-2.5 px-2 font-mono font-semibold ${ratingColor(p.rating)}`}>
                  {p.rating.toFixed(1)}
                </td>
                <td className="py-2.5 px-2">{trendIcons[p.trend]}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.xG?.toFixed(2) ?? '—'}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.xA?.toFixed(2) ?? '—'}</td>
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.passCompletion ? `${p.passCompletion}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SquadTable;
