/**
 * Coalition Analyzer
 * Analyzes which opinion groups form natural coalitions
 *
 * Calculates pairwise alignment between groups based on how often they agree
 * on statements. This helps identify potential bridges between differing viewpoints.
 *
 * Based on demo logic from clustering-agreement-demo.html lines 829-869
 */

export interface PairwiseAlignment {
  groupIds: [number, number];
  groupLabels: [string, string];
  agreementCount: number; // Number of statements where both groups align
  disagreementCount: number; // Number of statements where groups oppose
  neutralCount: number; // Statements where at least one group is neutral
  alignmentPercentage: number; // (agreementCount / totalStatements) * 100
}

export interface CoalitionAnalysis {
  pairwiseAlignment: PairwiseAlignment[];
  strongestCoalitions: PairwiseAlignment[]; // Top 3 alignments
}

export interface StatementGroupAgreementInput {
  statementId: string;
  groupAgreements: Record<number, number>; // groupId -> agreementScore (0-1 or -100 to +100)
}

export class CoalitionAnalyzer {
  /**
   * Agreement threshold for considering groups aligned
   * Both groups must be above this threshold (or below negative) to count as agreement
   */
  private static readonly AGREEMENT_THRESHOLD = 60;

  /**
   * Analyze which groups form natural coalitions
   *
   * @param statements - Array of statements with group agreement scores
   * @param numGroups - Total number of opinion groups
   * @param groupLabels - Optional labels for groups (e.g., "קבוצת דעות 1")
   * @returns Coalition analysis with pairwise alignments
   */
  static analyzeCoalitions(
    statements: StatementGroupAgreementInput[],
    numGroups: number,
    groupLabels?: string[]
  ): CoalitionAnalysis {
    const pairwiseAlignment: PairwiseAlignment[] = [];

    // Generate default labels if not provided
    const labels =
      groupLabels || Array.from({ length: numGroups }, (_, i) => `Group ${i + 1}`);

    // Compare each pair of groups
    for (let i = 0; i < numGroups; i++) {
      for (let j = i + 1; j < numGroups; j++) {
        let agreementCount = 0;
        let disagreementCount = 0;
        let neutralCount = 0;

        // Check alignment on each statement
        for (const stmt of statements) {
          const score1 = stmt.groupAgreements[i];
          const score2 = stmt.groupAgreements[j];

          if (score1 === undefined || score2 === undefined) continue;

          // Normalize scores to -100 to +100 if they're in 0-1 range
          const pct1 = this.normalizeScore(score1);
          const pct2 = this.normalizeScore(score2);

          // Check if either group is neutral
          if (
            (pct1 >= -this.AGREEMENT_THRESHOLD && pct1 <= this.AGREEMENT_THRESHOLD) ||
            (pct2 >= -this.AGREEMENT_THRESHOLD && pct2 <= this.AGREEMENT_THRESHOLD)
          ) {
            neutralCount++;
            continue;
          }

          // Both agree (>60%) or both disagree (<-60%)
          if ((pct1 > this.AGREEMENT_THRESHOLD && pct2 > this.AGREEMENT_THRESHOLD) ||
              (pct1 < -this.AGREEMENT_THRESHOLD && pct2 < -this.AGREEMENT_THRESHOLD)) {
            agreementCount++;
          }
          // Opposing positions
          else if (
            (pct1 > this.AGREEMENT_THRESHOLD && pct2 < -this.AGREEMENT_THRESHOLD) ||
            (pct1 < -this.AGREEMENT_THRESHOLD && pct2 > this.AGREEMENT_THRESHOLD)
          ) {
            disagreementCount++;
          }
        }

        const alignmentPercentage =
          statements.length > 0
            ? Math.round((agreementCount / statements.length) * 100)
            : 0;

        pairwiseAlignment.push({
          groupIds: [i, j],
          groupLabels: [labels[i], labels[j]],
          agreementCount,
          disagreementCount,
          neutralCount,
          alignmentPercentage,
        });
      }
    }

    // Sort by strongest alignment (highest agreement count)
    pairwiseAlignment.sort((a, b) => {
      // Primary sort: alignment percentage (descending)
      if (b.alignmentPercentage !== a.alignmentPercentage) {
        return b.alignmentPercentage - a.alignmentPercentage;
      }
      // Secondary sort: agreement count (descending)
      return b.agreementCount - a.agreementCount;
    });

    // Identify top 3 strongest coalitions
    const strongestCoalitions = pairwiseAlignment.slice(0, 3);

    return {
      pairwiseAlignment,
      strongestCoalitions,
    };
  }

  /**
   * Normalize agreement score to -100 to +100 range
   * Handles both 0-1 normalized scores and percentage scores
   *
   * @private
   * @param score - Agreement score (either 0-1 or -100 to +100)
   * @returns Score in -100 to +100 range
   */
  private static normalizeScore(score: number): number {
    // If score is in 0-1 range, convert to -100 to +100
    if (score >= 0 && score <= 1) {
      return (score - 0.5) * 200;
    }
    // Already in percentage range
    return score;
  }

  /**
   * Find the strongest coalition (highest alignment)
   *
   * @param analysis - Coalition analysis result
   * @returns The pairwise alignment with highest agreement, or null if no alignments
   */
  static getStrongestCoalition(
    analysis: CoalitionAnalysis
  ): PairwiseAlignment | null {
    return analysis.strongestCoalitions[0] || null;
  }

  /**
   * Check if two groups form a strong coalition (>50% alignment)
   *
   * @param groupId1 - First group ID
   * @param groupId2 - Second group ID
   * @param analysis - Coalition analysis result
   * @returns True if groups align on >50% of statements
   */
  static isStrongCoalition(
    groupId1: number,
    groupId2: number,
    analysis: CoalitionAnalysis
  ): boolean {
    const alignment = analysis.pairwiseAlignment.find(
      (a) =>
        (a.groupIds[0] === groupId1 && a.groupIds[1] === groupId2) ||
        (a.groupIds[0] === groupId2 && a.groupIds[1] === groupId1)
    );

    return alignment ? alignment.alignmentPercentage > 50 : false;
  }

  /**
   * Get all coalitions above a certain alignment threshold
   *
   * @param analysis - Coalition analysis result
   * @param minAlignment - Minimum alignment percentage (default: 50)
   * @returns Array of strong coalitions
   */
  static getCoalitionsAboveThreshold(
    analysis: CoalitionAnalysis,
    minAlignment: number = 50
  ): PairwiseAlignment[] {
    return analysis.pairwiseAlignment.filter(
      (a) => a.alignmentPercentage >= minAlignment
    );
  }

  /**
   * Calculate overall polarization level based on coalition patterns
   *
   * @param analysis - Coalition analysis result
   * @returns Polarization score (0-100, higher = more polarized)
   */
  static calculatePolarizationLevel(analysis: CoalitionAnalysis): number {
    if (analysis.pairwiseAlignment.length === 0) return 0;

    // Calculate average disagreement rate across all pairs
    const totalDisagreements = analysis.pairwiseAlignment.reduce(
      (sum, a) => sum + a.disagreementCount,
      0
    );

    const totalPairs = analysis.pairwiseAlignment.length;
    const avgStatementsPerPair =
      analysis.pairwiseAlignment[0]?.agreementCount +
      analysis.pairwiseAlignment[0]?.disagreementCount +
      analysis.pairwiseAlignment[0]?.neutralCount || 1;

    const polarizationScore =
      (totalDisagreements / (totalPairs * avgStatementsPerPair)) * 100;

    return Math.round(polarizationScore);
  }
}
