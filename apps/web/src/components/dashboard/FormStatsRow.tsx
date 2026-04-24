import { useEffect, useState } from 'react';
import { fetchTeamForm, type TeamForm } from '@/lib/api';

function ordinal(n: number): string {
  const v = n % 100;
  const suffix = ['th', 'st', 'nd', 'rd'];
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

function computeHomeAwayRanks(all: TeamForm[], season: string): { homeRank: number; awayRank: number } {
  const seasonData = all.filter((r) => r.season_key === season);
  const teamKeys = [...new Set(seasonData.map((r) => r.team_key))];

  const ranked = teamKeys.map((key) => {
    const tm = seasonData.filter((r) => r.team_key === key);
    const home = tm.filter((r) => r.is_home);
    const away = tm.filter((r) => !r.is_home);
    return {
      key,
      homePPM: home.length > 0 ? home.reduce((s, m) => s + m.points, 0) / home.length : 0,
      awayPPM: away.length > 0 ? away.reduce((s, m) => s + m.points, 0) / away.length : 0,
    };
  });

  const homeRank = [...ranked].sort((a, b) => b.homePPM - a.homePPM).findIndex((t) => t.key === 'Chelsea') + 1;
  const awayRank = [...ranked].sort((a, b) => b.awayPPM - a.awayPPM).findIndex((t) => t.key === 'Chelsea') + 1;
  return { homeRank, awayRank };
}

interface FormStatsRowProps {
  season: string;
}

interface FormStat {
  label: string;
  value: string;
  sub: string;
  positive?: boolean | null; // null = neutral
}

function longestUnbeatenRun(matches: TeamForm[]): number {
  let max = 0; let current = 0;
  for (const m of matches) {
    if (m.points > 0) { current++; max = Math.max(max, current); } else { current = 0; }
  }
  return max;
}

function longestLossStreak(matches: TeamForm[]): number {
  let max = 0; let current = 0;
  for (const m of matches) {
    if (m.points === 0) { current++; max = Math.max(max, current); } else { current = 0; }
  }
  return max;
}

function deriveStats(matches: TeamForm[], homeRank: number, awayRank: number): FormStat[] {
  const sorted = [...matches].sort((a, b) => a.game_id - b.game_id);
  const total = sorted.length;
  if (total === 0) return [];

  // Clean sheet rate
  const cleanSheets = sorted.filter((m) => m.goals_against === 0).length;
  const csRate = ((cleanSheets / total) * 100).toFixed(0);

  // Unbeaten run + loss streak (longest in season)
  const unbeaten = longestUnbeatenRun(sorted);
  const lossStreak = longestLossStreak(sorted);

  // xG luck gap — final cumulative value (positive = quality deserved better results)
  const lastRow = sorted[sorted.length - 1];
  const luckGap = lastRow.cumul_luck_gap;

  // Home / Away splits
  const home = sorted.filter((m) => m.is_home);
  const away = sorted.filter((m) => !m.is_home);
  const homePPM = home.length > 0
    ? (home.reduce((s, m) => s + m.points, 0) / home.length)
    : null;
  const awayPPM = away.length > 0
    ? (away.reduce((s, m) => s + m.points, 0) / away.length)
    : null;
  return [
    {
      label: 'Clean Sheets',
      value: `${cleanSheets}`,
      sub: `${csRate}% of matches`,
      positive: cleanSheets / total >= 0.3 ? true : cleanSheets / total < 0.2 ? false : null,
    },
    {
      label: 'Unbeaten Run',
      value: `${unbeaten}`,
      sub: 'games (season best)',
      positive: unbeaten >= 5 ? true : unbeaten <= 2 ? false : null,
    },
    {
      label: 'Loss Streak',
      value: `${lossStreak}`,
      sub: 'games (season worst)',
      positive: lossStreak === 0 ? true : lossStreak >= 4 ? false : lossStreak >= 2 ? false : null,
    },
    {
      label: 'xPts Luck Gap',
      value: luckGap != null ? (luckGap >= 0 ? `+${luckGap.toFixed(1)}` : luckGap.toFixed(1)) : 'N/A',
      sub: luckGap != null && luckGap > 0
        ? 'xPts > actual pts'
        : luckGap != null && luckGap < 0
        ? 'actual pts > xPts'
        : 'no xPts data',
      positive: luckGap != null ? (luckGap > 1 ? true : luckGap < -1 ? false : null) : null,
    },
    {
      label: 'Home PPM',
      value: homePPM != null ? homePPM.toFixed(2) : 'N/A',
      sub: homeRank > 0 ? `${ordinal(homeRank)} home · ${home.length} matches` : `${home.length} home matches`,
      positive: homePPM != null ? (homePPM >= 1.8 ? true : homePPM < 1.2 ? false : null) : null,
    },
    {
      label: 'Away PPM',
      value: awayPPM != null ? awayPPM.toFixed(2) : 'N/A',
      sub: awayRank > 0 ? `${ordinal(awayRank)} away · ${away.length} matches` : `${away.length} away matches`,
      positive: awayPPM != null ? (awayPPM >= 1.4 ? true : awayPPM < 0.9 ? false : null) : null,
    },
  ];
}

const FormStatsRow = ({ season }: FormStatsRowProps) => {
  const [stats, setStats] = useState<FormStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamForm()
      .then((data) => {
        const { homeRank, awayRank } = computeHomeAwayRanks(data, season);
        const chelsea = data.filter(
          (r) => r.team_key === 'Chelsea' && r.season_key === season,
        );
        setStats(deriveStats(chelsea, homeRank, awayRank));
      })
      .finally(() => setLoading(false));
  }, [season]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="stat-gradient rounded-lg border border-border p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="stat-gradient rounded-lg border border-border p-4 animate-slide-up"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            {s.label}
          </p>
          <p className={`text-xl font-bold font-mono ${
            s.positive === true
              ? 'text-chelsea-gold'
              : s.positive === false
              ? 'text-destructive'
              : 'text-foreground'
          }`}>
            {s.value}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default FormStatsRow;
