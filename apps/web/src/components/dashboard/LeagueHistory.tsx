import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchTeamSummary, type TeamSeasonSummary } from '@/lib/api';

const getPositionBadge = (pos: number) => {
  if (pos <= 4) return 'bg-chelsea-blue/20 text-chelsea-gold border border-chelsea-gold/30';
  if (pos <= 6) return 'bg-accent/10 text-accent border border-accent/20';
  return 'bg-destructive/10 text-destructive border border-destructive/20';
};

const getTrend = (current: number, previous: number) => {
  if (current < previous) return <TrendingUp className="w-3.5 h-3.5 text-chelsea-gold" />;
  if (current > previous) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
};

const formatDiff = (diff: number) => {
  if (diff === 0) return <span className="text-chelsea-gold">—</span>;
  if (diff > 0) return <span className="text-chelsea-gold">+{diff}</span>;
  return <span className="text-destructive">{diff}</span>;
};

const LeagueHistory = () => {
  const [rows, setRows] = useState<TeamSeasonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamSummary()
      .then((data) => {
        const chelsea = data
          .filter((r) => r.team_key === 'Chelsea')
          .sort((a, b) => b.season_key.localeCompare(a.season_key));
        setRows(chelsea);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground text-base font-semibold">
          <Trophy className="w-4 h-4 text-chelsea-gold" />
          Historical League Finishes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading && (
          <p className="text-xs text-muted-foreground px-6 py-4">Loading...</p>
        )}
        {error && (
          <p className="text-xs text-destructive px-6 py-4">Failed to load: {error}</p>
        )}
        {!loading && !error && (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-medium">Season</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">Pos</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">Pts</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">W</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">D</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">L</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">GF</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">GA</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">GD</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">vs 1st</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center">vs UCL</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.season_key} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-foreground">{row.season_key}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${getPositionBadge(row.table_rank)}`}>
                      {row.table_rank}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-semibold text-foreground">{row.pts}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-foreground">{row.w}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">{row.d}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">{row.l}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-chelsea-gold">{row.gf}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-destructive">{row.ga}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-foreground">
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-medium">
                    {formatDiff(row.pts_vs_champion)}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-medium">
                    {formatDiff(row.pts_vs_ucl_cutoff)}
                  </TableCell>
                  <TableCell className="text-center">
                    {i < rows.length - 1 && getTrend(row.table_rank, rows[i + 1].table_rank)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LeagueHistory;
