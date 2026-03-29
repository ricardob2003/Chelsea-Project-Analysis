import { Database } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
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
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="w-3.5 h-3.5" />
        <span className="font-mono">Live data</span>
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
      </div>
    </header>
  );
};

export default DashboardHeader;
