import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { fetchTeamForm, type TeamForm } from '@/lib/api';

interface TableRow {
  rank: number;
  team_key: string;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  ppm: number;
  xpts: number | null;
}

type SortKey = 'pts' | 'xpts' | 'ga' | 'gd' | 'gf';
type SortDir = 'asc' | 'desc';

function aggregateMatches(matches: TeamForm[]): TableRow[] {
  const teamKeys = [...new Set(matches.map((m) => m.team_key))];
  return teamKeys
    .map((key) => {
      const tm = matches.filter((m) => m.team_key === key);
      if (tm.length === 0) return null;
      const gp  = tm.length;
      const w   = tm.filter((m) => m.points === 3).length;
      const d   = tm.filter((m) => m.points === 1).length;
      const l   = tm.filter((m) => m.points === 0).length;
      const gf  = tm.reduce((s, m) => s + m.goals_for, 0);
      const ga  = tm.reduce((s, m) => s + m.goals_against, 0);
      const pts = tm.reduce((s, m) => s + m.points, 0);
      const hasXpts = tm.some((m) => m.xpts != null);
      const xpts = hasXpts ? Math.round(tm.reduce((s, m) => s + (m.xpts ?? 0), 0) * 10) / 10 : null;
      return { rank: 0, team_key: key, gp, w, d, l, gf, ga, gd: gf - ga, pts, ppm: pts / gp, xpts };
    })
    .filter(Boolean) as TableRow[];
}

function sortRows(rows: TableRow[], key: SortKey, dir: SortDir): TableRow[] {
  const sign = dir === 'desc' ? -1 : 1;
  return [...rows]
    .sort((a, b) => {
      const av = key === 'xpts' ? (a.xpts ?? -Infinity) : a[key];
      const bv = key === 'xpts' ? (b.xpts ?? -Infinity) : b[key];
      if (av !== bv) return sign * (av < bv ? -1 : 1);
      // secondary: pts desc, gd desc, gf desc
      if (a.pts !== b.pts) return b.pts - a.pts;
      if (a.gd !== b.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

function buildTable(matches: TeamForm[], isHome: boolean): TableRow[] {
  return aggregateMatches(matches.filter((m) => m.is_home === isHome))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

function buildCombinedTable(matches: TeamForm[]): TableRow[] {
  return aggregateMatches(matches)
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

const gdFmt = (n: number) => (n > 0 ? `+${n}` : String(n));

const SORTABLE: Set<string> = new Set(['xpts', 'ga', 'gd', 'gf']);

interface HomeAwayTableProps {
  season: string;
}

const HomeAwayTable = ({ season }: HomeAwayTableProps) => {
  const [tab, setTab]         = useState<'combined' | 'home' | 'away'>('combined');
  const [baseRows, setBaseRows] = useState<TableRow[]>([]);
  const [rows, setRows]       = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<TeamForm[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('pts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    fetchTeamForm()
      .then((data) => {
        const seasonData = data.filter((r) => r.season_key === season);
        setAllData(seasonData);
        const built = buildCombinedTable(seasonData);
        setBaseRows(built);
        setRows(built);
      })
      .finally(() => setLoading(false));
  }, [season]);

  useEffect(() => {
    if (allData.length === 0) return;
    const built = tab === 'combined'
      ? buildCombinedTable(allData)
      : buildTable(allData, tab === 'home');
    setBaseRows(built);
    setSortKey('pts');
    setSortDir('desc');
    setRows(built);
  }, [tab, allData]);

  function handleSort(key: SortKey) {
    const nextDir: SortDir =
      sortKey === key ? (sortDir === 'desc' ? 'asc' : 'desc') : 'desc';
    setSortKey(key);
    setSortDir(nextDir);
    setRows(sortRows(baseRows, key, nextDir));
  }

  const cols: { key: keyof TableRow | 'ppm_fmt'; label: string; align: 'left' | 'right' }[] = [
    { key: 'rank',     label: '#',    align: 'right' },
    { key: 'team_key', label: 'Team', align: 'left'  },
    { key: 'gp',       label: 'GP',   align: 'right' },
    { key: 'w',        label: 'W',    align: 'right' },
    { key: 'd',        label: 'D',    align: 'right' },
    { key: 'l',        label: 'L',    align: 'right' },
    { key: 'gf',       label: 'GF',   align: 'right' },
    { key: 'ga',       label: 'GA',   align: 'right' },
    { key: 'gd',       label: 'GD',   align: 'right' },
    { key: 'pts',      label: 'Pts',  align: 'right' },
    { key: 'xpts',     label: 'xPts', align: 'right' },
    { key: 'ppm_fmt',  label: 'PPM',  align: 'right' },
  ];

  if (loading) {
    return (
      <div className="stat-gradient rounded-lg border border-border p-4 mt-3 animate-pulse h-64" />
    );
  }

  return (
    <div className="stat-gradient rounded-lg border border-border mt-3">
      {/* Tab header */}
      <div className="flex items-center gap-1 p-3 border-b border-border">
        {(['combined', 'home', 'away'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              tab === t
                ? 'bg-chelsea-gold/20 text-chelsea-gold border border-chelsea-gold/40'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'combined' ? 'Standings' : t === 'home' ? 'Home' : 'Away'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border">
              {cols.map((c) => {
                const isSortable = SORTABLE.has(c.key as string);
                const isActive   = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    onClick={isSortable ? () => handleSort(c.key as SortKey) : undefined}
                    className={`px-3 py-2 text-[10px] font-medium uppercase tracking-wider select-none ${
                      c.align === 'right' ? 'text-right' : 'text-left'
                    } ${isSortable ? 'cursor-pointer hover:text-foreground' : ''} ${
                      isActive ? 'text-chelsea-gold' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="inline-flex items-center gap-0.5 justify-end w-full">
                      {c.label}
                      {isSortable && (
                        isActive ? (
                          sortDir === 'desc'
                            ? <ChevronDown className="w-3 h-3 shrink-0" />
                            : <ChevronUp className="w-3 h-3 shrink-0" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 shrink-0 opacity-40" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChelsea = row.team_key === 'Chelsea';
              return (
                <tr
                  key={row.team_key}
                  className={`border-b border-border/40 transition-colors ${
                    isChelsea
                      ? 'bg-chelsea-gold/5 border-l-2 border-l-chelsea-gold'
                      : 'hover:bg-secondary/30'
                  }`}
                >
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.rank}</td>
                  <td className={`px-3 py-2 font-medium ${isChelsea ? 'text-chelsea-gold' : 'text-foreground'}`}>
                    {row.team_key}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.gp}</td>
                  <td className="px-3 py-2 text-right text-green-400">{row.w}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.d}</td>
                  <td className="px-3 py-2 text-right text-red-400">{row.l}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.gf}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{row.ga}</td>
                  <td className={`px-3 py-2 text-right ${row.gd > 0 ? 'text-green-400' : row.gd < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {gdFmt(row.gd)}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${isChelsea ? 'text-chelsea-gold' : 'text-foreground'}`}>
                    {row.pts}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.xpts != null ? row.xpts.toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.ppm.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HomeAwayTable;
