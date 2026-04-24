import AppNav from '@/components/AppNav';
import KPICards from '@/components/dashboard/KPICards';
import FormStatsRow from '@/components/dashboard/FormStatsRow';
import HomeAwayTable from '@/components/dashboard/HomeAwayTable';
import TeamFormChart from '@/components/dashboard/TeamFormChart';
import TeamSeasonComparison from '@/components/dashboard/TeamSeasonComparison';
import XGTracker from '@/components/dashboard/XGTracker';
import MonthlyFormChart from '@/components/dashboard/MonthlyFormChart';
import PositionGapChart from '@/components/dashboard/PositionGapChart';
import { useSeasons } from '@/hooks/useSeasons';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3 mt-8">
    {children}
  </p>
);

const Sporting = () => {
  const { seasons, season, setSeason, loading } = useSeasons();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        <AppNav
          season={season}
          seasons={seasons}
          onSeasonChange={setSeason}
        />

        {loading && (
          <p className="text-xs text-muted-foreground">Loading seasons…</p>
        )}

        {!loading && season && (
          <>
            {/* ── Season KPIs ── */}
            <SectionLabel>Season KPIs · {season}</SectionLabel>
            <KPICards season={season} />
            <FormStatsRow season={season} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
              <HomeAwayTable season={season} />
              <TeamSeasonComparison season={season} />
            </div>

            {/* ── Season arc ── */}
            <SectionLabel>Season arc</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TeamFormChart season={season} />
              <XGTracker season={season} />
            </div>

            {/* ── Monthly breakdown ── */}
            <SectionLabel>Monthly breakdown</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MonthlyFormChart season={season} />
              <PositionGapChart season={season} />
            </div>

          </>
        )}

      </div>
    </div>
  );
};

export default Sporting;
