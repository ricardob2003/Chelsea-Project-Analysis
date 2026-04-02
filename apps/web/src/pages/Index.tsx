import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPICards from '@/components/dashboard/KPICards';
import PositionGapChart from '@/components/dashboard/PositionGapChart';
import RecruitmentMatrix from '@/components/dashboard/RecruitmentMatrix';
import SquadTable from '@/components/dashboard/SquadTable';
import LeagueHistory from '@/components/dashboard/LeagueHistory';
import TeamFormChart from '@/components/dashboard/TeamFormChart';
import SeasonComparisonChart from '@/components/dashboard/SeasonComparisonChart';
import TeamSeasonComparison from '@/components/dashboard/TeamSeasonComparison';
import XGTracker from '@/components/dashboard/XGTracker';
import { fetchTeamSummary } from '@/lib/api';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3 mt-8">
    {children}
  </p>
);

const Index = () => {
  // No hardcoded default — season is set entirely from real API data
  const [season, setSeason] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);

  useEffect(() => {
    fetchTeamSummary()
      .then((data) => {
        const available = data
          .filter((r) => r.team_key === 'Chelsea' && r.pts > 0)
          .map((r) => r.season_key)
          .sort((a, b) => b.localeCompare(a)); // newest first
        if (available.length > 0) {
          setSeasons(available);
          setSeason(available[0]); // always the most recent season in the data
        }
      })
      .catch(() => {/* API unreachable — leave season empty, components show their own error states */});
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">

        {/* Season selector is part of the header — top-left next to the title */}
        <DashboardHeader season={season} seasons={seasons} onSeasonChange={setSeason} />

        {/* ── SECTION 1: Historical overview ── */}
        <SectionLabel>Historical overview</SectionLabel>
        <LeagueHistory />

        {/* Season-dependent sections only render once the API has returned a real season */}
        {season && (
          <>
            {/* ── SECTION 2: Season analysis — comparison bar + points race ── */}
            <SectionLabel>Season analysis</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SeasonComparisonChart />
              <TeamFormChart season={season} />
            </div>

            {/* ── SECTION 3: Competitive context — top-6 trend + xG tracker ── */}
            <SectionLabel>Competitive context</SectionLabel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TeamSeasonComparison />
              <XGTracker season={season} />
            </div>

            {/* ── SECTION 4: Season drill-down — KPIs, gap chart, squad ── */}
            <SectionLabel>Season drill-down · {season}</SectionLabel>
            <KPICards season={season} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <PositionGapChart season={season} />
              <SquadTable season={season} />
            </div>
          </>
        )}

        {/* ── SECTION 5: Recruitment intelligence ── */}
        <SectionLabel>Recruitment intelligence</SectionLabel>
        <RecruitmentMatrix />

      </div>
    </div>
  );
};

export default Index;
