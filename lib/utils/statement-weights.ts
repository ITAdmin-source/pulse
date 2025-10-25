/**
 * Statement Weight Calculation Utilities
 *
 * Calculates the four weight factors for weighted statement ordering:
 * 1. Predictiveness (clustering mode only) - variance of group agreements
 * 2. Consensus Potential (clustering mode only) - likelihood of broad agreement
 * 3. Recency Boost (both modes) - time-based priority for new statements
 * 4. Pass Rate Penalty (both modes) - downweight confusing statements
 * 5. Vote Count Boost (cold start only) - prioritize less-voted statements
 */

export interface WeightComponents {
  predictiveness: number; // 0.0 - 1.0
  consensusPotential: number; // 0.0 - 1.0
  recencyBoost: number; // 0.1 - 2.0
  passRatePenalty: number; // 0.1 - 1.0
  voteCountBoost?: number; // 0.5 - 1.5 (cold start only)
  combinedWeight: number; // Product of all factors
  mode: "cold_start" | "clustering";
}

export interface VoteCounts {
  agree: number;
  disagree: number;
  pass: number;
}

/**
 * Calculate predictiveness from group agreement variance
 *
 * Measures how well a statement differentiates between opinion groups.
 * High variance in group agreements = high predictiveness = high value for clustering.
 *
 * Formula: variance = avg((group_agreement - mean)^2)
 * Normalized: max variance is 0.25 (groups at 0% and 100%)
 *
 * Only used in clustering mode (requires group data from clustering).
 *
 * @param groupAgreements - Agreement percentages for each group (e.g., [0.9, 0.1, 0.5])
 * @returns Predictiveness score 0.0 - 1.0
 *
 * @example
 * // High variance (groups disagree strongly)
 * calculatePredictiveness([0.9, 0.1, 0.85, 0.05]) // → ~0.72
 *
 * // Low variance (groups mostly agree)
 * calculatePredictiveness([0.52, 0.50, 0.48, 0.51]) // → ~0.003
 */
export function calculatePredictiveness(groupAgreements: number[]): number {
  if (groupAgreements.length === 0) return 0;

  const mean = average(groupAgreements);
  const variance = average(groupAgreements.map(x => Math.pow(x - mean, 2)));

  // Max variance is 0.25 (groups at 0 and 1), normalize to [0, 1]
  const predictiveness = Math.min(variance / 0.25, 1.0);

  return predictiveness;
}

/**
 * Calculate consensus potential from classification
 *
 * Measures likelihood that this statement could become a consensus point.
 * Statements where more groups strongly agree/disagree have higher potential.
 *
 * Only used in clustering mode (requires classification data).
 *
 * @param groupAgreements - Agreement percentages for each group
 * @param classificationType - Type from statement classification ("positive_consensus", "negative_consensus", "bridge", "divisive", "normal")
 * @returns Consensus potential score 0.0 - 1.0
 *
 * @example
 * calculateConsensusPotential([0.8, 0.85], "positive_consensus") // → 1.0
 * calculateConsensusPotential([0.6, 0.4], "bridge") // → 0.7
 * calculateConsensusPotential([0.8, 0.7, 0.3, 0.2], "normal") // → 0.5 (2/4 strong)
 */
export function calculateConsensusPotential(
  groupAgreements: number[],
  classificationType: string
): number {
  // Full consensus statements get highest score
  if (
    classificationType === "positive_consensus" ||
    classificationType === "negative_consensus"
  ) {
    return 1.0;
  }

  // Bridge statements get moderate score (connect disagreeing groups)
  if (classificationType === "bridge") {
    return 0.7;
  }

  // For others, calculate ratio of groups with strong opinions
  // Strong opinion = >60% agree or <40% agree (majority view)
  const STRONG_THRESHOLD = 0.6;
  const strongGroups = groupAgreements.filter(
    ag => ag > STRONG_THRESHOLD || ag < 1 - STRONG_THRESHOLD
  );

  return strongGroups.length / groupAgreements.length;
}

/**
 * Calculate recency boost with exponential decay
 *
 * Ensures new statements get visibility to maintain democratic participation.
 * New statements (<24 hours) get full boost (2.0x).
 * Older statements decay exponentially (half-life = 7 days).
 * Never goes below minimum (0.1x) to ensure old statements still appear.
 *
 * Used in both clustering and cold start modes.
 *
 * @param createdAt - Statement creation timestamp
 * @returns Recency boost 0.1 - 2.0
 *
 * @example
 * // New statement (12 hours old)
 * calculateRecencyBoost(new Date(Date.now() - 12 * 3600000)) // → 2.0
 *
 * // Week-old statement
 * calculateRecencyBoost(new Date(Date.now() - 7 * 24 * 3600000)) // → ~1.0
 *
 * // Very old statement (90 days)
 * calculateRecencyBoost(new Date(Date.now() - 90 * 24 * 3600000)) // → 0.1
 */
export function calculateRecencyBoost(createdAt: Date): number {
  const COLD_START_HOURS = 24; // First 24 hours get full boost
  const COLD_START_BOOST = 2.0; // 2x multiplier for new statements
  const DECAY_DAYS = 7; // Half-life: boost halves every 7 days
  const MIN_BOOST = 0.1; // Never go below 10%

  const ageInHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

  // First 24 hours: full boost
  if (ageInHours < COLD_START_HOURS) {
    return COLD_START_BOOST;
  }

  // Exponential decay: boost = COLD_START_BOOST * 0.5^(days / DECAY_DAYS)
  const ageInDays = ageInHours / 24;
  const decayFactor = Math.pow(0.5, ageInDays / DECAY_DAYS);
  const boost = COLD_START_BOOST * decayFactor;

  return Math.max(boost, MIN_BOOST);
}

/**
 * Calculate pass rate penalty
 *
 * Downweights statements with high "pass" (skip/unsure) rates.
 * High pass rate indicates the statement is confusing or ambiguous.
 *
 * Used in both clustering and cold start modes.
 *
 * @param votes - Vote counts (agree, disagree, pass)
 * @returns Pass rate penalty 0.1 - 1.0 (1.0 = no penalty, 0.1 = heavy penalty)
 *
 * @example
 * calculatePassRatePenalty({ agree: 10, disagree: 5, pass: 0 }) // → 1.0 (no passes)
 * calculatePassRatePenalty({ agree: 5, disagree: 5, pass: 10 }) // → ~0.55 (50% pass)
 * calculatePassRatePenalty({ agree: 0, disagree: 0, pass: 10 }) // → 0.1 (100% pass)
 */
export function calculatePassRatePenalty(votes: VoteCounts): number {
  const { agree, disagree, pass } = votes;
  const total = agree + disagree + pass;

  if (total === 0) {
    // No votes yet: neutral penalty (middle ground)
    return 0.5;
  }

  const passRate = pass / total;

  // Linear penalty: 0% pass = 1.0, 100% pass = 0.1
  // Formula: 1.0 - (passRate * 0.9)
  const penalty = Math.max(1.0 - passRate * 0.9, 0.1);

  return penalty;
}

/**
 * Calculate vote count boost for cold start
 *
 * Prioritizes statements with fewer votes to balance data collection.
 * Ensures all statements get fair exposure before clustering is available.
 *
 * Only used in cold start mode (<20 users).
 *
 * @param voteCount - Number of votes this statement has received
 * @param avgVotes - Average votes across all statements
 * @returns Vote count boost 0.5 - 1.5
 *
 * @example
 * // Statement with few votes (50% of average)
 * calculateVoteCountBoost(5, 10) // → ~1.5 (boost it)
 *
 * // Statement with many votes (150% of average)
 * calculateVoteCountBoost(15, 10) // → ~0.5 (penalize it)
 *
 * // Statement with average votes
 * calculateVoteCountBoost(10, 10) // → 1.0 (neutral)
 */
export function calculateVoteCountBoost(
  voteCount: number,
  avgVotes: number
): number {
  if (avgVotes === 0) return 1.0;

  // Inverse relationship: fewer votes = higher boost
  const ratio = voteCount / avgVotes;

  // Formula: 2.0 - ratio
  // Capped between 0.5x (minimum) and 1.5x (maximum)
  const boost = Math.max(0.5, Math.min(1.5, 2.0 - ratio));

  return boost;
}

/**
 * Calculate combined weight for clustering mode
 *
 * Uses all 4 factors: predictiveness × consensus × recency × passRate
 * Requires clustering data (group agreements, classification).
 *
 * @param groupAgreements - Agreement percentages for each group
 * @param classificationType - Statement classification type
 * @param createdAt - Statement creation timestamp
 * @param votes - Vote counts
 * @returns Weight components and combined weight
 */
export function calculateClusteringWeight(
  groupAgreements: number[],
  classificationType: string,
  createdAt: Date,
  votes: VoteCounts
): WeightComponents {
  const predictiveness = calculatePredictiveness(groupAgreements);
  const consensusPotential = calculateConsensusPotential(
    groupAgreements,
    classificationType
  );
  const recencyBoost = calculateRecencyBoost(createdAt);
  const passRatePenalty = calculatePassRatePenalty(votes);

  const combinedWeight =
    predictiveness * consensusPotential * recencyBoost * passRatePenalty;

  return {
    predictiveness,
    consensusPotential,
    recencyBoost,
    passRatePenalty,
    combinedWeight,
    mode: "clustering",
  };
}

/**
 * Calculate combined weight for cold start mode
 *
 * Uses 3 factors: voteCountBoost × recency × passRate
 * Used when clustering is not available (<20 users).
 *
 * @param createdAt - Statement creation timestamp
 * @param votes - Vote counts
 * @param voteCount - Total votes for this statement
 * @param avgVotes - Average votes across all statements
 * @returns Weight components and combined weight
 */
export function calculateColdStartWeight(
  createdAt: Date,
  votes: VoteCounts,
  voteCount: number,
  avgVotes: number
): WeightComponents {
  const recencyBoost = calculateRecencyBoost(createdAt);
  const passRatePenalty = calculatePassRatePenalty(votes);
  const voteCountBoost = calculateVoteCountBoost(voteCount, avgVotes);

  const combinedWeight = voteCountBoost * recencyBoost * passRatePenalty;

  return {
    predictiveness: 0, // Not applicable in cold start
    consensusPotential: 0, // Not applicable in cold start
    recencyBoost,
    passRatePenalty,
    voteCountBoost,
    combinedWeight,
    mode: "cold_start",
  };
}

// Helper functions

/**
 * Calculate average of an array of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
