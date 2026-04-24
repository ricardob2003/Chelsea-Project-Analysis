import { PoundSterling, Clock } from 'lucide-react';
import AppNav from '@/components/AppNav';
import { useSeasons } from '@/hooks/useSeasons';

const PLANNED_METRICS = [
  { group: 'Transfer Market', items: ['Gross spend per season', 'Net spend per season', 'Spend by position group', 'Avg age of signings', 'Fee paid per 90 mins delivered (ROI)', 'Origin clubs — where Chelsea buys from / sells to'] },
  { group: 'vs Comparators', items: ['Chelsea vs Arsenal, Liverpool, Man City, Newcastle', 'Net spend ranking in the Premier League', 'U22 spend share vs peers'] },
  { group: 'Club Accounting (v2)', items: ['Annual revenue, wages, operating loss', 'Transfer fee amortisation burden', 'PSR headroom estimate', 'Wage-to-revenue ratio'] },
];

const Financials = () => {
  const { seasons, season, setSeason } = useSeasons();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        <AppNav season={season} seasons={seasons} onSeasonChange={setSeason} />

        {/* Placeholder state */}
        <div className="mt-12 flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-xl bg-chelsea-blue/20 border border-chelsea-gold/20 flex items-center justify-center mb-5">
            <PoundSterling className="w-7 h-7 text-chelsea-gold" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Financial Performance</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Transfer market analysis and club financial health — coming in Pillar 2.
            Data will be sourced from Transfermarkt (automated) and Companies House
            annual filings (manually curated).
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 border border-border px-4 py-2 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>Not yet built</span>
          </div>
        </div>

        {/* Planned metrics */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANNED_METRICS.map(({ group, items }) => (
            <div key={group} className="stat-gradient rounded-lg border border-border p-5">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                {group}
              </h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-chelsea-gold/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Financials;
