import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { squadPlayers } from '@/data/chelseaData';

interface PitchPlayer {
  name: string;
  position: string;
  x: number; // percentage from left
  y: number; // percentage from top
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

const pitchPlayers: PitchPlayer[] = [
  { name: 'R. Sánchez', position: 'GK', x: 50, y: 90, rating: 7.1, trend: 'up' },
  { name: 'M. Gusto', position: 'RB', x: 80, y: 72, rating: 6.9, trend: 'stable' },
  { name: 'L. Colwill', position: 'CB', x: 38, y: 75, rating: 7.0, trend: 'up' },
  { name: 'W. Fofana', position: 'CB', x: 62, y: 75, rating: 6.5, trend: 'down' },
  { name: 'M. Cucurella', position: 'LB', x: 20, y: 72, rating: 6.8, trend: 'stable' },
  { name: 'M. Caicedo', position: 'CM', x: 50, y: 55, rating: 7.3, trend: 'up' },
  { name: 'E. Fernández', position: 'CM', x: 35, y: 48, rating: 7.1, trend: 'stable' },
  { name: 'C. Palmer', position: 'RW', x: 78, y: 30, rating: 7.8, trend: 'up' },
  { name: 'P. Neto', position: 'LW', x: 22, y: 30, rating: 6.7, trend: 'down' },
  { name: 'N. Jackson', position: 'ST', x: 50, y: 15, rating: 6.9, trend: 'stable' },
  { name: 'N. Madueke', position: 'RW', x: 65, y: 38, rating: 7.0, trend: 'up' },
];

const getRatingColor = (rating: number) => {
  if (rating >= 7.5) return 'bg-chelsea-gold text-chelsea-gold-foreground';
  if (rating >= 7.0) return 'bg-accent text-accent-foreground';
  if (rating >= 6.5) return 'bg-muted text-muted-foreground';
  return 'bg-destructive/80 text-destructive-foreground';
};

const getTrendIndicator = (trend: 'up' | 'down' | 'stable') => {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '–';
};

const PitchFormation = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-card-foreground text-base font-semibold">
          <MapPin className="w-4 h-4 text-chelsea-gold" />
          Roster Breakdown — Typical Positions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[68/105] max-w-[500px] mx-auto rounded-xl overflow-hidden border border-border">
          {/* Pitch background */}
          <div className="absolute inset-0 bg-[hsl(140,45%,22%)]" />

          {/* Pitch markings */}
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-white/20" />
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-[22%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />

          {/* Top penalty area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[44%] h-[17%] border-b border-l border-r border-white/20" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[20%] h-[6%] border-b border-l border-r border-white/20" />

          {/* Bottom penalty area */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[44%] h-[17%] border-t border-l border-r border-white/20" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20%] h-[6%] border-t border-l border-r border-white/20" />

          {/* Pitch outline */}
          <div className="absolute inset-[3%] border border-white/20 rounded-sm" />

          {/* Players */}
          {pitchPlayers.map((player) => (
            <div
              key={player.name}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group z-10"
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
            >
              <div
                className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold shadow-lg border-2 border-white/30 transition-transform group-hover:scale-110 ${getRatingColor(player.rating)}`}
              >
                {player.rating.toFixed(1)}
              </div>
              <div className="bg-background/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-center shadow-md">
                <p className="text-[9px] md:text-[10px] font-semibold text-foreground leading-tight whitespace-nowrap">
                  {player.name}
                </p>
                <p className="text-[8px] md:text-[9px] text-muted-foreground leading-tight">
                  {player.position} {getTrendIndicator(player.trend)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-chelsea-gold" />
            <span className="text-[10px] text-muted-foreground">7.5+ Elite</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-[10px] text-muted-foreground">7.0+ Strong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-[10px] text-muted-foreground">6.5+ Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <span className="text-[10px] text-muted-foreground">&lt;6.5 Concern</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PitchFormation;
