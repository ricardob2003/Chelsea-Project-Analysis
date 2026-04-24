import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, PoundSterling, Users, ArrowRight } from 'lucide-react';
import AppNav from '@/components/AppNav';
import LeagueHistory from '@/components/dashboard/LeagueHistory';
import SeasonComparisonChart from '@/components/dashboard/SeasonComparisonChart';
import Top6History from '@/components/dashboard/Top6History';
import { fetchTeamSummary, type TeamSeasonSummary } from '@/lib/api';

// ── Overview KPI strip ────────────────────────────────────────────────────────

const OverviewKPIs = () => {
    const [current, setCurrent] = useState<TeamSeasonSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeamSummary()
            .then((data) => {
                const chelsea = data.filter((r) => r.team_key === 'Chelsea' && r.pts > 0).sort((a, b) => b.season_key.localeCompare(a.season_key));
                setCurrent(chelsea[0] ?? null);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="stat-gradient rounded-lg border border-border p-5 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    if (!current) return null;

    const kpis = [
        { label: 'Season', value: current.season_key, sub: 'current' },
        { label: 'Position', value: `${current.table_rank}${['st', 'nd', 'rd'][current.table_rank - 1] ?? 'th'}`, sub: `${current.pts} pts` },
        {
            label: 'vs UCL Cutoff',
            value: current.pts_vs_ucl_cutoff >= 0 ? `+${current.pts_vs_ucl_cutoff}` : String(current.pts_vs_ucl_cutoff),
            sub: `cutoff: ${current.ucl_cutoff_pts} pts`
        },
        {
            label: 'vs Champion',
            value: current.pts_vs_champion >= 0 ? `+${current.pts_vs_champion}` : String(current.pts_vs_champion),
            sub: `champion: ${current.champion_pts} pts`
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {kpis.map((k) => (
                <div key={k.label} className="stat-gradient rounded-lg border border-border p-5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-2">{k.label}</p>
                    <p className="text-2xl font-bold font-mono text-foreground">{k.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
                </div>
            ))}
        </div>
    );
};

// ── Module navigation cards ───────────────────────────────────────────────────

interface ModuleCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    status: string;
    statusOk: boolean;
    to: string;
}

const ModuleCard = ({ icon, title, description, status, statusOk, to }: ModuleCardProps) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(to)}
            className="stat-gradient rounded-lg border border-border p-5 text-left hover:border-chelsea-gold/40 transition-colors group w-full">
            <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-md bg-chelsea-blue/20 flex items-center justify-center text-chelsea-gold">{icon}</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-chelsea-gold transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{description}</p>
            <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    statusOk
                        ? 'bg-chelsea-blue/20 text-chelsea-gold border border-chelsea-gold/30'
                        : 'bg-secondary text-muted-foreground border border-border'
                }`}>
                {status}
            </span>
        </button>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const Index = () => (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto">
            <AppNav />

            {/* Current season hero */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3">Current season</p>
            <OverviewKPIs />

            {/* Module navigation */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3 mt-8">Modules</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <ModuleCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    title="Sporting Performance"
                    description="League position, points trajectory, xG analysis, form trends, home/away splits and positional gaps vs the top 4."
                    status="Live data"
                    statusOk
                    to="/sporting"
                />
                <ModuleCard
                    icon={<PoundSterling className="w-4 h-4" />}
                    title="Financial Performance"
                    description="Transfer spend, net spend by season, fee-per-minute ROI, and spend by position group vs comparator clubs."
                    status="Coming soon — Pillar 2"
                    statusOk={false}
                    to="/financials"
                />
                <ModuleCard
                    icon={<Users className="w-4 h-4" />}
                    title="Squad Assessment"
                    description="Player minutes, availability, per90 output, and positional gap analysis vs the top-4 cohort."
                    status="Live data"
                    statusOk
                    to="/squad"
                />
            </div>

            {/* Points per season overview */}
            <div className="mt-6 mb-2">
                <SeasonComparisonChart />
            </div>

            {/* Historical overview */}
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-3 mt-2">Historical overview</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LeagueHistory />
                <Top6History />
            </div>
        </div>
    </div>
);

export default Index;
