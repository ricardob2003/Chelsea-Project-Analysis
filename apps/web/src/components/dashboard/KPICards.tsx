import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchTeamSummary, fetchTeamForm, type TeamSeasonSummary, type TeamForm } from '@/lib/api';

interface KPICardsProps {
  season: string;
}

interface KPI {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  unit?: string;
  note?: string;
  form?: Array<'W' | 'D' | 'L'>; // overrides value display when present
}

function computeForm(matches: TeamForm[]): Array<'W' | 'D' | 'L'> {
  return [...matches]
    .sort((a, b) => a.game_id - b.game_id)
    .slice(-5)
    .map((m) => m.points === 3 ? 'W' : m.points === 1 ? 'D' : 'L');
}

function deriveKPIs(
  current: TeamSeasonSummary,
  prev: TeamSeasonSummary | undefined,
  form: Array<'W' | 'D' | 'L'>,
  xgdFromForm: number | null,
): KPI[] {
  const ptsChange   = prev ? current.pts - prev.pts : 0;
  const rankChange  = prev ? prev.table_rank - current.table_rank : 0;
  const vsUCL       = current.pts_vs_ucl_cutoff;
  const vsUCLChange = prev ? current.pts_vs_ucl_cutoff - prev.pts_vs_ucl_cutoff : 0;
  const ppm         = current.pts_per_match;
  const ppmChange   = prev
    ? Math.round((current.pts_per_match - prev.pts_per_match) * 100) / 100
    : 0;

  const gfpm       = current.mp > 0 ? current.gf / current.mp : 0;
  const prevGfpm   = prev && prev.mp > 0 ? prev.gf / prev.mp : null;
  const gfpmChange = prevGfpm != null
    ? Math.round((gfpm - prevGfpm) * 100) / 100
    : 0;

  const gd       = current.gd;
  const gdChange = prev ? current.gd - prev.gd : 0;
  // Prefer summary xGD; fall back to cumulative xG from per-match data (current season in progress)
  const xgd      = current.xgd ?? xgdFromForm;
  const xgdChange = prev?.xgd != null && xgd != null
    ? Math.round((xgd - prev.xgd) * 10) / 10
    : null;
  const xgdNote = xgd != null
    ? `xGD ${xgd >= 0 ? '+' : ''}${xgd.toFixed(1)}${xgdChange != null ? `  ·  Δ ${xgdChange >= 0 ? '+' : ''}${xgdChange} YoY` : ''}`
    : 'xGD: no data';

  const wins   = form.filter((r) => r === 'W').length;
  const draws  = form.filter((r) => r === 'D').length;
  const losses = form.filter((r) => r === 'L').length;
  // benchmark: 7 pts over 5 games = 2W 1D pace (solid form threshold)
  const formPts = wins * 3 + draws;

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
      label: 'Scoring Rate',
      value: gfpm.toFixed(2),
      change: gfpmChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: 'GF/match',
      note: `${current.gf} goals in ${current.mp} games`,
    },
    {
      label: 'vs UCL Cutoff',
      value: vsUCL >= 0 ? `+${vsUCL}` : String(vsUCL),
      change: vsUCLChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: 'pts',
      note: `UCL cutoff: ${current.ucl_cutoff_pts} pts`,
    },
    {
      label: 'Goal Difference',
      value: gd >= 0 ? `+${gd}` : String(gd),
      change: gdChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      note: xgdNote,
    },
    {
      label: 'Points / Match',
      value: ppm.toFixed(2),
      change: ppmChange,
      changeLabel: prev ? `vs ${prev.season_key}` : 'no prev season',
      unit: '',
    },
    {
      label: 'Current Form',
      value: `${wins}W ${draws}D ${losses}L`,
      change: formPts - 7,
      changeLabel: 'last 5 · vs 2W1D pace',
      form,
    },
  ];
}

const FORM_STYLES: Record<'W' | 'D' | 'L', string> = {
  W: 'bg-green-500/20 text-green-400 border border-green-500/30',
  D: 'bg-muted/40 text-muted-foreground border border-border',
  L: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const KPICards = ({ season }: KPICardsProps) => {
  const [kpis, setKpis]       = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchTeamSummary(), fetchTeamForm()])
      .then(([summary, formData]) => {
        const chelsea = summary
          .filter((r) => r.team_key === 'Chelsea')
          .sort((a, b) => b.season_key.localeCompare(a.season_key));

        const current = chelsea.find((r) => r.season_key === season);
        const prev    = chelsea.find((r) => r.season_key < season);

        const chelseaForm = formData.filter(
          (r) => r.team_key === 'Chelsea' && r.season_key === season,
        );
        const form = computeForm(chelseaForm);

        // Derive xGD from the last match's cumulative totals when the season
        // summary doesn't carry xG yet (current in-progress season)
        const lastMatch = [...chelseaForm].sort((a, b) => a.game_id - b.game_id).at(-1);
        const xgdFromForm =
          lastMatch?.cumul_xg != null && lastMatch?.cumul_xga != null
            ? Math.round((lastMatch.cumul_xg - lastMatch.cumul_xga) * 10) / 10
            : null;

        if (current) setKpis(deriveKPIs(current, prev, form, xgdFromForm));
      })
      .finally(() => setLoading(false));
  }, [season]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="stat-gradient rounded-lg border border-border p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className="stat-gradient rounded-lg border border-border p-4 animate-slide-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
            {kpi.label}
          </p>

          {kpi.form ? (
            <div className="flex gap-1 mb-1">
              {kpi.form.map((result, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-bold font-mono w-5 h-5 flex items-center justify-center rounded ${FORM_STYLES[result]}`}
                >
                  {result}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-xs text-muted-foreground font-mono">{kpi.unit}</span>
              )}
            </div>
          )}

          {kpi.note && (
            <p className="text-[10px] text-muted-foreground font-mono mt-1">{kpi.note}</p>
          )}
          {kpi.form && (
            <p className="text-[10px] text-muted-foreground font-mono mt-1">{kpi.value}</p>
          )}

          <div className="flex items-center gap-1 mt-1.5">
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
