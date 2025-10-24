/**
 * Statement Classifier
 * Enhanced classification logic for statement agreement patterns
 *
 * Classifies statements based on how opinion groups vote:
 * - Full Consensus: All groups agree or all disagree
 * - Partial Consensus: N-1 groups agree/disagree
 * - Split Decision: Equal groups on both sides
 * - Divisive: Fragmented opinions
 * - Bridge: Moderate agreement that connects groups
 */

export type EnhancedStatementType =
  | "full_consensus"
  | "partial_consensus"
  | "split_decision"
  | "divisive"
  | "bridge"
  | "normal";

export interface CoalitionPattern {
  description: string; // e.g., "All groups agree" or "Groups 1,2 vs 3,4"
  agreeingGroups: number[]; // Group IDs with positive agreement (>60%)
  disagreeingGroups: number[]; // Group IDs with negative agreement (<-60%)
  neutralGroups: number[]; // Group IDs in neutral range (-60 to 60)
}

export interface EnhancedClassification {
  type: EnhancedStatementType;
  coalitionPattern: CoalitionPattern;
}

export interface GroupAgreementInput {
  groupId: number;
  agreementPercentage: number; // -100 to +100
}

export class StatementClassifier {
  /**
   * Agreement threshold for considering a group as "agree" or "disagree"
   * Groups with agreement between -60% and +60% are considered neutral
   */
  private static readonly AGREEMENT_THRESHOLD = 60;

  /**
   * Classify a statement based on group voting patterns
   * Matches demo logic from clustering-agreement-demo.html lines 704-749
   *
   * @param groupAgreements - Array of group agreement percentages
   * @returns Enhanced classification with type and coalition pattern
   */
  static classifyStatement(
    groupAgreements: GroupAgreementInput[]
  ): EnhancedClassification {
    const numGroups = groupAgreements.length;

    // Categorize groups by voting pattern
    const agreeingGroups = groupAgreements
      .filter((g) => g.agreementPercentage > this.AGREEMENT_THRESHOLD)
      .map((g) => g.groupId);

    const disagreeingGroups = groupAgreements
      .filter((g) => g.agreementPercentage < -this.AGREEMENT_THRESHOLD)
      .map((g) => g.groupId);

    const neutralGroups = groupAgreements
      .filter(
        (g) =>
          g.agreementPercentage >= -this.AGREEMENT_THRESHOLD &&
          g.agreementPercentage <= this.AGREEMENT_THRESHOLD
      )
      .map((g) => g.groupId);

    // 1. FULL CONSENSUS: All groups agree or all disagree
    if (agreeingGroups.length === numGroups) {
      return {
        type: "full_consensus",
        coalitionPattern: {
          description: "All groups agree",
          agreeingGroups,
          disagreeingGroups: [],
          neutralGroups: [],
        },
      };
    }

    if (disagreeingGroups.length === numGroups) {
      return {
        type: "full_consensus",
        coalitionPattern: {
          description: "All groups disagree",
          agreeingGroups: [],
          disagreeingGroups,
          neutralGroups: [],
        },
      };
    }

    // 2. PARTIAL CONSENSUS: N-1 groups agree/disagree
    if (agreeingGroups.length === numGroups - 1) {
      const opposingGroup = disagreeingGroups.concat(neutralGroups);
      return {
        type: "partial_consensus",
        coalitionPattern: {
          description: this.formatCoalitionDescription(
            agreeingGroups,
            opposingGroup,
            "agree"
          ),
          agreeingGroups,
          disagreeingGroups: opposingGroup,
          neutralGroups: [],
        },
      };
    }

    if (disagreeingGroups.length === numGroups - 1) {
      const opposingGroup = agreeingGroups.concat(neutralGroups);
      return {
        type: "partial_consensus",
        coalitionPattern: {
          description: this.formatCoalitionDescription(
            disagreeingGroups,
            opposingGroup,
            "disagree"
          ),
          agreeingGroups: opposingGroup,
          disagreeingGroups,
          neutralGroups: [],
        },
      };
    }

    // 3. SPLIT DECISION: Equal number of agreeing and disagreeing groups
    if (
      agreeingGroups.length > 0 &&
      disagreeingGroups.length > 0 &&
      agreeingGroups.length === disagreeingGroups.length
    ) {
      return {
        type: "split_decision",
        coalitionPattern: {
          description: `Groups ${this.formatGroupIds(agreeingGroups)} vs Groups ${this.formatGroupIds(disagreeingGroups)}`,
          agreeingGroups,
          disagreeingGroups,
          neutralGroups,
        },
      };
    }

    // 4. BRIDGE: Check for moderate agreement that connects groups
    // Bridge statements have moderate overall agreement but aren't split
    const avgAgreement =
      groupAgreements.reduce((sum, g) => sum + Math.abs(g.agreementPercentage), 0) /
      numGroups;

    if (
      avgAgreement >= 40 &&
      avgAgreement <= 70 &&
      agreeingGroups.length >= 2 &&
      disagreeingGroups.length >= 1
    ) {
      return {
        type: "bridge",
        coalitionPattern: {
          description: `Connects Groups ${this.formatGroupIds(agreeingGroups)}`,
          agreeingGroups,
          disagreeingGroups,
          neutralGroups,
        },
      };
    }

    // 5. DIVISIVE: Fragmented (no clear pattern)
    return {
      type: "divisive",
      coalitionPattern: {
        description: "Fragmented opinion",
        agreeingGroups,
        disagreeingGroups,
        neutralGroups,
      },
    };
  }

  /**
   * Format coalition description for partial consensus
   * @private
   */
  private static formatCoalitionDescription(
    majorityGroups: number[],
    minorityGroups: number[],
    majorityAction: "agree" | "disagree"
  ): string {
    const majority = this.formatGroupIds(majorityGroups);
    const minority = this.formatGroupIds(minorityGroups);

    if (minorityGroups.length === 1) {
      return `Groups ${majority} ${majorityAction} vs Group ${minority}`;
    }

    return `Groups ${majority} ${majorityAction} vs Groups ${minority}`;
  }

  /**
   * Format group IDs for display (0-indexed to 1-indexed)
   * @private
   */
  private static formatGroupIds(groupIds: number[]): string {
    return groupIds.map((id) => id + 1).join(",");
  }

  /**
   * Get user-friendly type label
   */
  static getTypeLabel(type: EnhancedStatementType): string {
    const labels: Record<EnhancedStatementType, string> = {
      full_consensus: "Full Consensus",
      partial_consensus: "Partial Consensus",
      split_decision: "Split Decision",
      divisive: "Divisive",
      bridge: "Bridge",
      normal: "Normal",
    };
    return labels[type];
  }
}
