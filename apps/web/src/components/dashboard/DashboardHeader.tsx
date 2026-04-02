import { Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DashboardHeaderProps {
  season: string;
  seasons: string[];          // derived from real data — newest first
  onSeasonChange: (s: string) => void;
}

const DashboardHeader = ({ season, seasons, onSeasonChange }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between mb-6">
      {/* ── Left: logo · title · season selector ── */}
      <div className="flex items-center gap-4">
        <img
          src="/Chelsea_FC.svg.png"
          alt="Chelsea FC"
          className="w-10 h-10 object-contain"
        />
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Chelsea FC — Recruitment Intelligence
          </h1>
          <p className="text-xs text-muted-foreground">
            Decision-support system · Historical performance analysis
          </p>
        </div>
        {seasons.length > 0 && (
          <Select value={season} onValueChange={onSeasonChange}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary border-border ml-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Right: live data indicator ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="w-3.5 h-3.5" />
        <span className="font-mono">Live data</span>
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
      </div>
    </header>
  );
};

export default DashboardHeader;
