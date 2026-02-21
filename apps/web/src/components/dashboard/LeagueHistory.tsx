import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SeasonRecord {
  season: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  firstPlacePoints: number;
  fourthPlacePoints: number;
}

const leagueHistory: SeasonRecord[] = [
  { season: '2024-25', position: 4, points: 63, played: 34, won: 18, drawn: 9, lost: 7, goalsFor: 58, goalsAgainst: 36, firstPlacePoints: 77, fourthPlacePoints: 63 },
  { season: '2023-24', position: 6, points: 63, played: 38, won: 18, drawn: 9, lost: 11, goalsFor: 77, goalsAgainst: 63, firstPlacePoints: 91, fourthPlacePoints: 71 },
  { season: '2022-23', position: 12, points: 44, played: 38, won: 11, drawn: 11, lost: 16, goalsFor: 38, goalsAgainst: 47, firstPlacePoints: 89, fourthPlacePoints: 75 },
  { season: '2021-22', position: 3, points: 74, played: 38, won: 21, drawn: 11, lost: 6, goalsFor: 76, goalsAgainst: 33, firstPlacePoints: 93, fourthPlacePoints: 71 },
  { season: '2020-21', position: 4, points: 67, played: 38, won: 19, drawn: 10, lost: 9, goalsFor: 58, goalsAgainst: 36, firstPlacePoints: 86, fourthPlacePoints: 66 },
  { season: '2019-20', position: 4, points: 66, played: 38, won: 20, drawn: 6, lost: 12, goalsFor: 69, goalsAgainst: 54, firstPlacePoints: 99, fourthPlacePoints: 66 },
];

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
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground text-base font-semibold">
          <Trophy className="w-4 h-4 text-chelsea-gold" />
          Historical League Finishes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
              <TableHead className="text-muted-foreground text-xs font-medium text-center">vs 4th</TableHead>
              <TableHead className="text-muted-foreground text-xs font-medium text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leagueHistory.map((season, i) => {
              const diffFrom1st = season.points - season.firstPlacePoints;
              const diffFrom4th = season.points - season.fourthPlacePoints;
              return (
                <TableRow key={season.season} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-foreground">{season.season}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${getPositionBadge(season.position)}`}>
                      {season.position}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-semibold text-foreground">{season.points}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-foreground">{season.won}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">{season.drawn}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-muted-foreground">{season.lost}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-chelsea-gold">{season.goalsFor}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-destructive">{season.goalsAgainst}</TableCell>
                  <TableCell className="text-center font-mono text-sm text-foreground">
                    {season.goalsFor - season.goalsAgainst > 0 ? '+' : ''}{season.goalsFor - season.goalsAgainst}
                  </TableCell>
                  <TableCell className="text-center font-mono text-sm font-medium">{formatDiff(diffFrom1st)}</TableCell>
                  <TableCell className="text-center font-mono text-sm font-medium">{formatDiff(diffFrom4th)}</TableCell>
                  <TableCell className="text-center">
                    {i < leagueHistory.length - 1 && getTrend(season.position, leagueHistory[i + 1].position)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LeagueHistory;
