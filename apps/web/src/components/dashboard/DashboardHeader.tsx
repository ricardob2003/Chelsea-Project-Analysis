import { Shield, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Season, SEASONS } from '@/data/transferData';

interface DashboardHeaderProps {
  season: Season;
  onSeasonChange: (season: Season) => void;
}

const DashboardHeader = ({ season, onSeasonChange }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center glow-blue">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Chelsea FC — Recruitment Intelligence
          </h1>
          <p className="text-xs text-muted-foreground">
            Decision-support system · {season} Season Analysis
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Select value={season} onValueChange={(v) => onSeasonChange(v as Season)}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="w-3.5 h-3.5" />
          <span className="font-mono">Last sync: 2h ago</span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
