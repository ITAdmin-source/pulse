import { useState, useEffect } from 'react';

interface MusicRecommendation {
  songTitle: string;
  artistName: string;
  spotifyLink: string;
  appleMusicLink: string;
  thumbnailUrl: string;
  reasoning: string;
}

interface UseMusicRecommendationProps {
  pollId: string;
  pollQuestion: string;
  pollDescription?: string;
  statements: Array<{ text: string; vote: 1 | 0 | -1 }>;  // Full statements with votes
  voteStatistics: {
    agreeCount: number;
    disagreeCount: number;
    unsureCount: number;
    total: number;
    agreePercent: number;
    disagreePercent: number;
    unsurePercent: number;
  };
  insightTitle?: string;
  insightBody?: string;
  enabled: boolean; // Only fetch when enabled
}

export function useMusicRecommendation({
  pollId,
  pollQuestion,
  pollDescription,
  statements,
  voteStatistics,
  insightTitle,
  insightBody,
  enabled
}: UseMusicRecommendationProps) {
  const [music, setMusic] = useState<MusicRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !statements || statements.length === 0) {
      return;
    }

    let cancelled = false;

    async function fetchMusic() {
      setLoading(true);
      setError(null);

      try {
        console.log('[useMusicRecommendation] Fetching music for poll:', pollId);

        const response = await fetch('/api/insights/music-recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pollId,
            pollQuestion,
            pollDescription,
            statements,          // Send full statements with votes
            voteStatistics,
            insightTitle,
            insightBody
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch music recommendation');
        }

        const data = await response.json();

        if (!cancelled && data.success) {
          setMusic(data.music);
          console.log('[useMusicRecommendation] Loaded:', data.music.songTitle, 'by', data.music.artistName);
          console.log('[useMusicRecommendation] Cached:', data.cached, data.cacheType || 'generated');
        }
      } catch (err) {
        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          console.error('[useMusicRecommendation] Error:', errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMusic();

    return () => {
      cancelled = true;
    };
  }, [enabled, pollId, pollQuestion, pollDescription, statements, voteStatistics, insightTitle, insightBody]);

  return { music, loading, error };
}
