import { eq, and, count } from "drizzle-orm";
import { db } from "@/db/db";
import { votes, statements, polls } from "@/db/schema";
import type { Vote } from "@/db/schema";
import { createVoteSchema, updateVoteSchema, voteQuerySchema, userVotingProgressSchema } from "@/lib/validations/vote";
import { VoteValue, calculateVoteDistribution } from "@/lib/utils/voting";
import { PollService } from "./poll-service";
import { z } from "zod";

export class VotingService {
  static async castVote(data: z.infer<typeof createVoteSchema>): Promise<Vote> {
    const validatedData = createVoteSchema.parse(data);

    // Check if statement exists and is approved
    const statement = await db
      .select()
      .from(statements)
      .where(eq(statements.id, validatedData.statementId))
      .limit(1);

    if (!statement[0]) {
      throw new Error("Statement not found");
    }

    if (!statement[0].approved) {
      throw new Error("Cannot vote on unapproved statement");
    }

    // Check if poll is active
    if (!statement[0].pollId) {
      throw new Error("Statement is not associated with a poll");
    }

    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.id, statement[0].pollId))
      .limit(1);

    if (!poll[0]) {
      throw new Error("Poll not found");
    }

    const isVotingActive = await PollService.isVotingActive(poll[0]);
    if (!isVotingActive) {
      throw new Error("Voting is not active for this poll");
    }

    // Use INSERT ... ON CONFLICT to handle vote updates
    const [vote] = await db
      .insert(votes)
      .values({
        userId: validatedData.userId,
        statementId: validatedData.statementId,
        value: validatedData.value,
      })
      .onConflictDoUpdate({
        target: [votes.userId, votes.statementId],
        set: {
          value: validatedData.value,
          createdAt: new Date(),
        },
      })
      .returning();

    return vote;
  }

  static async updateVote(data: z.infer<typeof updateVoteSchema>): Promise<Vote> {
    // Update vote is the same as cast vote due to UPSERT behavior
    return this.castVote(data);
  }

  static async getUserVote(userId: string, statementId: string): Promise<Vote | null> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.statementId, statementId)
      ))
      .limit(1);

    return vote || null;
  }

  static async getUserVotesForPoll(userId: string, pollId: string): Promise<Vote[]> {
    const result = await db
      .select({
        id: votes.id,
        userId: votes.userId,
        statementId: votes.statementId,
        value: votes.value,
        createdAt: votes.createdAt,
      })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(and(
        eq(votes.userId, userId),
        eq(statements.pollId, pollId),
        eq(statements.approved, true) // Only include votes on approved statements
      ));

    return result;
  }

  static async getStatementVotes(statementId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(eq(votes.statementId, statementId));
  }

  static async getStatementVoteDistribution(statementId: string): Promise<{
    agree: number;
    disagree: number;
    neutral: number;
    total: number;
    percentages: {
      agree: number;
      disagree: number;
      neutral: number;
    };
  }> {
    const voteRecords = await this.getStatementVotes(statementId);
    const voteValues = voteRecords.map(v => v.value as VoteValue);
    return calculateVoteDistribution(voteValues);
  }

  static async deleteVote(userId: string, statementId: string): Promise<void> {
    await db
      .delete(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.statementId, statementId)
      ));
  }

  static async getUserVotingProgress(data: z.infer<typeof userVotingProgressSchema>): Promise<{
    votedStatements: number;
    totalApprovedStatements: number;
    hasReachedThreshold: boolean;
    remainingVotesNeeded: number;
  }> {
    const validatedData = userVotingProgressSchema.parse(data);

    // Get poll info for threshold
    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.id, validatedData.pollId))
      .limit(1);

    if (!poll[0]) {
      throw new Error("Poll not found");
    }

    const threshold = poll[0].minStatementsVotedToEnd;

    // Count user's votes on approved statements in this poll
    const userVotesResult = await db
      .select({ count: count() })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(and(
        eq(votes.userId, validatedData.userId),
        eq(statements.pollId, validatedData.pollId),
        eq(statements.approved, true)
      ));

    const votedStatements = userVotesResult[0]?.count || 0;

    // Count total approved statements in poll
    const totalStatementsResult = await db
      .select({ count: count() })
      .from(statements)
      .where(and(
        eq(statements.pollId, validatedData.pollId),
        eq(statements.approved, true)
      ));

    const totalApprovedStatements = totalStatementsResult[0]?.count || 0;

    const hasReachedThreshold = votedStatements >= threshold;
    const remainingVotesNeeded = Math.max(0, threshold - votedStatements);

    return {
      votedStatements,
      totalApprovedStatements,
      hasReachedThreshold,
      remainingVotesNeeded,
    };
  }

  static async findVotes(query: Partial<z.infer<typeof voteQuerySchema>> = {}): Promise<Vote[]> {
    const validatedQuery = voteQuerySchema.parse({
      ...query,
      limit: query.limit || 100,
      offset: query.offset || 0,
    });

    const conditions = [];

    if (validatedQuery.userId) {
      conditions.push(eq(votes.userId, validatedQuery.userId));
    }

    if (validatedQuery.statementId) {
      conditions.push(eq(votes.statementId, validatedQuery.statementId));
    }

    if (validatedQuery.value !== undefined) {
      conditions.push(eq(votes.value, validatedQuery.value));
    }

    if (validatedQuery.pollId) {
      // Join with statements to filter by poll
      const pollCondition = eq(statements.pollId, validatedQuery.pollId);
      const allConditions = conditions.length > 0 ? [pollCondition, ...conditions] : [pollCondition];

      const results = await db
        .select({
          id: votes.id,
          userId: votes.userId,
          statementId: votes.statementId,
          value: votes.value,
          createdAt: votes.createdAt,
        })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(and(...allConditions))
        .limit(validatedQuery.limit)
        .offset(validatedQuery.offset);

      return results as Vote[];
    } else {
      // No poll filter - use basic vote query
      if (conditions.length === 0) {
        return await db
          .select()
          .from(votes)
          .limit(validatedQuery.limit)
          .offset(validatedQuery.offset);
      } else if (conditions.length === 1) {
        return await db
          .select()
          .from(votes)
          .where(conditions[0])
          .limit(validatedQuery.limit)
          .offset(validatedQuery.offset);
      } else {
        return await db
          .select()
          .from(votes)
          .where(and(...conditions))
          .limit(validatedQuery.limit)
          .offset(validatedQuery.offset);
      }
    }
  }

  static async getPollVotesSummary(pollId: string): Promise<{
    totalVotes: number;
    uniqueVoters: number;
    voteDistribution: {
      agree: number;
      disagree: number;
      neutral: number;
    };
  }> {
    const allVotes = await this.findVotes({ pollId, limit: 10000 }); // Get all votes

    const uniqueVoters = new Set(allVotes.map(v => v.userId)).size;
    const voteValues = allVotes.map(v => v.value as VoteValue);
    const distribution = calculateVoteDistribution(voteValues);

    return {
      totalVotes: allVotes.length,
      uniqueVoters,
      voteDistribution: {
        agree: distribution.agree,
        disagree: distribution.disagree,
        neutral: distribution.neutral,
      },
    };
  }
}