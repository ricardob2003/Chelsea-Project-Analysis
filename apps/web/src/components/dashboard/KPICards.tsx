import { kpiData } from '@/data/chelseaData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KPICards = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpiData.map((kpi, i) => (
        <div
          key={kpi.label}
          className="stat-gradient rounded-lg border border-border p-4 animate-slide-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            {kpi.label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {kpi.value}
            </span>
            {kpi.unit && (
              <span className="text-xs text-muted-foreground font-mono">{kpi.unit}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {kpi.change > 0 ? (
              <TrendingUp className="w-3 h-3 kpi-positive" />
            ) : kpi.change < 0 ? (
              <TrendingDown className="w-3 h-3 kpi-negative" />
            ) : (
              <Minus className="w-3 h-3 kpi-neutral" />
            )}
            <span
              className={`text-xs font-mono ${
                kpi.change > 0 ? 'kpi-positive' : kpi.change < 0 ? 'kpi-negative' : 'kpi-neutral'
              }`}
            >
              {kpi.change > 0 ? '+' : ''}{kpi.change}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">{kpi.changeLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
