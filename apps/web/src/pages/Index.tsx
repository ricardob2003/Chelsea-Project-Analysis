import { useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPICards from '@/components/dashboard/KPICards';
import PositionGapChart from '@/components/dashboard/PositionGapChart';
import RecruitmentMatrix from '@/components/dashboard/RecruitmentMatrix';
import SquadTable from '@/components/dashboard/SquadTable';
import LeagueHistory from '@/components/dashboard/LeagueHistory';
import TeamFormChart from '@/components/dashboard/TeamFormChart';
import { fetchTeamSummary } from '@/lib/api';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// All seasons we track — newest first
const ALL_SEASONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

const Index = () => {
  // Default to latest available season (auto-detected from real data)
  const [season, setSeason] = useState('2024-25');

  useEffect(() => {
    fetchTeamSummary()
      .then((data) => {
        const seasons = data
          .filter((r) => r.team_key === 'Chelsea')
          .map((r) => r.season_key)
          .sort((a, b) => b.localeCompare(a));
        if (seasons.length > 0) setSeason(seasons[0]);
      })
      .catch(() => {/* keep default */});
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader />

        {/* ── Historical overview — always visible, no filtering required ── */}
        <div className="mt-4">
          <LeagueHistory />
        </div>

        {/* ── Season selector — drives the detail sections below ── */}
        <div className="flex items-center gap-3 mt-8 mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Season detail
          </span>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-[130px] h-7 text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_SEASONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── KPI strip for the selected season ── */}
        <KPICards season={season} />

        {/* ── Team form race + position gap ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <TeamFormChart season={season} />
          <PositionGapChart season={season} />
        </div>

        {/* ── Squad detail ── */}
        <div className="mt-4">
          <SquadTable season={season} />
        </div>

        {/* ── Recruitment analysis (static / mock) ── */}
        <div className="mt-4">
          <RecruitmentMatrix />
        </div>
      </div>
    </div>
  );
};

export default Index;
