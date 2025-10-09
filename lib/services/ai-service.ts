/**
 * AI Service - Real AI-powered insights using OpenAI GPT-5 mini
 *
 * This service provides AI-generated content for:
 * - Personal insights (user voting patterns) - Uses OpenAI GPT-5 mini API
 * - Poll results summaries (aggregate analysis) - Uses mock for now
 *
 * Personal insights are generated via /api/insights/generate endpoint
 * which calls OpenAI GPT-5 mini with Hebrew prompts
 */

import { getVotesByUserId } from "@/db/queries/votes-queries";
import { getPollById } from "@/db/queries/polls-queries";
import { getApprovedStatementsByPollId } from "@/db/queries/statements-queries";
import type { Vote } from "@/db/schema/votes";
import type { Poll } from "@/db/schema/polls";
import type { Statement } from "@/db/schema/statements";
import type { InsightGenerationRequest } from "@/lib/types/openai";
import { generateInsight, generateFallbackInsight } from "@/lib/ai/openai-client";

interface VoteStatistics {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  total: number;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
}

interface PollStatistics {
  totalVoters: number;
  totalVotes: number;
  statementCount: number;
  mostAgreed: {
    text: string;
    agreePercent: number;
    voteCount: number;
  };
  mostDisagreed: {
    text: string;
    disagreePercent: number;
    voteCount: number;
  };
  mostDivisive: {
    text: string;
    agreePercent: number;
    disagreePercent: number;
    voteCount: number;
  };
  overallSentiment: string;
  consensusLevel: string;
}

export class AIService {
  /**
   * Generate personal insight for user's voting pattern using GPT-5 mini
   *
   * @param userId - User ID (internal database ID)
   * @param pollId - Poll ID
   * @returns Object with title and body text for insight
   *
   * Now uses real OpenAI GPT-5 mini API with Hebrew prompts
   * Falls back to template-based insight if API fails
   */
  static async generatePersonalInsight(
    userId: string,
    pollId: string
  ): Promise<{ title: string; body: string }> {
    try {
      // Fetch poll and statements first
      const poll = await getPollById(pollId);
      if (!poll) {
        throw new Error("Poll not found");
      }

      const statements = await getApprovedStatementsByPollId(pollId);
      const statementIds = new Set(statements.map(s => s.id));

      // Fetch user votes for this poll
      const allUserVotes = await getVotesByUserId(userId);

      // Filter votes for this specific poll
      const pollVotes = allUserVotes.filter(v => statementIds.has(v.statementId));

      if (pollVotes.length === 0) {
        throw new Error(`No votes found for this poll. User has ${allUserVotes.length} total votes, but none match the ${statements.length} statements in this poll.`);
      }

      // Calculate user statistics
      const stats = this.calculateUserStatistics(pollVotes);

      // Build statements with votes for AI
      const statementsWithVotes = pollVotes.map((vote) => {
        const statement = statements.find((s) => s.id === vote.statementId);
        return {
          text: statement?.text || "",
          vote: vote.value as 1 | 0 | -1,
        };
      });

      // Build request for AI
      const insightRequest: InsightGenerationRequest = {
        userId,
        pollId: poll.id,
        pollQuestion: poll.question,
        pollDescription: poll.description,
        statements: statementsWithVotes,
        voteStatistics: stats,
      };

      // Try to generate with OpenAI GPT-5 mini
      try {
        const result = await generateInsight(insightRequest);
        return {
          title: result.title,
          body: result.body,
        };
      } catch (aiError) {
        console.error("[AIService] OpenAI generation failed, using fallback:", aiError);

        // Use fallback template-based insight
        const fallback = generateFallbackInsight(insightRequest);
        return {
          title: fallback.title,
          body: fallback.body,
        };
      }
    } catch (error) {
      console.error("Error generating personal insight:", error);
      throw error;
    }
  }

  /**
   * Generate poll-level results summary
   *
   * @param pollId - Poll ID
   * @returns Summary text describing overall poll results
   *
   * TODO: Replace with actual AI API call
   * Example integration:
   * ```typescript
   * const response = await openai.chat.completions.create({
   *   model: "gpt-4",
   *   messages: [
   *     { role: "system", content: "Analyze this poll data..." },
   *     { role: "user", content: JSON.stringify(pollStats) }
   *   ]
   * });
   * return response.summary;
   * ```
   */
  static async generatePollSummary(pollId: string): Promise<string> {
    try {
      const poll = await getPollById(pollId);
      if (!poll) {
        throw new Error("Poll not found");
      }

      const statements = await getApprovedStatementsByPollId(pollId);

      // Calculate poll-wide statistics
      const stats = await this.calculatePollStatistics(pollId, statements);

      // Generate summary text
      const summary = this.generateSummaryText(stats, poll);

      return summary;
    } catch (error) {
      console.error("Error generating poll summary:", error);
      throw error;
    }
  }

  /**
   * Calculate statistics for a user's votes
   */
  private static calculateUserStatistics(votes: Vote[]): VoteStatistics {
    const agreeCount = votes.filter(v => v.value === 1).length;
    const disagreeCount = votes.filter(v => v.value === -1).length;
    const unsureCount = votes.filter(v => v.value === 0).length;
    const total = votes.length;

    return {
      agreeCount,
      disagreeCount,
      unsureCount,
      total,
      agreePercent: Math.round((agreeCount / total) * 100),
      disagreePercent: Math.round((disagreeCount / total) * 100),
      unsurePercent: Math.round((unsureCount / total) * 100),
    };
  }

  /**
   * Generate insight title based on voting pattern
   * Includes contextual emoji for visual distinction and personality
   */
  private static generateInsightTitle(stats: VoteStatistics, poll: Poll): string {
    const { agreePercent, disagreePercent, unsurePercent } = stats;

    // Strong agreement pattern
    if (agreePercent >= 70) {
      return "🌟 Strong Alignment with Key Proposals";
    }

    // Strong disagreement pattern
    if (disagreePercent >= 70) {
      return "🎯 Critical Perspective on Current Issues";
    }

    // High uncertainty
    if (unsurePercent >= 40) {
      return "🤔 Thoughtful Consideration of Complex Topics";
    }

    // Balanced views
    if (Math.abs(agreePercent - disagreePercent) <= 20) {
      return "⚖️ Balanced Viewpoint with Nuanced Opinions";
    }

    // Moderate agreement
    if (agreePercent > disagreePercent) {
      return "👍 Generally Supportive with Some Reservations";
    }

    // Moderate disagreement
    return "🔍 Cautiously Skeptical of Proposed Ideas";
  }

  /**
   * Generate detailed insight body text
   */
  private static generateInsightBody(
    stats: VoteStatistics,
    poll: Poll,
    voteCount: number
  ): string {
    const { agreeCount, disagreeCount, unsureCount, agreePercent, disagreePercent } = stats;

    let body = `Based on your ${voteCount} votes on "${poll.question}", your voting pattern reveals a distinct perspective:\n\n`;

    // Voting breakdown
    body += `**Your Votes:**\n`;
    body += `• Agreed with ${agreeCount} statements (${agreePercent}%)\n`;
    body += `• Disagreed with ${disagreeCount} statements (${disagreePercent}%)\n`;
    body += `• Felt uncertain about ${unsureCount} statements (${stats.unsurePercent}%)\n\n`;

    // Interpretive analysis
    body += `**Analysis:**\n`;

    if (agreePercent >= 70) {
      body += `You show strong support for the ideas presented in this poll. Your high agreement rate suggests you align closely with the majority perspective on these issues. This indicates you share common values and priorities with other participants.\n\n`;
    } else if (disagreePercent >= 70) {
      body += `You demonstrate a critical viewpoint, disagreeing with most statements. This suggests you may have alternative perspectives or solutions that differ from the majority. Your independent thinking contributes valuable counterpoints to the discussion.\n\n`;
    } else if (unsureCount >= voteCount * 0.4) {
      body += `You showed thoughtful hesitation on many statements. This indicates you're carefully considering the nuances and complexities of the issues rather than taking firm stances. Your measured approach reflects intellectual honesty.\n\n`;
    } else {
      body += `Your votes show a balanced perspective, mixing agreement and disagreement. This nuanced approach suggests you evaluate each statement on its own merits rather than following a fixed ideological pattern. You demonstrate independent and critical thinking.\n\n`;
    }

    // Closing insight
    body += `**Key Takeaway:**\n`;
    if (Math.abs(agreePercent - disagreePercent) <= 15) {
      body += `Your nearly equal distribution of agreement and disagreement reveals a pragmatic mindset. You're willing to see merit in different viewpoints while maintaining critical judgment.`;
    } else if (agreePercent > 60) {
      body += `Your predominantly supportive stance shows confidence in the proposed directions. You see value in collective action and shared solutions.`;
    } else if (disagreePercent > 60) {
      body += `Your skeptical stance reveals a desire for alternative approaches. You challenge conventional wisdom and push for deeper consideration of the issues.`;
    } else {
      body += `Your varied responses show you evaluate each issue independently. You don't fit a simple pattern, which makes your perspective especially valuable for understanding the full spectrum of opinions.`;
    }

    return body;
  }

  /**
   * Calculate statistics for entire poll
   */
  private static async calculatePollStatistics(
    pollId: string,
    statements: Statement[]
  ): Promise<PollStatistics> {
    // Import here to avoid circular dependencies
    const { db } = await import("@/db/db");
    const { votes } = await import("@/db/schema/votes");
    const { sql, eq, and } = await import("drizzle-orm");

    // Get all votes for this poll's statements
    const statementIds = statements.map(s => s.id);
    const allVotes = await db.query.votes.findMany({
      where: (votes, { inArray }) => inArray(votes.statementId, statementIds),
    });

    // Calculate per-statement statistics
    const statementStats = statements.map(statement => {
      const statementVotes = allVotes.filter(v => v.statementId === statement.id);
      const agreeCount = statementVotes.filter(v => v.value === 1).length;
      const disagreeCount = statementVotes.filter(v => v.value === -1).length;
      const unsureCount = statementVotes.filter(v => v.value === 0).length;
      const total = statementVotes.length;

      return {
        statement,
        agreeCount,
        disagreeCount,
        unsureCount,
        total,
        agreePercent: total > 0 ? Math.round((agreeCount / total) * 100) : 0,
        disagreePercent: total > 0 ? Math.round((disagreeCount / total) * 100) : 0,
      };
    });

    // Find most agreed statement
    const mostAgreed = statementStats.reduce((max, curr) =>
      curr.agreePercent > max.agreePercent ? curr : max
    );

    // Find most disagreed statement
    const mostDisagreed = statementStats.reduce((max, curr) =>
      curr.disagreePercent > max.disagreePercent ? curr : max
    );

    // Find most divisive (closest to 50/50)
    const mostDivisive = statementStats.reduce((max, curr) => {
      const currDiff = Math.abs(50 - curr.agreePercent);
      const maxDiff = Math.abs(50 - max.agreePercent);
      return currDiff < maxDiff ? curr : max;
    });

    // Calculate overall sentiment
    const avgAgreePercent = statementStats.reduce((sum, s) => sum + s.agreePercent, 0) / statementStats.length;
    const overallSentiment = avgAgreePercent > 60
      ? "generally supportive"
      : avgAgreePercent < 40
        ? "generally skeptical"
        : "mixed with diverse opinions";

    // Calculate consensus level
    const highConsensusCount = statementStats.filter(s =>
      s.agreePercent > 70 || s.disagreePercent > 70
    ).length;
    const consensusPercent = Math.round((highConsensusCount / statementStats.length) * 100);
    const consensusLevel = consensusPercent > 60
      ? "strong consensus"
      : consensusPercent > 30
        ? "moderate agreement"
        : "significant disagreement";

    // Count unique voters
    const uniqueVoters = new Set(allVotes.map(v => v.userId)).size;

    return {
      totalVoters: uniqueVoters,
      totalVotes: allVotes.length,
      statementCount: statements.length,
      mostAgreed: {
        text: mostAgreed.statement.text,
        agreePercent: mostAgreed.agreePercent,
        voteCount: mostAgreed.total,
      },
      mostDisagreed: {
        text: mostDisagreed.statement.text,
        disagreePercent: mostDisagreed.disagreePercent,
        voteCount: mostDisagreed.total,
      },
      mostDivisive: {
        text: mostDivisive.statement.text,
        agreePercent: mostDivisive.agreePercent,
        disagreePercent: mostDivisive.disagreePercent,
        voteCount: mostDivisive.total,
      },
      overallSentiment,
      consensusLevel,
    };
  }

  /**
   * Generate human-readable summary text
   */
  private static generateSummaryText(stats: PollStatistics, poll: Poll): string {
    let summary = `# ${poll.question}\n\n`;

    summary += `## Overview\n\n`;
    summary += `This poll engaged **${stats.totalVoters} participants** who collectively cast **${stats.totalVotes} votes** across **${stats.statementCount} statements**. `;
    summary += `The results reveal a ${stats.consensusLevel} among participants, with sentiment ${stats.overallSentiment}.\n\n`;

    summary += `## Key Findings\n\n`;

    // Most agreed statement
    summary += `### Highest Agreement\n`;
    summary += `**${stats.mostAgreed.agreePercent}% agreement** (${stats.mostAgreed.voteCount} votes)\n\n`;
    summary += `> "${stats.mostAgreed.text}"\n\n`;
    summary += `This statement resonated strongly with the community, indicating shared values and priorities.\n\n`;

    // Most disagreed statement
    summary += `### Highest Disagreement\n`;
    summary += `**${stats.mostDisagreed.disagreePercent}% disagreement** (${stats.mostDisagreed.voteCount} votes)\n\n`;
    summary += `> "${stats.mostDisagreed.text}"\n\n`;
    summary += `This statement faced significant pushback, suggesting it may be controversial or misaligned with community values.\n\n`;

    // Most divisive
    summary += `### Most Divisive Issue\n`;
    summary += `**${stats.mostDivisive.agreePercent}% agree, ${stats.mostDivisive.disagreePercent}% disagree** (${stats.mostDivisive.voteCount} votes)\n\n`;
    summary += `> "${stats.mostDivisive.text}"\n\n`;
    summary += `This statement split the community nearly evenly, highlighting an area where opinions diverge sharply.\n\n`;

    // Conclusion
    summary += `## Conclusion\n\n`;
    if (stats.overallSentiment.includes("supportive")) {
      summary += `The community shows general support for the ideas presented in this poll. `;
      summary += `While some disagreement exists, the overall trend suggests alignment on core principles. `;
      summary += `The areas of division offer opportunities for deeper discussion and refinement of proposals.`;
    } else if (stats.overallSentiment.includes("skeptical")) {
      summary += `The community expresses significant skepticism toward many of the statements in this poll. `;
      summary += `This critical stance suggests a need for alternative approaches or more compelling arguments. `;
      summary += `The areas of agreement could serve as starting points for building broader consensus.`;
    } else {
      summary += `The community displays diverse and nuanced opinions on these issues. `;
      summary += `This variety of perspectives indicates a thoughtful, engaged group that doesn't follow simple patterns. `;
      summary += `The mixture of agreement and disagreement suggests these topics warrant continued discussion and exploration.`;
    }

    return summary;
  }
}
