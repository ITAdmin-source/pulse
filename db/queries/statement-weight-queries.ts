/**
 * Statement Weight Queries
 *
 * Database queries for managing statement weights cache.
 * Weights are cached to avoid recomputing on every request.
 *
 * Cache invalidation strategy:
 * - When clustering is recomputed (new group data available)
 * - When new statement is approved (affects recency distribution)
 */

import { db } from "@/db/db";
import { eq, inArray, sql, and } from "drizzle-orm";
import { statementWeights, votes } from "@/db/schema";
import type { StatementWeight, NewStatementWeight } from "@/db/schema";

/**
 * Get all cached weights for a poll
 *
 * @param pollId - Poll ID
 * @returns Array of cached statement weights
 */
export async function getCachedStatementWeights(
  pollId: string
): Promise<StatementWeight[]> {
  return await db
    .select()
    .from(statementWeights)
    .where(eq(statementWeights.pollId, pollId));
}

/**
 * Get cached weights for specific statements
 *
 * @param pollId - Poll ID
 * @param statementIds - Array of statement IDs to lookup
 * @returns Map of statementId → StatementWeight
 */
export async function getCachedWeightsForStatements(
  pollId: string,
  statementIds: string[]
): Promise<Map<string, StatementWeight>> {
  if (statementIds.length === 0) {
    return new Map();
  }

  const weights = await db
    .select()
    .from(statementWeights)
    .where(
      and(
        eq(statementWeights.pollId, pollId),
        inArray(statementWeights.statementId, statementIds)
      )
    );

  const weightMap = new Map<string, StatementWeight>();
  weights.forEach(w => weightMap.set(w.statementId, w));

  return weightMap;
}

/**
 * Upsert statement weights (insert or update)
 *
 * Uses conflict resolution on (statementId, pollId) unique constraint.
 * Updates all weight fields if record already exists.
 *
 * @param weights - Array of weights to insert/update
 */
export async function upsertStatementWeights(
  weights: NewStatementWeight[]
): Promise<void> {
  if (weights.length === 0) return;

  await db
    .insert(statementWeights)
    .values(weights)
    .onConflictDoUpdate({
      target: [statementWeights.statementId, statementWeights.pollId],
      set: {
        predictiveness: sql.raw(`EXCLUDED.predictiveness`),
        consensusPotential: sql.raw(`EXCLUDED.consensus_potential`),
        recencyBoost: sql.raw(`EXCLUDED.recency_boost`),
        passRatePenalty: sql.raw(`EXCLUDED.pass_rate_penalty`),
        voteCountBoost: sql.raw(`EXCLUDED.vote_count_boost`),
        combinedWeight: sql.raw(`EXCLUDED.combined_weight`),
        mode: sql.raw(`EXCLUDED.mode`),
        calculatedAt: sql.raw(`EXCLUDED.calculated_at`),
        agreeCount: sql.raw(`EXCLUDED.agree_count`),
        disagreeCount: sql.raw(`EXCLUDED.disagree_count`),
        passCount: sql.raw(`EXCLUDED.pass_count`),
      },
    });
}

/**
 * Invalidate (delete) all weights for a poll
 *
 * Called when:
 * - Clustering is recomputed (new group data available)
 * - New statement is approved (affects recency distribution)
 *
 * @param pollId - Poll ID to invalidate
 */
export async function invalidateStatementWeights(pollId: string): Promise<void> {
  await db.delete(statementWeights).where(eq(statementWeights.pollId, pollId));
}

/**
 * Get vote counts for all statements in a poll
 *
 * Aggregates votes by statement to calculate:
 * - Agree count (value = 1)
 * - Disagree count (value = -1)
 * - Pass count (value = 0)
 * - Total votes
 *
 * Returns map with zeros for statements that have no votes.
 *
 * @param pollId - Poll ID
 * @param statementIds - Array of statement IDs
 * @returns Map of statementId → {agree, disagree, pass, total}
 */
export async function getStatementVoteCounts(
  pollId: string,
  statementIds: string[]
): Promise<
  Map<string, { agree: number; disagree: number; pass: number; total: number }>
> {
  if (statementIds.length === 0) {
    return new Map();
  }

  const voteCounts = await db
    .select({
      statementId: votes.statementId,
      agree: sql<number>`COUNT(*) FILTER (WHERE ${votes.value} = 1)`,
      disagree: sql<number>`COUNT(*) FILTER (WHERE ${votes.value} = -1)`,
      pass: sql<number>`COUNT(*) FILTER (WHERE ${votes.value} = 0)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(inArray(votes.statementId, statementIds))
    .groupBy(votes.statementId);

  const countMap = new Map();
  voteCounts.forEach(vc => {
    countMap.set(vc.statementId, {
      agree: Number(vc.agree),
      disagree: Number(vc.disagree),
      pass: Number(vc.pass),
      total: Number(vc.total),
    });
  });

  // Fill in zeros for statements with no votes
  statementIds.forEach(sid => {
    if (!countMap.has(sid)) {
      countMap.set(sid, { agree: 0, disagree: 0, pass: 0, total: 0 });
    }
  });

  return countMap;
}
