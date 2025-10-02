import { eq, inArray, and } from "drizzle-orm";
import { db } from "@/db/db";
import { polls, statements, votes, pollResultsSummaries } from "@/db/schema";
import type { PollResultsSummary } from "@/db/schema";
import { VoteValue, calculateVoteDistribution } from "@/lib/utils/voting";
import { AIService } from "./ai-service";

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
   * Get vote distribution by demographics (future feature)
   * Placeholder for demographic breakdown functionality
   */
  static async getDemographicBreakdown(pollId: string, statementId: string): Promise<{
    byAgeGroup: Record<string, { agree: number; disagree: number; neutral: number }>;
    byGender: Record<string, { agree: number; disagree: number; neutral: number }>;
    byEthnicity: Record<string, { agree: number; disagree: number; neutral: number }>;
    byPoliticalParty: Record<string, { agree: number; disagree: number; neutral: number }>;
  }> {
    // TODO: Implement demographic breakdown
    // This will require joining votes with user_demographics table
    // and grouping by demographic categories

    throw new Error("Demographic breakdown feature not yet implemented");
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
}
