/**
 * Consensus Detector
 * Classifies statements as consensus, divisive, or bridge based on opinion group agreement
 *
 * CRITICAL FIX: Uses STANDARD DEVIATION (not variance) for classification thresholds
 * The original CLUSTERING_SPEC.md had a mathematically incorrect formula using variance
 */

export type StatementClassificationType =
  | "positive_consensus" // All groups strongly agree
  | "negative_consensus" // All groups strongly disagree
  | "divisive" // Groups have very different opinions
  | "bridge" // Connects disagreeing groups
  | "normal"; // No special pattern

export interface GroupAgreement {
  /** Coarse group ID */
  groupId: number;
  /** Agreement percentage (0-1): (agree - disagree) / (agree + disagree) */
  agreementScore: number;
  /** Number of users in this group who voted on this statement */
  voterCount: number;
}

export interface StatementClassification {
  /** Statement ID */
  statementId: string;
  /** Classification type */
  type: StatementClassificationType;
  /** Agreement scores by group (groupId -> agreementScore) */
  groupAgreements: Record<number, number>;
  /** Average agreement across all groups */
  averageAgreement: number;
  /** Standard deviation of agreement (CRITICAL: NOT variance!) */
  standardDeviation: number;
  /** Bridge score (only for bridge statements, 0-1) */
  bridgeScore?: number;
  /** Groups this statement connects (only for bridge statements) */
  connectsGroups?: number[];
}

/**
 * Consensus Detector Engine
 * Implements corrected Pol.is-style consensus detection algorithm
 */
export class ConsensusDetector {
  // Classification thresholds (using STANDARD DEVIATION, not variance!)
  private static readonly CONSENSUS_STD_THRESHOLD = 0.2; // Low variation = consensus
  private static readonly DIVISIVE_STD_THRESHOLD = 0.4; // High variation = divisive
  private static readonly POSITIVE_CONSENSUS_THRESHOLD = 0.8; // Strong agreement
  private static readonly NEGATIVE_CONSENSUS_THRESHOLD = 0.2; // Strong disagreement
  private static readonly BRIDGE_MIN_GROUPS = 2; // Minimum groups to connect

  /**
   * Classify a statement based on group agreement patterns
   *
   * @param groupAgreements - Agreement scores for each opinion group
   * @returns Statement classification
   */
  static classifyStatement(
    statementId: string,
    groupAgreements: GroupAgreement[]
  ): StatementClassification {
    if (groupAgreements.length === 0) {
      throw new Error("No group agreements provided");
    }

    // Extract agreement scores
    const agreementScores = groupAgreements.map((g) => g.agreementScore);

    // Calculate statistics
    const averageAgreement = this.mean(agreementScores);
    const variance = this.calculateVariance(agreementScores, averageAgreement);
    const standardDeviation = Math.sqrt(variance); // CRITICAL: sqrt of variance!

    // Create groupId -> agreementScore map
    const groupAgreementMap: Record<number, number> = {};
    groupAgreements.forEach((g) => {
      groupAgreementMap[g.groupId] = g.agreementScore;
    });

    // Classification logic (using CORRECTED standard deviation thresholds)

    // 1. Positive Consensus: Low stdDev AND high average agreement
    if (
      standardDeviation < this.CONSENSUS_STD_THRESHOLD &&
      averageAgreement > this.POSITIVE_CONSENSUS_THRESHOLD
    ) {
      return {
        statementId,
        type: "positive_consensus",
        groupAgreements: groupAgreementMap,
        averageAgreement,
        standardDeviation,
      };
    }

    // 2. Negative Consensus: Low stdDev AND low average agreement
    if (
      standardDeviation < this.CONSENSUS_STD_THRESHOLD &&
      averageAgreement < this.NEGATIVE_CONSENSUS_THRESHOLD
    ) {
      return {
        statementId,
        type: "negative_consensus",
        groupAgreements: groupAgreementMap,
        averageAgreement,
        standardDeviation,
      };
    }

    // 3. Divisive: High stdDev (groups strongly disagree)
    if (standardDeviation > this.DIVISIVE_STD_THRESHOLD) {
      return {
        statementId,
        type: "divisive",
        groupAgreements: groupAgreementMap,
        averageAgreement,
        standardDeviation,
      };
    }

    // 4. Bridge: Moderate agreement connecting disagreeing groups
    const bridgeDetection = this.detectBridge(groupAgreements);
    if (bridgeDetection.isBridge) {
      return {
        statementId,
        type: "bridge",
        groupAgreements: groupAgreementMap,
        averageAgreement,
        standardDeviation,
        bridgeScore: bridgeDetection.bridgeScore,
        connectsGroups: bridgeDetection.connectsGroups,
      };
    }

    // 5. Normal: No special pattern
    return {
      statementId,
      type: "normal",
      groupAgreements: groupAgreementMap,
      averageAgreement,
      standardDeviation,
    };
  }

  /**
   * Detect bridge statements that connect disagreeing groups
   *
   * A bridge statement has:
   * - Moderate overall agreement (0.4-0.7)
   * - At least 2 groups with opposite typical positions agree on it
   * - Not too high or low stdDev (0.2-0.4)
   *
   * @param groupAgreements - Agreement scores for each group
   * @returns Bridge detection result
   */
  private static detectBridge(groupAgreements: GroupAgreement[]): {
    isBridge: boolean;
    bridgeScore?: number;
    connectsGroups?: number[];
  } {
    if (groupAgreements.length < this.BRIDGE_MIN_GROUPS) {
      return { isBridge: false };
    }

    const agreementScores = groupAgreements.map((g) => g.agreementScore);
    const avg = this.mean(agreementScores);
    const stdDev = Math.sqrt(this.calculateVariance(agreementScores, avg));

    // Bridge criteria:
    // 1. Moderate average agreement (not too polarized)
    if (avg < 0.4 || avg > 0.7) {
      return { isBridge: false };
    }

    // 2. Moderate standard deviation (some variation but not extreme)
    if (
      stdDev < this.CONSENSUS_STD_THRESHOLD ||
      stdDev > this.DIVISIVE_STD_THRESHOLD
    ) {
      return { isBridge: false };
    }

    // 3. Identify groups with moderate-to-strong agreement (>0.5)
    const agreeingGroups = groupAgreements
      .filter((g) => g.agreementScore > 0.5)
      .map((g) => g.groupId);

    if (agreeingGroups.length < this.BRIDGE_MIN_GROUPS) {
      return { isBridge: false };
    }

    // Calculate bridge score (0-1): Higher = stronger bridge
    // Based on: (1) number of groups agreeing, (2) strength of agreement
    const bridgeScore =
      (agreeingGroups.length / groupAgreements.length) * avg;

    return {
      isBridge: true,
      bridgeScore,
      connectsGroups: agreeingGroups,
    };
  }

  /**
   * Calculate group agreement statistics for all statements
   *
   * @param votes - Vote matrix [users x statements] with values -1, 0, 1
   * @param userGroupAssignments - Map from userId to coarse group ID
   * @param statementIds - Statement IDs corresponding to columns
   * @returns Array of statement classifications
   */
  static classifyAllStatements(
    votes: { userId: string; votes: number[] }[],
    userGroupAssignments: Map<string, number>, // userId -> groupId
    statementIds: string[]
  ): StatementClassification[] {
    const numStatements = statementIds.length;
    const classifications: StatementClassification[] = [];

    // Get unique group IDs
    const uniqueGroups = new Set(userGroupAssignments.values());

    for (let stmtIdx = 0; stmtIdx < numStatements; stmtIdx++) {
      const statementId = statementIds[stmtIdx];

      // Calculate agreement for each group
      const groupAgreements: GroupAgreement[] = [];

      for (const groupId of uniqueGroups) {
        // Get users in this group
        const groupUserIds = Array.from(userGroupAssignments.entries())
          .filter(([, gId]) => gId === groupId)
          .map(([userId]) => userId);

        // Get votes from these users for this statement
        const groupVotes = votes
          .filter((v) => groupUserIds.includes(v.userId))
          .map((v) => v.votes[stmtIdx]);

        // Calculate agreement score
        const agree = groupVotes.filter((v) => v === 1).length;
        const disagree = groupVotes.filter((v) => v === -1).length;
        const total = agree + disagree;

        if (total === 0) {
          // All users passed on this statement, skip group
          continue;
        }

        // Agreement score: (agree - disagree) / total
        // Range: -1 (all disagree) to +1 (all agree)
        // Normalize to 0-1: (score + 1) / 2
        const rawScore = (agree - disagree) / total;
        const agreementScore = (rawScore + 1) / 2;

        groupAgreements.push({
          groupId,
          agreementScore,
          voterCount: total,
        });
      }

      // Classify statement
      if (groupAgreements.length > 0) {
        const classification = this.classifyStatement(
          statementId,
          groupAgreements
        );
        classifications.push(classification);
      }
    }

    return classifications;
  }

  /**
   * Calculate mean of array
   */
  private static mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate variance (NOT standard deviation!)
   * CRITICAL: This returns variance, caller must take sqrt for stdDev
   *
   * @param values - Array of numbers
   * @param mean - Pre-calculated mean (optional)
   * @returns Variance (NOT standard deviation)
   */
  private static calculateVariance(values: number[], mean?: number): number {
    if (values.length === 0) return 0;

    const avg = mean ?? this.mean(values);
    const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));

    return this.mean(squaredDiffs);
  }
}
