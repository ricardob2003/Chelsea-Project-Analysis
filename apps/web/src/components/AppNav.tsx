import { NavLink } from 'react-router-dom';
import { Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppNavProps {
  /** If provided, renders a season selector in the nav */
  season?: string;
  seasons?: string[];
  onSeasonChange?: (s: string) => void;
}

const NAV_LINKS = [
  { to: '/',           label: 'Overview'   },
  { to: '/sporting',   label: 'Sporting'   },
  { to: '/financials', label: 'Financials' },
  { to: '/squad',      label: 'Squad'      },
];

const AppNav = ({ season, seasons, onSeasonChange }: AppNavProps) => {
  return (
    <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">

      {/* Left: logo + title */}
      <div className="flex items-center gap-3">
        <img
          src="/Chelsea_FC.svg.png"
          alt="Chelsea FC"
          className="w-9 h-9 object-contain"
        />
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
            Chelsea FC
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Recruitment Intelligence
          </p>
        </div>
      </div>

      {/* Centre: navigation */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'bg-chelsea-blue/20 text-chelsea-gold border border-chelsea-gold/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
              ].join(' ')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right: season selector (optional) + live indicator */}
      <div className="flex items-center gap-3">
        {seasons && seasons.length > 0 && season && onSeasonChange && (
          <Select value={season} onValueChange={onSeasonChange}>
            <SelectTrigger className="w-[110px] h-8 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="w-3.5 h-3.5" />
          <span className="font-mono">Live data</span>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
        </div>
      </div>

    </header>
  );
};

export default AppNav;
