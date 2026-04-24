import { Clock } from 'lucide-react';
import AppNav from '@/components/AppNav';
import SquadTable from '@/components/dashboard/SquadTable';
import PositionGapChart from '@/components/dashboard/PositionGapChart';
import { useSeasons } from '@/hooks/useSeasons';

const PLANNED_METRICS = [
  { group: 'Depth & Age', items: ['U23 share of minutes', 'Average squad age by position', 'Squad depth by position (2nd/3rd choice)'] },
  { group: 'Availability', items: ['Injury absence rate per player', 'Matches missed to injury', 'Availability % (appearances / possible)'] },
  { group: 'vs Comparators (v2)', items: ['Chelsea minutes distribution vs top-4', 'Positional minutes benchmark', 'Youth academy contribution'] },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3 mt-8">
    {children}
  </p>
);

const Squad = () => {
  const { seasons, season, setSeason, loading } = useSeasons();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        <AppNav season={season} seasons={seasons} onSeasonChange={setSeason} />

        {loading && (
          <p className="text-xs text-muted-foreground">Loading seasons…</p>
        )}

        {!loading && season && (
          <>
            {/* ── Squad roster ── */}
            <SectionLabel>Squad performance · {season}</SectionLabel>
            <SquadTable season={season} />

            {/* ── Positional gaps ── */}
            <SectionLabel>Positional gaps vs top-4</SectionLabel>
            <PositionGapChart season={season} />

            {/* ── Coming soon ── */}
            <SectionLabel>Planned metrics</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANNED_METRICS.map(({ group, items }) => (
                <div key={group} className="stat-gradient rounded-lg border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      {group}
                    </h3>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 border border-border px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Soon
                    </span>
                  </div>
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
          </>
        )}

      </div>
    </div>
  );
};

export default Squad;
