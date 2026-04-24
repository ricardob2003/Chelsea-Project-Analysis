import { useEffect, useState } from 'react';
import { fetchTeamSummary } from '@/lib/api';

interface UseSeasonsResult {
  seasons: string[];
  season: string;
  setSeason: (s: string) => void;
  loading: boolean;
}

/**
 * Fetches available Chelsea seasons from the API and manages season selection.
 * Used by every detail page so they each have independent season state.
 */
export function useSeasons(): UseSeasonsResult {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [season, setSeason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamSummary()
      .then((data) => {
        const available = data
          .filter((r) => r.team_key === 'Chelsea' && r.pts > 0)
          .map((r) => r.season_key)
          .sort((a, b) => b.localeCompare(a));
        if (available.length > 0) {
          setSeasons(available);
          setSeason(available[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return { seasons, season, setSeason, loading };
}
