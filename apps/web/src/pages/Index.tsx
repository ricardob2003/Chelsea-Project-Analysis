import { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KPICards from '@/components/dashboard/KPICards';
import PositionGapChart from '@/components/dashboard/PositionGapChart';
import RecruitmentMatrix from '@/components/dashboard/RecruitmentMatrix';
import SquadTable from '@/components/dashboard/SquadTable';
import LeagueHistory from '@/components/dashboard/LeagueHistory';
import TransferActivity from '@/components/dashboard/TransferActivity';
import PitchFormation from '@/components/dashboard/PitchFormation';
import { type Season } from '@/data/transferData';

const Index = () => {
  const [season, setSeason] = useState<Season>('2024/25');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader season={season} onSeasonChange={setSeason} />
        <KPICards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PositionGapChart />
          <SquadTable />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <RecruitmentMatrix />
          <TransferActivity season={season} />
        </div>

        <div className="mt-4">
          <LeagueHistory />
        </div>

        <div className="mt-4">
          <PitchFormation />
        </div>
      </div>
    </div>
  );
};

export default Index;
