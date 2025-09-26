export type VoteValue = -1 | 0 | 1;

export const VOTE_VALUES = {
  DISAGREE: -1 as const,
  NEUTRAL: 0 as const,
  AGREE: 1 as const,
} as const;

export function isValidVoteValue(value: unknown): value is VoteValue {
  return value === -1 || value === 0 || value === 1;
}

export function getVoteLabel(value: VoteValue, buttonLabels?: {
  support?: string | null;
  oppose?: string | null;
  unsure?: string | null;
}): string {
  const defaultLabels = {
    [VOTE_VALUES.AGREE]: buttonLabels?.support || 'Agree',
    [VOTE_VALUES.NEUTRAL]: buttonLabels?.unsure || 'Neutral',
    [VOTE_VALUES.DISAGREE]: buttonLabels?.oppose || 'Disagree',
  };

  return defaultLabels[value];
}

export function calculateVoteDistribution(votes: VoteValue[]): {
  agree: number;
  disagree: number;
  neutral: number;
  total: number;
  percentages: {
    agree: number;
    disagree: number;
    neutral: number;
  };
} {
  const counts = votes.reduce(
    (acc, vote) => {
      switch (vote) {
        case VOTE_VALUES.AGREE:
          acc.agree++;
          break;
        case VOTE_VALUES.DISAGREE:
          acc.disagree++;
          break;
        case VOTE_VALUES.NEUTRAL:
          acc.neutral++;
          break;
      }
      return acc;
    },
    { agree: 0, disagree: 0, neutral: 0 }
  );

  const total = votes.length;
  const percentages = {
    agree: total > 0 ? (counts.agree / total) * 100 : 0,
    disagree: total > 0 ? (counts.disagree / total) * 100 : 0,
    neutral: total > 0 ? (counts.neutral / total) * 100 : 0,
  };

  return {
    ...counts,
    total,
    percentages,
  };
}