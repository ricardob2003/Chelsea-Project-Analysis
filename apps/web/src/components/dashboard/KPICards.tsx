import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchTeamSummary, type TeamSeasonSummary } from '@/lib/api';

interface KPICardsProps {
  season: string;
}

interface KPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  unit?: string;
}

function deriveKPIs(current: TeamSeasonSummary, prev: TeamSeasonSummary | undefined): KPI[] {
  const ptsChange = prev ? current.pts - prev.pts : 0;
  const rankChange = prev ? prev.table_rank - current.table_rank : 0; // positive = improved
  const gd = current.gd;
  const gdChange = prev ? current.gd - prev.gd : 0;
  const xgd = current.xgd != null ? current.xgd : null;
  const xgdChange = prev?.xgd != null && current.xgd != null ? current.xgd - prev.xgd : 0;
  const ppm = current.pts_per_match;
  const ppmChange = prev ? Math.round((current.pts_per_match - prev.pts_per_match) * 100) / 100 : 0;
  const vsUCL = current.pts_vs_ucl_cutoff;
  const vsUCLChange = prev ? current.pts_vs_ucl_cutoff - prev.pts_vs_ucl_cutoff : 0;

  return [
    {
      label: 'League Position',
      value: String(current.table_rank),
      change: rankChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: '',
    },
    {
      label: 'Points Total',
      value: String(current.pts),
      change: ptsChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: 'pts',
    },
    {
      label: 'xG Differential',
      value: xgd != null ? (xgd >= 0 ? `+${xgd.toFixed(1)}` : xgd.toFixed(1)) : 'N/A',
      change: xgdChange,
      changeLabel: 'xG − xGA',
      unit: '',
    },
    {
      label: 'vs UCL Cutoff',
      value: vsUCL >= 0 ? `+${vsUCL}` : String(vsUCL),
      change: vsUCLChange,
      changeLabel: `cutoff: ${current.ucl_cutoff_pts} pts`,
      unit: 'pts',
    },
    {
      label: 'Points / Match',
      value: ppm.toFixed(2),
      change: ppmChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: '',
    },
    {
      label: 'Goal Difference',
      value: gd >= 0 ? `+${gd}` : String(gd),
      change: gdChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: '',
    },
  ];
}

const KPICards = ({ season }: KPICardsProps) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamSummary()
      .then((data) => {
        const chelsea = data
          .filter((r) => r.team_key === 'Chelsea')
          .sort((a, b) => b.season_key.localeCompare(a.season_key));

        const current = chelsea.find((r) => r.season_key === season);
        const prev = chelsea.find((r) => r.season_key < season);

        if (current) setKpis(deriveKPIs(current, prev));
      })
      .finally(() => setLoading(false));
  }, [season]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="stat-gradient rounded-lg border border-border p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi, i) => (
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
            <span className={`text-xs font-mono ${kpi.change > 0 ? 'kpi-positive' : kpi.change < 0 ? 'kpi-negative' : 'kpi-neutral'}`}>
              {kpi.change > 0 ? '+' : ''}{kpi.change}
            </span>
            <span className="text-xs text-muted-foreground ml-1">{kpi.changeLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
