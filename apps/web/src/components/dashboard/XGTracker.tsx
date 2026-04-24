import { useEffect, useState } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchTeamForm, type TeamForm } from '@/lib/api';

interface XGTrackerProps {
  season: string;
}

interface ChartRow {
  matchday: number;
  pts: number;
  xPts: number | null;
  gap: number | null;
  xG: number | null;
  xGA: number | null;
  gf: number;
  ga: number;
}

function ordinal(n: number): string {
  const v = n % 100;
  const s = ['th', 'st', 'nd', 'rd'];
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function buildRows(rows: TeamForm[]): ChartRow[] {
  return rows
    .filter((r) => r.team_key === 'Chelsea')
    .sort((a, b) => a.matchday - b.matchday)
    .map((r) => ({
      matchday: r.matchday,
      pts: r.cumul_pts,
      xPts: r.cumul_xpts,
      gap: r.cumul_xpts != null ? Math.round((r.cumul_xpts - r.cumul_pts) * 10) / 10 : null,
      xG: r.cumul_xg,
      xGA: r.cumul_xga,
      gf: r.cumul_gf,
      ga: r.cumul_ga,
    }));
}

function computeXGRanks(allRows: TeamForm[], season: string) {
  const seasonRows = allRows.filter((r) => r.season_key === season);
  const teams = [...new Set(seasonRows.map((r) => r.team_key))];
  const stats = teams.map((team) => {
    const last = seasonRows
      .filter((r) => r.team_key === team)
      .sort((a, b) => b.matchday - a.matchday)[0];
    return { team, xg: last?.cumul_xg ?? null, xga: last?.cumul_xga ?? null };
  }).filter((t) => t.xg != null);

  const byXG  = [...stats].sort((a, b) => (b.xg  ?? 0) - (a.xg  ?? 0));
  const byXGA = [...stats].sort((a, b) => (a.xga ?? 0) - (b.xga ?? 0));

  return {
    xgRank:  byXG.findIndex((t) => t.team === 'Chelsea') + 1,
    xgaRank: byXGA.findIndex((t) => t.team === 'Chelsea') + 1,
    n: stats.length,
  };
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

const PtsTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: ChartRow = payload[0].payload;
  const gap = d.gap;
  return (
    <div style={{
      backgroundColor: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(220, 14%, 22%)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minWidth: 160,
    }}>
      <p style={{ color: 'hsl(215,15%,55%)', marginBottom: 6 }}>Matchday {label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
        <span style={{ color: 'hsl(215,15%,60%)' }}>Actual pts</span>
        <span style={{ color: '#D4AF37', fontWeight: 700 }}>{d.pts}</span>
      </div>
      {d.xPts != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <span style={{ color: 'hsl(215,15%,60%)' }}>xPts</span>
          <span style={{ color: 'hsl(215,15%,75%)' }}>{d.xPts.toFixed(1)}</span>
        </div>
      )}
      {gap != null && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 16,
          marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(220,14%,22%)',
        }}>
          <span style={{ color: 'hsl(215,15%,60%)' }}>Gap</span>
          <span style={{ color: gap > 0 ? 'hsl(216,85%,65%)' : '#f87171', fontWeight: 600 }}>
            {gap > 0 ? '+' : ''}{gap.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
};

const XGTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: ChartRow = payload[0].payload;
  const conv = d.xG != null ? d.gf - d.xG : null;
  const stop = d.xGA != null ? d.xGA - d.ga : null;
  return (
    <div style={{
      backgroundColor: 'hsl(220, 18%, 10%)',
      border: '1px solid hsl(220, 14%, 22%)',
      borderRadius: 8, padding: '10px 14px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minWidth: 170,
    }}>
      <p style={{ color: 'hsl(215,15%,55%)', marginBottom: 6 }}>Matchday {label}</p>
      <div style={{ marginBottom: 6 }}>
        <p style={{ color: 'hsl(215,15%,45%)', fontSize: 9, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Attack</p>
        {d.xG != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <span style={{ color: 'hsl(215,15%,60%)' }}>xG (expected)</span>
            <span style={{ color: '#D4AF37' }}>{d.xG.toFixed(1)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'hsl(215,15%,60%)' }}>GF (actual)</span>
          <span style={{ color: '#fde68a', fontWeight: 600 }}>{d.gf}</span>
        </div>
        {conv != null && (
          <div style={{ fontSize: 10, color: conv >= 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
            {conv >= 0 ? '+' : ''}{conv.toFixed(1)} vs xG
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid hsl(220,14%,22%)', paddingTop: 6 }}>
        <p style={{ color: 'hsl(215,15%,45%)', fontSize: 9, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 1 }}>Defence</p>
        {d.xGA != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <span style={{ color: 'hsl(215,15%,60%)' }}>xGA (expected)</span>
            <span style={{ color: '#f87171' }}>{d.xGA.toFixed(1)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'hsl(215,15%,60%)' }}>GA (actual)</span>
          <span style={{ color: '#fca5a5', fontWeight: 600 }}>{d.ga}</span>
        </div>
        {stop != null && (
          <div style={{ fontSize: 10, color: stop >= 0 ? '#4ade80' : '#f87171', marginTop: 2 }}>
            {stop >= 0 ? '+' : ''}{stop.toFixed(1)} vs xGA
          </div>
        )}
      </div>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const XGTracker = ({ season }: XGTrackerProps) => {
  const [allRows, setAllRows] = useState<TeamForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<'pts' | 'xg'>('pts');

  useEffect(() => {
    fetchTeamForm()
      .then(setAllRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const data    = buildRows(allRows.filter((r) => r.season_key === season));
  const hasXPts = data.some((d) => d.xPts != null);
  const hasXG   = data.some((d) => d.xG  != null);

  const lastRow = data.length > 0 ? data[data.length - 1] : null;
  const lastGap = lastRow?.gap ?? null;
  const lastXGD = lastRow?.xG != null && lastRow?.xGA != null
    ? Math.round((lastRow.xG - lastRow.xGA) * 10) / 10 : null;

  // League-wide xG rankings (computed from all teams' season-end totals)
  const ranks = computeXGRanks(allRows, season);

  // Conversion & shot-stopping deltas (season totals)
  const conversion   = lastRow?.xG  != null ? lastRow.gf - lastRow.xG  : null;
  const shotStopping = lastRow?.xGA != null ? lastRow.xGA - lastRow.ga : null;

  const tabConfig = {
    pts: {
      title: 'Pts vs xPts',
      sub: `Cumulative pts vs xPts · Chelsea · ${season}`,
      badge: lastGap != null ? (lastGap > 0 ? `+${lastGap.toFixed(1)}` : lastGap.toFixed(1)) : null,
      badgeColor: lastGap == null ? '' : lastGap > 0 ? 'hsl(216,85%,65%)' : '#f87171',
      badgeSub: lastGap == null ? '' : lastGap > 0 ? 'pts below quality' : 'pts above quality',
    },
    xg: {
      title: 'xG vs xGA',
      sub: `Cumulative xG & GF vs xGA & GA · Chelsea · ${season}`,
      badge: lastXGD != null ? (lastXGD > 0 ? `+${lastXGD.toFixed(1)}` : lastXGD.toFixed(1)) : null,
      badgeColor: lastXGD == null ? '' : lastXGD > 0 ? '#4ade80' : '#f87171',
      badgeSub: lastXGD == null ? '' : lastXGD > 0 ? 'xG advantage' : 'xG deficit',
    },
  };
  const cfg = tabConfig[tab];

  const sharedAxis = (
    <>
      <XAxis
        dataKey="matchday"
        type="number"
        domain={[1, 38]}
        ticks={[1, 10, 20, 30, 38]}
        tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)' }}
        axisLine={false} tickLine={false}
        label={{ value: 'Matchday', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'hsl(215, 15%, 45%)' }}
      />
      <YAxis
        tick={{ fontSize: 10, fill: 'hsl(215, 15%, 55%)', fontFamily: 'JetBrains Mono' }}
        axisLine={false} tickLine={false} width={28}
      />
    </>
  );

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {(['pts', 'xg'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  tab === t
                    ? 'bg-chelsea-gold/20 text-chelsea-gold border border-chelsea-gold/40'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tabConfig[t].title}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{cfg.sub}</p>
        </div>
        {cfg.badge != null && (
          <div className="text-right">
            <p className="text-lg font-bold font-mono" style={{ color: cfg.badgeColor }}>{cfg.badge}</p>
            <p className="text-[10px] text-muted-foreground">{cfg.badgeSub}</p>
          </div>
        )}
      </div>

      {loading && <div className="h-64 flex items-center"><p className="text-xs text-muted-foreground">Loading…</p></div>}
      {error   && <div className="h-64 flex items-center"><p className="text-xs text-destructive">Failed: {error}</p></div>}
      {!loading && !error && data.length === 0 && (
        <div className="h-64 flex items-center"><p className="text-xs text-muted-foreground">No data for {season}</p></div>
      )}

      {/* Pts vs xPts tab */}
      {!loading && !error && data.length > 0 && tab === 'pts' && (
        hasXPts ? (
          <>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  {sharedAxis}
                  <Tooltip content={<PtsTooltip />} />
                  <ReferenceLine y={0} stroke="hsl(220,14%,28%)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="xPts" name="xPts"
                    stroke="hsl(216,85%,60%)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />
                  <Line type="monotone" dataKey="pts" name="Actual pts"
                    stroke="#D4AF37" strokeWidth={2.5} dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-6">
              <span className="text-[10px] text-muted-foreground">
                <span className="text-chelsea-gold font-mono font-semibold">Gold</span> — actual pts
              </span>
              <span className="text-[10px] text-muted-foreground">
                <span style={{ color: 'hsl(216,85%,60%)' }} className="font-mono font-semibold">Blue dashed</span> — xPts
              </span>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center"><p className="text-xs text-muted-foreground">xPts not available for {season}</p></div>
        )
      )}

      {/* xG vs xGA tab */}
      {!loading && !error && data.length > 0 && tab === 'xg' && (
        hasXG ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                  {sharedAxis}
                  <Tooltip content={<XGTooltip />} />
                  {/* expected */}
                  <Line type="monotone" dataKey="xG"  name="xG (expected)"
                    stroke="#D4AF37" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
                  <Line type="monotone" dataKey="xGA" name="xGA (expected)"
                    stroke="#f87171" strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
                  {/* actual */}
                  <Line type="monotone" dataKey="gf" name="GF (actual)"
                    stroke="#D4AF37" strokeWidth={2.5} dot={false} connectNulls />
                  <Line type="monotone" dataKey="ga" name="GA (actual)"
                    stroke="#f87171" strokeWidth={2.5} dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              <span className="text-[10px] text-muted-foreground">
                <span className="text-chelsea-gold font-mono font-semibold">Gold solid</span> — GF actual
              </span>
              <span className="text-[10px] text-muted-foreground">
                <span className="text-chelsea-gold font-mono font-semibold opacity-60">Gold dashed</span> — xG expected
              </span>
              <span className="text-[10px] text-muted-foreground">
                <span style={{ color: '#f87171' }} className="font-mono font-semibold">Red solid</span> — GA actual
              </span>
              <span className="text-[10px] text-muted-foreground">
                <span style={{ color: '#f87171' }} className="font-mono font-semibold opacity-60">Red dashed</span> — xGA expected
              </span>
            </div>

            {/* League ranking + conversion stats */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
              {ranks.xgRank > 0 && (
                <div className="rounded border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Attack rank</p>
                  <p className="text-sm font-bold font-mono text-chelsea-gold">{ordinal(ranks.xgRank)}</p>
                  <p className="text-[9px] text-muted-foreground">in PL xG</p>
                </div>
              )}
              {ranks.xgaRank > 0 && (
                <div className="rounded border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Defence rank</p>
                  <p className="text-sm font-bold font-mono text-chelsea-gold">{ordinal(ranks.xgaRank)}</p>
                  <p className="text-[9px] text-muted-foreground">in PL xGA (lower = better)</p>
                </div>
              )}
              {conversion != null && (
                <div className="rounded border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Conversion</p>
                  <p className={`text-sm font-bold font-mono ${conversion >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                    {conversion >= 0 ? '+' : ''}{conversion.toFixed(1)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">GF vs xG</p>
                </div>
              )}
              {shotStopping != null && (
                <div className="rounded border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Shot-stopping</p>
                  <p className={`text-sm font-bold font-mono ${shotStopping >= 0 ? 'text-green-400' : 'text-destructive'}`}>
                    {shotStopping >= 0 ? '+' : ''}{shotStopping.toFixed(1)}
                  </p>
                  <p className="text-[9px] text-muted-foreground">xGA saved vs expected</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center"><p className="text-xs text-muted-foreground">xG data not available for {season}</p></div>
        )
      )}
    </div>
  );
};

export default XGTracker;
