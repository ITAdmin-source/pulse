/**
 * INSTRUMENTED VERSION of VotingService for performance debugging
 *
 * This is a temporary debugging version that logs detailed timing information.
 *
 * TO USE:
 * 1. Temporarily replace the import in actions/voting.ts:
 *    FROM: import { VotingService } from "@/lib/services/voting-service";
 *    TO:   import { VotingService } from "@/lib/services/voting-service-instrumented";
 *
 * 2. Vote on statements and check server console for timing logs
 *
 * 3. Revert the import when debugging is complete
 */

import { db } from "@/db/db";
import { votes, statements, polls } from "@/db/schema";
import { eq, and, sql, notInArray } from "drizzle-orm";

export class VotingService {
  /**
   * INSTRUMENTED: Get statement batch with detailed performance logging
   */
  static async getStatementBatch(
    pollId: string,
    userId: string,
    batchNumber: number
  ): Promise<typeof statements.$inferSelect[]> {
    const overallStart = performance.now();
    console.log("\n========================================");
    console.log(`[PERF] getStatementBatch START`);
    console.log(`[PERF] Poll: ${pollId}`);
    console.log(`[PERF] User: ${userId}`);
    console.log(`[PERF] Batch: ${batchNumber}`);
    console.log("========================================");

    if (batchNumber < 1) {
      throw new Error("Batch number must be at least 1");
    }

    try {
      // STEP 1: Get voted statement IDs
      const step1Start = performance.now();
      const votedStatementIds = await db
        .select({ statementId: votes.statementId })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(and(
          eq(votes.userId, userId),
          eq(statements.pollId, pollId)
        ));

      const votedIds = votedStatementIds.map(v => v.statementId);
      const step1Time = performance.now() - step1Start;
      console.log(`[PERF] STEP 1: Fetch voted IDs - ${step1Time.toFixed(2)}ms`);
      console.log(`[PERF]   - Found ${votedIds.length} voted statements`);

      // STEP 2: Get poll configuration
      const step2Start = performance.now();
      const poll = await db
        .select({
          id: polls.id,
          statementOrderMode: polls.statementOrderMode,
          randomSeed: polls.randomSeed,
        })
        .from(polls)
        .where(eq(polls.id, pollId))
        .limit(1);

      const orderMode = (poll[0]?.statementOrderMode as "sequential" | "random" | "weighted") || "random";
      const randomSeed = poll[0]?.randomSeed || null;
      const step2Time = performance.now() - step2Start;
      console.log(`[PERF] STEP 2: Fetch poll config - ${step2Time.toFixed(2)}ms`);
      console.log(`[PERF]   - Order mode: ${orderMode}`);
      console.log(`[PERF]   - Random seed: ${randomSeed || "default"}`);

      // STEP 3: Fetch statements based on order mode
      let result: typeof statements.$inferSelect[] = [];

      if (orderMode === "random") {
        console.log(`[PERF] STEP 3: Using OPTIMIZED random mode (SQL + MD5)`);
        const step3Start = performance.now();

        const seedString = randomSeed
          ? `${userId}-${randomSeed}-${batchNumber}`
          : `${userId}-${pollId}-${batchNumber}`;

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
            votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
          ))
          .orderBy(sql`md5(${statements.id}::text || ${seedString})`)
          .limit(10);

        const step3Time = performance.now() - step3Start;
        console.log(`[PERF] STEP 3: Fetch statements (OPTIMIZED) - ${step3Time.toFixed(2)}ms`);
        console.log(`[PERF]   - Fetched ${randomStatements.length} statements`);
        console.log(`[PERF]   - SQL-side filtering: votedIds.length = ${votedIds.length}`);

        result = randomStatements as typeof statements.$inferSelect[];

      } else if (orderMode === "weighted") {
        console.log(`[PERF] STEP 3: Using weighted mode (fetch all unvoted)`);
        const step3Start = performance.now();

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
          .orderBy(statements.createdAt);

        const fetchTime = performance.now() - step3Start;
        console.log(`[PERF] STEP 3a: Fetch all unvoted - ${fetchTime.toFixed(2)}ms`);
        console.log(`[PERF]   - Fetched ${allUnvotedStatements.length} statements`);

        const orderStart = performance.now();
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
        const orderTime = performance.now() - orderStart;
        console.log(`[PERF] STEP 3b: Apply weighted ordering - ${orderTime.toFixed(2)}ms`);

        const step3Time = fetchTime + orderTime;
        console.log(`[PERF] STEP 3: Total weighted mode time - ${step3Time.toFixed(2)}ms`);

        result = orderedStatements.slice(0, 10) as typeof statements.$inferSelect[];

      } else {
        console.log(`[PERF] STEP 3: Using sequential mode (simple)`);
        const step3Start = performance.now();

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

        const step3Time = performance.now() - step3Start;
        console.log(`[PERF] STEP 3: Fetch statements (sequential) - ${step3Time.toFixed(2)}ms`);
        console.log(`[PERF]   - Fetched ${sequentialStatements.length} statements`);

        result = sequentialStatements as typeof statements.$inferSelect[];
      }

      const overallTime = performance.now() - overallStart;
      console.log("========================================");
      console.log(`[PERF] TOTAL TIME: ${overallTime.toFixed(2)}ms`);
      console.log(`[PERF] Returned ${result.length} statements`);
      console.log("========================================\n");

      return result;

    } catch (error) {
      const overallTime = performance.now() - overallStart;
      console.error(`[PERF] ERROR after ${overallTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  /**
   * INSTRUMENTED: Get voting progress with performance logging
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
    const start = performance.now();
    console.log(`[PERF] getVotingProgress START`);

    try {
      const result = await db
        .select({
          totalStatements: sql<number>`count(distinct ${statements.id})::int`,
          totalVoted: sql<number>`count(distinct ${votes.id})::int`,
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

      const data = result[0];
      const totalVoted = data.totalVoted || 0;
      const totalStatements = data.totalStatements || 0;
      const currentBatch = Math.floor(totalVoted / 10) + 1;
      const hasMoreStatements = totalVoted < totalStatements;
      const thresholdReached = totalVoted >= 10;

      const time = performance.now() - start;
      console.log(`[PERF] getVotingProgress DONE - ${time.toFixed(2)}ms`);
      console.log(`[PERF]   - totalVoted: ${totalVoted}, totalStatements: ${totalStatements}`);

      return {
        totalVoted,
        totalStatements,
        currentBatch,
        hasMoreStatements,
        thresholdReached,
      };
    } catch (error) {
      const time = performance.now() - start;
      console.error(`[PERF] getVotingProgress ERROR after ${time.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}
