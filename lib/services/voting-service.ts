import { eq, and, count, notInArray, sql } from "drizzle-orm";
import { db } from "@/db/db";
import { votes, statements, polls } from "@/db/schema";
import type { Vote } from "@/db/schema";
import { createVoteSchema, voteQuerySchema, userVotingProgressSchema } from "@/lib/validations/vote";
import { VoteValue, calculateVoteDistribution, getMinimumVotingThreshold } from "@/lib/utils/voting";
import { PollService } from "./poll-service";
import { UserService } from "./user-service";
import { ClusteringService } from "./clustering-service";
import { StatementWeightingService } from "./statement-weighting-service";
import { z } from "zod";

export class VotingService {
  /**
   * Check if clustering should be triggered based on batch completion or milestones
   *
   * @param userId - User ID
   * @param pollId - Poll ID
   * @param currentVoteCount - Total votes cast by user (including the vote just cast)
   * @returns Object indicating if trigger should fire and the reason
   */
  private static async shouldTriggerClustering(
    userId: string,
    pollId: string,
    currentVoteCount: number
  ): Promise<{ shouldTrigger: boolean; reason: string }> {
    // Milestone vote counts that always trigger clustering
    const milestones = [10, 20, 50, 100, 200, 500];

    if (milestones.includes(currentVoteCount)) {
      return {
        shouldTrigger: true,
        reason: `Milestone reached: ${currentVoteCount} votes`,
      };
    }

    // Check if batch was just completed
    // A batch is complete when user has voted on all statements in current batch
    // Batch size is 10, but may be less for final batch

    // Get total approved statements in poll
    const totalStatementsResult = await db
      .select({ count: count() })
      .from(statements)
      .where(and(eq(statements.pollId, pollId), eq(statements.approved, true)));

    const totalStatements = totalStatementsResult[0]?.count || 0;

    if (totalStatements === 0) {
      return { shouldTrigger: false, reason: "No approved statements" };
    }

    // Calculate which batch the user just completed
    // Batches are 10 statements each, except possibly the last batch
    const currentBatchNumber = Math.floor((currentVoteCount - 1) / 10) + 1;
    const startOfBatch = (currentBatchNumber - 1) * 10;
    const expectedBatchSize = Math.min(10, totalStatements - startOfBatch);

    // Check if current vote count is exactly at the end of a batch
    const positionInBatch = ((currentVoteCount - 1) % 10) + 1;

    if (positionInBatch === expectedBatchSize) {
      return {
        shouldTrigger: true,
        reason: `Batch ${currentBatchNumber} completed (${expectedBatchSize} statements)`,
      };
    }

    return {
      shouldTrigger: false,
      reason: `Mid-batch: ${positionInBatch}/${expectedBatchSize} in batch ${currentBatchNumber}`,
    };
  }

  /**
   * Cast vote with automatic user creation for anonymous users
   * @param statementId ID of the statement to vote on
   * @param value Vote value (-1, 0, 1)
   * @param clerkUserId Clerk user ID for authenticated users
   * @param sessionId Session ID for anonymous users
   */
  static async castVoteWithUserCreation(
    statementId: string,
    value: -1 | 0 | 1,
    clerkUserId?: string,
    sessionId?: string
  ): Promise<Vote> {
    // Determine user ID - create anonymous user if needed
    let userId: string;

    if (clerkUserId) {
      // Authenticated user - get existing user
      const user = await UserService.findByClerkId(clerkUserId);
      if (!user) {
        throw new Error("Authenticated user not found");
      }
      userId = user.id;
    } else if (sessionId) {
      // Anonymous user - create if needed
      const user = await UserService.createAnonymousUserForAction(sessionId);
      userId = user.id;
    } else {
      throw new Error("Either clerkUserId or sessionId must be provided");
    }

    // Cast the vote with the user ID
    return await this.castVote({
      userId,
      statementId,
      value,
    });
  }

  /**
   * Cast vote - votes are final and cannot be changed once submitted
   */
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
      // Allow votes within grace period after poll closes (10 minutes)
      const gracePeriodMinutes = 10;
      if (poll[0].endTime) {
        const minutesSinceClosed = (Date.now() - new Date(poll[0].endTime).getTime()) / (1000 * 60);
        if (minutesSinceClosed <= gracePeriodMinutes) {
          // Within grace period - allow vote and log for monitoring
          console.log(`Vote allowed in ${gracePeriodMinutes}min grace period (${minutesSinceClosed.toFixed(1)}min since close)`);
        } else {
          throw new Error("Voting is not active for this poll");
        }
      } else {
        throw new Error("Voting is not active for this poll");
      }
    }

    // Check if vote already exists - votes are final and immutable
    const existingVote = await this.getUserVote(
      validatedData.userId,
      validatedData.statementId
    );

    if (existingVote) {
      throw new Error(
        "Vote already cast - votes are final and cannot be changed"
      );
    }

    // Insert vote (no conflict handling - votes are immutable)
    const [vote] = await db
      .insert(votes)
      .values({
        userId: validatedData.userId,
        statementId: validatedData.statementId,
        value: validatedData.value,
      })
      .returning();

    // Check if clustering should be triggered based on batch completion or milestones
    if (statement[0].pollId) {
      // Get user's total vote count (including the vote just cast)
      const userVotesResult = await db
        .select({ count: count() })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(
          and(
            eq(votes.userId, validatedData.userId),
            eq(statements.pollId, statement[0].pollId),
            eq(statements.approved, true)
          )
        );

      const totalVoteCount = userVotesResult[0]?.count || 0;

      const triggerCheck = await this.shouldTriggerClustering(
        validatedData.userId,
        statement[0].pollId,
        totalVoteCount
      );

      console.log(
        `[VotingService] Clustering trigger check for poll ${statement[0].pollId}:`,
        {
          userId: validatedData.userId,
          totalVotes: totalVoteCount,
          shouldTrigger: triggerCheck.shouldTrigger,
          reason: triggerCheck.reason,
        }
      );

      if (triggerCheck.shouldTrigger) {
        console.log(
          `[VotingService] Clustering trigger detected for poll ${statement[0].pollId}: ${triggerCheck.reason}`
        );

        // Invalidate and eagerly recalculate statement weights on batch completion
        // This ensures weights are always up-to-date with current vote distribution
        try {
          // Step 1: Invalidate old cache
          await StatementWeightingService.invalidateWeights(statement[0].pollId);
          console.log(
            `[VotingService] Invalidated weight cache for poll ${statement[0].pollId} after batch completion`
          );

          // Step 2: Eagerly recalculate weights for ALL approved statements
          // Get all approved statements for this poll
          const { statements: statementsSchema } = await import("@/db/schema");
          const { eq, and } = await import("drizzle-orm");
          const { db } = await import("@/db/db");

          const approvedStatements = await db
            .select({ id: statementsSchema.id })
            .from(statementsSchema)
            .where(
              and(
                eq(statementsSchema.pollId, statement[0].pollId),
                eq(statementsSchema.approved, true)
              )
            );

          const statementIds = approvedStatements.map(s => s.id);

          if (statementIds.length > 0) {
            // Calculate weights for all statements (this also caches them)
            await StatementWeightingService.getStatementWeights(
              statement[0].pollId,
              statementIds
            );
            console.log(
              `[VotingService] Eagerly recalculated weights for ${statementIds.length} statements in poll ${statement[0].pollId}`
            );
          }
        } catch (error) {
          // Log error but don't fail the vote
          console.error(
            `[VotingService] Failed to invalidate/recalculate weight cache for poll ${statement[0].pollId}:`,
            error
          );
        }

        // Enqueue clustering job for background processing via Vercel Cron
        try {
          const { ClusteringQueueService } = await import("./clustering-queue-service");
          await ClusteringQueueService.enqueueJob(statement[0].pollId);
        } catch (error) {
          // Log error but don't fail the vote
          console.error(
            `[VotingService] Failed to enqueue clustering job for poll ${statement[0].pollId}:`,
            error
          );
        }
      }
    }

    return vote;
  }

  static async updateVote(): Promise<Vote> {
    // Votes are immutable - updates are not allowed
    throw new Error(
      "Vote updates are not allowed - votes are final and irreversible"
    );
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

  /**
   * Get user's voting progress for a poll
   *
   * IMPORTANT: Handles deleted statements correctly via INNER JOIN
   * - If a statement is deleted, its votes are cascade-deleted (see statements schema)
   * - INNER JOIN automatically excludes votes for deleted statements
   * - Only counts votes on currently approved statements
   * - Threshold dynamically recalculates based on remaining statements
   *
   * Example: User votes on 10/15 statements, admin deletes 3 voted statements
   * Result: votedStatements = 7, totalStatements = 12, threshold = 10 (unchanged)
   * User needs 3 more votes to reach threshold (not 0, as expected)
   */
  static async getUserVotingProgress(data: z.infer<typeof userVotingProgressSchema>): Promise<{
    votedStatements: number;
    totalApprovedStatements: number;
    hasReachedThreshold: boolean;
    remainingVotesNeeded: number;
  }> {
    const validatedData = userVotingProgressSchema.parse(data);

    // Count user's votes on approved statements in this poll
    // INNER JOIN ensures deleted statements (cascade deleted votes) are excluded
    const userVotesResult = await db
      .select({ count: count() })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(and(
        eq(votes.userId, validatedData.userId),
        eq(statements.pollId, validatedData.pollId),
        eq(statements.approved, true) // Only count votes on approved statements
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

    // Calculate fixed threshold: first batch (10) or all statements if fewer
    const threshold = getMinimumVotingThreshold(totalApprovedStatements);

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

  /**
   * Get next batch of statements for user (10 at a time)
   *
   * IMPORTANT: Applies ordering strategy to ALL approved statements BEFORE filtering and batching.
   * This ensures true randomization - any statement can appear in any batch.
   *
   * Flow:
   * 1. Fetch ALL approved statements (no limit)
   * 2. Get voted statement IDs
   * 3. Apply ordering strategy (sequential/random/weighted) to ALL statements
   * 4. Filter out already-voted statements (maintains order from step 3)
   * 5. Return first 10 (current batch)
   */
  static async getStatementBatch(
    pollId: string,
    userId: string,
    batchNumber: number = 1  // Default value enables parallelization
  ): Promise<typeof statements.$inferSelect[]> {
    if (batchNumber < 1) {
      throw new Error("Batch number must be at least 1");
    }

    // PHASE 2 OPTIMIZATION: Parallelize voted IDs and poll config queries
    const [votedStatementIds, pollResults] = await Promise.all([
      // 1. Get all statement IDs the user has already voted on for this poll
      db.select({ statementId: votes.statementId })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(and(
          eq(votes.userId, userId),
          eq(statements.pollId, pollId)
        )),
      // 2. Get poll configuration for ordering strategy
      db.select({
        id: polls.id,
        statementOrderMode: polls.statementOrderMode,
        randomSeed: polls.randomSeed,
      })
        .from(polls)
        .where(eq(polls.id, pollId))
        .limit(1)
    ]);

    const votedIds = votedStatementIds.map(v => v.statementId);
    const poll = pollResults;

    const orderMode = (poll[0]?.statementOrderMode as "sequential" | "random" | "weighted") || "random";
    const randomSeed = poll[0]?.randomSeed || null;

    // 3. OPTIMIZATION: Different strategies for different order modes
    if (orderMode === "random") {
      // OPTIMIZED PATH: SQL-side deterministic random ordering
      // Uses hash-based ordering to fetch only what we need (10 rows instead of 200+)

      // Generate deterministic seed string from context
      // Note: batchNumber removed - user doesn't need same statements on refresh
      const seedString = randomSeed
        ? `${userId}-${randomSeed}`
        : `${userId}-${pollId}`;

      // Fetch ONLY unvoted statements with SQL-side random ordering
      const randomStatements = await db
        .select({
          id: statements.id,
          createdAt: statements.createdAt,
          pollId: statements.pollId,
          text: statements.text,
          submittedBy: statements.submittedBy,
          approved: statements.approved,
          approvedBy: statements.approvedBy,
          approvedAt: statements.approvedAt,
        })
        .from(statements)
        .where(and(
          eq(statements.pollId, pollId),
          eq(statements.approved, true),
          // SQL-level filtering: exclude voted statements
          votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
        ))
        // Hash-based deterministic random: md5(statement_id || seed) creates unique "random" value per statement
        // Same seed → same order (deterministic), different users → different order
        .orderBy(sql`md5(${statements.id}::text || ${seedString})`)
        .limit(10); // Only fetch what we need!

      return randomStatements as typeof statements.$inferSelect[];

    } else if (orderMode === "weighted") {
      // FUTURE WEIGHTED PATH: Fetch all unvoted statements for weight calculation
      // Weighted ordering requires all unvoted statements to calculate/apply weights
      const allUnvotedStatements = await db
        .select({
          id: statements.id,
          createdAt: statements.createdAt,
          pollId: statements.pollId,
          text: statements.text,
          submittedBy: statements.submittedBy,
          approved: statements.approved,
          approvedBy: statements.approvedBy,
          approvedAt: statements.approvedAt,
        })
        .from(statements)
        .where(and(
          eq(statements.pollId, pollId),
          eq(statements.approved, true),
          votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
        ))
        .orderBy(statements.createdAt); // Base ordering for consistency

      // Apply weighted ordering strategy
      const { StatementOrderingService } = await import("./statement-ordering-service");
      const orderedStatements = await StatementOrderingService.orderStatements(
        allUnvotedStatements,
        {
          userId,
          pollId,
          batchNumber,
          pollConfig: { orderMode: "weighted", randomSeed },
        }
      );

      return orderedStatements.slice(0, 10) as typeof statements.$inferSelect[];

    } else {
      // SEQUENTIAL MODE: Simple created_at ordering
      const sequentialStatements = await db
        .select({
          id: statements.id,
          createdAt: statements.createdAt,
          pollId: statements.pollId,
          text: statements.text,
          submittedBy: statements.submittedBy,
          approved: statements.approved,
          approvedBy: statements.approvedBy,
          approvedAt: statements.approvedAt,
        })
        .from(statements)
        .where(and(
          eq(statements.pollId, pollId),
          eq(statements.approved, true),
          votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
        ))
        .orderBy(statements.createdAt)
        .limit(10);

      return sequentialStatements as typeof statements.$inferSelect[];
    }
  }

  /**
   * Get user's voting progress including batching information
   * OPTIMIZED: Single query instead of 3 separate queries
   */
  static async getVotingProgress(
    pollId: string,
    userId: string
  ): Promise<{
    totalVoted: number;
    totalStatements: number;
    currentBatch: number;
    hasMoreStatements: boolean;
    thresholdReached: boolean;
  }> {
    // Single optimized query that gets all needed data
    const result = await db
      .select({
        totalStatements: count(statements.id),
        votedStatements: count(votes.id),
      })
      .from(statements)
      .leftJoin(
        votes,
        and(
          eq(votes.statementId, statements.id),
          eq(votes.userId, userId)
        )
      )
      .where(and(
        eq(statements.pollId, pollId),
        eq(statements.approved, true)
      ));

    const totalStatements = result[0]?.totalStatements || 0;
    const votedStatements = result[0]?.votedStatements || 0;

    // Calculate threshold and progress
    const threshold = getMinimumVotingThreshold(totalStatements);
    const thresholdReached = votedStatements >= threshold;
    const currentBatch = Math.ceil(votedStatements / 10) || 1;

    // Check if there are more unvoted statements
    const hasMoreStatements = votedStatements < totalStatements;

    return {
      totalVoted: votedStatements,
      totalStatements,
      currentBatch,
      hasMoreStatements,
      thresholdReached,
    };
  }
}