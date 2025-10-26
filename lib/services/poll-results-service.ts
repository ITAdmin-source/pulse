import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db/db";
import { polls, statements, votes, pollResultsSummaries } from "@/db/schema";
import { VoteValue, calculateVoteDistribution } from "@/lib/utils/voting";
import { AIService } from "./ai-service";
import {
  getVoteBreakdownByAgeGroup,
  getVoteBreakdownByGender,
  getVoteBreakdownByEthnicity,
  getVoteBreakdownByPoliticalParty,
  getPollVoteBreakdownByAgeGroup,
  getPollVoteBreakdownByGender,
  getPollVoteBreakdownByEthnicity,
  getPollVoteBreakdownByPoliticalParty,
  getPollParticipantsByDemographic,
  type DemographicVoteBreakdown,
  getHeatmapDataForAttribute,
  type DemographicAttribute,
  type HeatmapStatementData,
} from "@/db/queries/demographic-analytics-queries";

export class PollResultsService {
  /**
   * Get aggregate results for a poll with vote distributions per statement
   */
  static async getPollResults(pollId: string): Promise<{
    pollQuestion: string;
    totalVoters: number;
    totalVotes: number;
    statements: Array<{
      id: string;
      text: string;
      agreeCount: number;
      disagreeCount: number;
      unsureCount: number;
      agreePercent: number;
      disagreePercent: number;
      unsurePercent: number;
      totalVotes: number;
    }>;
  }> {
    // Get poll information
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!poll) {
      throw new Error("Poll not found");
    }

    // Get all approved statements for this poll
    const approvedStatements = await db
      .select()
      .from(statements)
      .where(and(
        eq(statements.pollId, pollId),
        eq(statements.approved, true)
      ));

    if (approvedStatements.length === 0) {
      return {
        pollQuestion: poll.question,
        totalVoters: 0,
        totalVotes: 0,
        statements: [],
      };
    }

    const statementIds = approvedStatements.map(s => s.id);

    // Get all votes for these statements
    const allVotes = await db
      .select()
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    // Calculate unique voters
    const uniqueVoters = new Set(allVotes.map(v => v.userId)).size;

    // Calculate distribution per statement
    const statementResults = approvedStatements.map(statement => {
      const statementVotes = allVotes.filter(v => v.statementId === statement.id);
      const voteValues = statementVotes.map(v => v.value as VoteValue);
      const distribution = calculateVoteDistribution(voteValues);

      return {
        id: statement.id,
        text: statement.text,
        agreeCount: distribution.agree,
        disagreeCount: distribution.disagree,
        unsureCount: distribution.neutral,
        agreePercent: distribution.percentages.agree,
        disagreePercent: distribution.percentages.disagree,
        unsurePercent: distribution.percentages.neutral,
        totalVotes: distribution.total,
      };
    });

    return {
      pollQuestion: poll.question,
      totalVoters: uniqueVoters,
      totalVotes: allVotes.length,
      statements: statementResults,
    };
  }

  /**
   * Get or generate AI summary for poll results
   * Returns existing summary if it exists and is recent (< 24 hours)
   * Otherwise generates new summary
   */
  static async getPollResultsSummary(pollId: string): Promise<{
    summaryText: string;
    participantCount: number;
    voteCount: number;
    generatedAt: Date;
  }> {
    // Check if summary exists
    const [existingSummary] = await db
      .select()
      .from(pollResultsSummaries)
      .where(eq(pollResultsSummaries.pollId, pollId))
      .limit(1);

    // If summary exists and is recent (< 24 hours), return it
    if (existingSummary) {
      const hoursSinceGeneration = (Date.now() - existingSummary.generatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceGeneration < 24) {
        return {
          summaryText: existingSummary.summaryText,
          participantCount: existingSummary.participantCount,
          voteCount: existingSummary.voteCount,
          generatedAt: existingSummary.generatedAt,
        };
      }
    }

    // Generate new summary using AI service
    const summaryText = await AIService.generatePollSummary(pollId);
    const pollResults = await this.getPollResults(pollId);

    // Store summary in database
    const [savedSummary] = await db
      .insert(pollResultsSummaries)
      .values({
        pollId,
        summaryText,
        participantCount: pollResults.totalVoters,
        voteCount: pollResults.totalVotes,
      })
      .onConflictDoUpdate({
        target: pollResultsSummaries.pollId,
        set: {
          summaryText,
          participantCount: pollResults.totalVoters,
          voteCount: pollResults.totalVotes,
          generatedAt: new Date(),
        },
      })
      .returning();

    return {
      summaryText: savedSummary.summaryText,
      participantCount: savedSummary.participantCount,
      voteCount: savedSummary.voteCount,
      generatedAt: savedSummary.generatedAt,
    };
  }

  /**
   * Get vote distribution by demographics for a specific statement
   * Returns vote breakdown by age group, gender, ethnicity, and political party
   *
   * @param statementId - ID of the statement to analyze
   * @param privacyThreshold - Minimum number of votes per category to include (default: 5)
   */
  static async getDemographicBreakdown(
    statementId: string,
    privacyThreshold: number = 5
  ): Promise<{
    byAgeGroup: DemographicVoteBreakdown[];
    byGender: DemographicVoteBreakdown[];
    byEthnicity: DemographicVoteBreakdown[];
    byPoliticalParty: DemographicVoteBreakdown[];
  }> {
    // Fetch all demographic breakdowns in parallel
    const [byAgeGroup, byGender, byEthnicity, byPoliticalParty] = await Promise.all([
      getVoteBreakdownByAgeGroup(statementId),
      getVoteBreakdownByGender(statementId),
      getVoteBreakdownByEthnicity(statementId),
      getVoteBreakdownByPoliticalParty(statementId),
    ]);

    // Apply privacy threshold - filter out categories with too few votes
    const filterByThreshold = (data: DemographicVoteBreakdown[]) =>
      data.filter(item => item.totalVotes >= privacyThreshold);

    return {
      byAgeGroup: filterByThreshold(byAgeGroup),
      byGender: filterByThreshold(byGender),
      byEthnicity: filterByThreshold(byEthnicity),
      byPoliticalParty: filterByThreshold(byPoliticalParty),
    };
  }

  /**
   * Get aggregate vote distribution by demographics for an entire poll
   * Returns aggregate vote breakdown across all statements in the poll
   *
   * @param pollId - ID of the poll to analyze
   * @param privacyThreshold - Minimum number of votes per category to include (default: 5)
   */
  static async getPollDemographicBreakdown(
    pollId: string,
    privacyThreshold: number = 5
  ): Promise<{
    byAgeGroup: DemographicVoteBreakdown[];
    byGender: DemographicVoteBreakdown[];
    byEthnicity: DemographicVoteBreakdown[];
    byPoliticalParty: DemographicVoteBreakdown[];
    participants: {
      byAgeGroup: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byGender: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byEthnicity: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byPoliticalParty: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    };
  }> {
    // Fetch all demographic breakdowns and participant counts in parallel
    const [byAgeGroup, byGender, byEthnicity, byPoliticalParty, participants] = await Promise.all([
      getPollVoteBreakdownByAgeGroup(pollId),
      getPollVoteBreakdownByGender(pollId),
      getPollVoteBreakdownByEthnicity(pollId),
      getPollVoteBreakdownByPoliticalParty(pollId),
      getPollParticipantsByDemographic(pollId),
    ]);

    // Apply privacy threshold - filter out categories with too few votes
    const filterByThreshold = (data: DemographicVoteBreakdown[]) =>
      data.filter(item => item.totalVotes >= privacyThreshold);

    return {
      byAgeGroup: filterByThreshold(byAgeGroup),
      byGender: filterByThreshold(byGender),
      byEthnicity: filterByThreshold(byEthnicity),
      byPoliticalParty: filterByThreshold(byPoliticalParty),
      participants,
    };
  }

  /**
   * Generate a simple text summary from poll results
   * This is a placeholder until AI generation is implemented
   */
  private static generateSimpleSummary(pollResults: {
    pollQuestion: string;
    totalVoters: number;
    totalVotes: number;
    statements: Array<{
      id: string;
      text: string;
      agreeCount: number;
      disagreeCount: number;
      unsureCount: number;
      agreePercent: number;
      disagreePercent: number;
      unsurePercent: number;
      totalVotes: number;
    }>;
  }): string {
    const { pollQuestion, totalVoters, totalVotes, statements } = pollResults;

    // Find most agreed and most disagreed statements
    const sortedByAgree = [...statements].sort((a, b) => b.agreePercent - a.agreePercent);
    const sortedByDisagree = [...statements].sort((a, b) => b.disagreePercent - a.disagreePercent);
    const sortedByDivisive = [...statements].sort((a, b) => {
      const aDiff = Math.abs(a.agreePercent - a.disagreePercent);
      const bDiff = Math.abs(b.agreePercent - b.disagreePercent);
      return aDiff - bDiff; // Smallest difference = most divisive
    });

    let summary = `## Poll Results: ${pollQuestion}\n\n`;
    summary += `This poll received ${totalVotes} votes from ${totalVoters} participants across ${statements.length} statements.\n\n`;

    if (sortedByAgree.length > 0) {
      summary += `### Key Findings\n\n`;
      summary += `**Strongest Agreement:** "${sortedByAgree[0].text}" (${sortedByAgree[0].agreePercent}% agree)\n\n`;
    }

    if (sortedByDisagree.length > 0) {
      summary += `**Strongest Disagreement:** "${sortedByDisagree[0].text}" (${sortedByDisagree[0].disagreePercent}% disagree)\n\n`;
    }

    if (sortedByDivisive.length > 0 && sortedByDivisive[0].totalVotes > 0) {
      summary += `**Most Divisive:** "${sortedByDivisive[0].text}" (${sortedByDivisive[0].agreePercent}% agree, ${sortedByDivisive[0].disagreePercent}% disagree)\n\n`;
    }

    summary += `### Overall Trends\n\n`;

    // Calculate average agreement across all statements
    const avgAgree = statements.reduce((sum, s) => sum + s.agreePercent, 0) / statements.length;
    const avgDisagree = statements.reduce((sum, s) => sum + s.disagreePercent, 0) / statements.length;

    summary += `On average, participants agreed with statements ${avgAgree.toFixed(1)}% of the time and disagreed ${avgDisagree.toFixed(1)}% of the time.\n\n`;
    summary += `This summary represents the collective sentiment of the poll participants. Individual perspectives may vary.`;

    return summary;
  }

  /**
   * Invalidate (delete) summary to force regeneration on next request
   */
  static async invalidateSummary(pollId: string): Promise<void> {
    await db
      .delete(pollResultsSummaries)
      .where(eq(pollResultsSummaries.pollId, pollId));
  }

  /**
   * HEATMAP METHODS
   */

  // Simple in-memory cache for heatmap data (5-minute TTL)
  private static heatmapCache = new Map<string, { data: HeatmapStatementData[]; timestamp: number }>();
  private static readonly HEATMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get heatmap data for a poll by demographic attribute
   * Results are cached for 5 minutes
   */
  static async getHeatmapData(
    pollId: string,
    attribute: DemographicAttribute,
    privacyThreshold: number = 3
  ): Promise<HeatmapStatementData[]> {
    const cacheKey = `${pollId}:${attribute}:${privacyThreshold}`;

    // Check cache
    const cached = this.heatmapCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.HEATMAP_CACHE_TTL) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await getHeatmapDataForAttribute(pollId, attribute, privacyThreshold);

    // Store in cache
    this.heatmapCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Invalidate heatmap cache for a specific poll
   * Call this when new votes are submitted
   */
  static invalidateHeatmapCache(pollId: string): void {
    // Remove all cache entries for this poll
    const keysToDelete: string[] = [];
    for (const key of this.heatmapCache.keys()) {
      if (key.startsWith(`${pollId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.heatmapCache.delete(key));
  }

  /**
   * Clear entire heatmap cache
   * Useful for testing or manual cache refresh
   */
  static clearHeatmapCache(): void {
    this.heatmapCache.clear();
  }
}
