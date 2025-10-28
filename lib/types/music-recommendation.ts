/**
 * Types for music recommendation system
 * Mirrors insight generation structure for consistency
 */

export interface MusicRecommendationRequest {
  userId: string;
  pollId: string;
  pollQuestion: string;
  pollDescription?: string;

  // Full voting data (like insights)
  statements: Array<{
    text: string;
    vote: 1 | 0 | -1; // agree, pass, disagree
  }>;

  // Vote statistics (for quick analysis)
  voteStatistics: {
    agreeCount: number;
    disagreeCount: number;
    unsureCount: number;
    total: number;
    agreePercent: number;
    disagreePercent: number;
    unsurePercent: number;
  };

  // Enhanced demographics
  demographics?: {
    gender?: string;        // e.g., "זכר", "נקבה", "אחר"
    ageGroup?: string;      // e.g., "18-24", "25-34", "35-44"
    ethnicity?: string;     // e.g., "יהודי", "ערבי", "דרוזי"
  };

  // Optional: Include insight for context
  insightTitle?: string;
  insightBody?: string;
}

export interface MusicRecommendation {
  songTitle: string;
  artistName: string;
  spotifyLink: string;
  appleMusicLink: string;
  thumbnailUrl: string;
  reasoning: string;
}

export interface MusicRecommendationResponse extends MusicRecommendation {
  metadata: {
    tokensUsed: { input: number; output: number; total: number };
    cost: { input: number; output: number; total: number };
    latency: number;
    fallbackUsed: boolean;
  };
}
