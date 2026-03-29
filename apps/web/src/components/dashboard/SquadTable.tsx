import { useEffect, useState } from 'react';
import { fetchSquadStructure, type SquadPlayer } from '@/lib/api';

interface SquadTableProps {
  season: string;
}

const confidenceColor = (c: string) => {
  if (c === 'high')     return 'text-success';
  if (c === 'eligible') return 'text-accent';
  return 'text-muted-foreground';
};

const fmt = (v: number | null, decimals = 2) =>
  v != null ? v.toFixed(decimals) : '—';

const SquadTable = ({ season }: SquadTableProps) => {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSquadStructure()
      .then((data) => {
        const chelsea = data
          .filter((p) => p.team_key === 'Chelsea' && p.season_key === season)
          .sort((a, b) => b.minutes - a.minutes);
        setPlayers(chelsea);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [season]);

  return (
    <div className="stat-gradient rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
        Squad Performance Overview · {season}
      </h3>
      {loading && <p className="text-xs text-muted-foreground py-4">Loading...</p>}
      {error  && <p className="text-xs text-destructive py-4">Failed to load: {error}</p>}
      {!loading && !error && players.length === 0 && (
        <p className="text-xs text-muted-foreground py-4">No data for {season}</p>
      )}
      {!loading && !error && players.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Player', 'Pos', 'Apps', 'Mins', 'G+A/90', 'xG/90', 'xA/90', 'Sample'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-2 px-2 text-muted-foreground font-medium uppercase tracking-wider text-[10px]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.player_id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                >
                  <td className="py-2.5 px-2 font-medium text-foreground">{p.player_name}</td>
                  <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.position_group}</td>
                  <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.matches}</td>
                  <td className="py-2.5 px-2 font-mono text-muted-foreground">{p.minutes}</td>
                  <td className="py-2.5 px-2 font-mono text-chelsea-gold">{fmt(p.g_plus_a_per90)}</td>
                  <td className="py-2.5 px-2 font-mono text-muted-foreground">{fmt(p.xg_per90)}</td>
                  <td className="py-2.5 px-2 font-mono text-muted-foreground">{fmt(p.xa_per90)}</td>
                  <td className={`py-2.5 px-2 font-mono ${confidenceColor(p.sample_confidence)}`}>
                    {p.sample_confidence}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SquadTable;
