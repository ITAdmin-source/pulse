/**
 * Statement Weighting Service
 *
 * Calculates and caches statement weights for weighted ordering.
 *
 * Two Operating Modes:
 * 1. Clustering Mode (20+ users): Uses predictiveness, consensus, recency, pass rate
 * 2. Cold Start Mode (<20 users): Uses vote count, recency, pass rate
 *
 * Caching Strategy:
 * - Weights cached in statement_weights table
 * - Invalidated when clustering recomputes or new statement approved
 * - No time-based TTL (event-driven invalidation only)
 */

import { db } from "@/db/db";
import { eq, and, inArray } from "drizzle-orm";
import { statements, statementClassifications } from "@/db/schema";
import {
  getCachedWeightsForStatements,
  upsertStatementWeights,
  invalidateStatementWeights as invalidateWeightsQuery,
  getStatementVoteCounts,
} from "@/db/queries/statement-weight-queries";
import { ClusteringService } from "./clustering-service";
import {
  calculateClusteringWeight,
  calculateColdStartWeight,
  type WeightComponents,
} from "@/lib/utils/statement-weights";

export interface StatementWithWeight {
  statementId: string;
  weight: number;
  components: WeightComponents;
}

export class StatementWeightingService {
  /**
   * Get or calculate weights for statements in a poll
   *
   * Uses cached weights if available, otherwise calculates fresh.
   * Automatically determines mode (clustering vs cold start) based on eligibility.
   *
   * @param pollId - Poll ID
   * @param statementIds - Statement IDs to weight (typically unvoted statements)
   * @returns Array of statements with weights
   */
  static async getStatementWeights(
    pollId: string,
    statementIds: string[]
  ): Promise<StatementWithWeight[]> {
    if (statementIds.length === 0) return [];

    // Check for cached weights
    const cachedWeights = await getCachedWeightsForStatements(
      pollId,
      statementIds
    );

    const uncachedIds = statementIds.filter(sid => !cachedWeights.has(sid));

    // Calculate weights for uncached statements
    if (uncachedIds.length > 0) {
      const newWeights = await this.calculateWeights(pollId, uncachedIds);

      // Get vote counts for caching metadata
      const voteCounts = await getStatementVoteCounts(pollId, uncachedIds);

      // Cache the new weights
      if (newWeights.length > 0) {
        const weightsToCache = newWeights.map(w => {
          const votes = voteCounts.get(w.statementId) || {
            agree: 0,
            disagree: 0,
            pass: 0,
            total: 0,
          };

          return {
            pollId,
            statementId: w.statementId,
            predictiveness: w.components.predictiveness,
            consensusPotential: w.components.consensusPotential,
            recencyBoost: w.components.recencyBoost,
            passRatePenalty: w.components.passRatePenalty,
            voteCountBoost: w.components.voteCountBoost ?? null,
            combinedWeight: w.weight,
            mode: w.components.mode,
            agreeCount: votes.agree,
            disagreeCount: votes.disagree,
            passCount: votes.pass,
          };
        });

        await upsertStatementWeights(weightsToCache);
      }

      // Add new weights to cache map
      newWeights.forEach(w => {
        const votes = voteCounts.get(w.statementId) || {
          agree: 0,
          disagree: 0,
          pass: 0,
          total: 0,
        };

        cachedWeights.set(w.statementId, {
          id: "", // Not needed
          pollId,
          statementId: w.statementId,
          predictiveness: w.components.predictiveness,
          consensusPotential: w.components.consensusPotential,
          recencyBoost: w.components.recencyBoost,
          passRatePenalty: w.components.passRatePenalty,
          voteCountBoost: w.components.voteCountBoost ?? null,
          combinedWeight: w.weight,
          mode: w.components.mode,
          calculatedAt: new Date(),
          agreeCount: votes.agree,
          disagreeCount: votes.disagree,
          passCount: votes.pass,
        });
      });
    }

    // Convert cached weights to return format
    return statementIds.map(sid => {
      const cached = cachedWeights.get(sid)!;
      return {
        statementId: sid,
        weight: cached.combinedWeight,
        components: {
          predictiveness: cached.predictiveness,
          consensusPotential: cached.consensusPotential,
          recencyBoost: cached.recencyBoost,
          passRatePenalty: cached.passRatePenalty,
          voteCountBoost: cached.voteCountBoost ?? undefined,
          combinedWeight: cached.combinedWeight,
          mode: cached.mode as "cold_start" | "clustering",
        },
      };
    });
  }

  /**
   * Calculate weights for statements (not cached)
   *
   * Determines mode (clustering vs cold start) and calculates accordingly.
   * Clustering mode requires 20+ users with clustering data available.
   *
   * @param pollId - Poll ID
   * @param statementIds - Statement IDs to calculate weights for
   * @returns Array of statements with calculated weights
   */
  private static async calculateWeights(
    pollId: string,
    statementIds: string[]
  ): Promise<StatementWithWeight[]> {
    // Check if clustering is available
    const eligibility = await ClusteringService.isEligibleForClustering(pollId);
    const useClusteringMode = eligibility.eligible;

    if (useClusteringMode) {
      return await this.calculateClusteringWeights(pollId, statementIds);
    } else {
      return await this.calculateColdStartWeights(pollId, statementIds);
    }
  }

  /**
   * Calculate weights using clustering data
   *
   * Uses 4 factors:
   * - Predictiveness: Variance of group agreements
   * - Consensus Potential: Based on classification type
   * - Recency Boost: Time-based priority
   * - Pass Rate Penalty: Downweight confusing statements
   *
   * Requires clustering to have been computed (20+ users).
   *
   * @param pollId - Poll ID
   * @param statementIds - Statement IDs
   * @returns Array of statements with clustering-based weights
   */
  private static async calculateClusteringWeights(
    pollId: string,
    statementIds: string[]
  ): Promise<StatementWithWeight[]> {
    // PHASE 2 OPTIMIZATION: Parallelize all data fetches
    const [stmts, classifications, voteCounts] = await Promise.all([
      // Get statement data
      db.select()
        .from(statements)
        .where(
          and(
            eq(statements.pollId, pollId),
            inArray(statements.id, statementIds)
          )
        ),
      // Get classifications
      db.select()
        .from(statementClassifications)
        .where(
          and(
            eq(statementClassifications.pollId, pollId),
            inArray(statementClassifications.statementId, statementIds)
          )
        ),
      // Get vote counts
      getStatementVoteCounts(pollId, statementIds)
    ]);

    const classMap = new Map(classifications.map(c => [c.statementId, c]));

    // Calculate weights
    const weights: StatementWithWeight[] = [];

    for (const stmt of stmts) {
      const classification = classMap.get(stmt.id);

      if (!classification) {
        // Statement not yet classified (shouldn't happen, but fallback to cold start for this statement)
        console.warn(
          `[StatementWeightingService] No classification for statement ${stmt.id}, using default weights`
        );

        // Use neutral weights as fallback
        weights.push({
          statementId: stmt.id,
          weight: 0.5, // Neutral weight
          components: {
            predictiveness: 0.5,
            consensusPotential: 0.5,
            recencyBoost: calculateRecencyBoost(stmt.createdAt!),
            passRatePenalty: 0.5,
            combinedWeight: 0.5,
            mode: "clustering",
          },
        });
        continue;
      }

      const groupAgreements = Object.values(
        classification.groupAgreements as Record<number, number>
      );
      const votes = voteCounts.get(stmt.id)!;

      const components = calculateClusteringWeight(
        groupAgreements,
        classification.classificationType,
        stmt.createdAt!,
        {
          agree: votes.agree,
          disagree: votes.disagree,
          pass: votes.pass,
        }
      );

      weights.push({
        statementId: stmt.id,
        weight: components.combinedWeight,
        components,
      });
    }

    return weights;
  }

  /**
   * Calculate weights using cold start heuristics
   *
   * Uses 3 factors:
   * - Vote Count Boost: Prioritize less-voted statements
   * - Recency Boost: Time-based priority
   * - Pass Rate Penalty: Downweight confusing statements
   *
   * Used when clustering is not available (<20 users).
   *
   * @param pollId - Poll ID
   * @param statementIds - Statement IDs
   * @returns Array of statements with cold-start weights
   */
  private static async calculateColdStartWeights(
    pollId: string,
    statementIds: string[]
  ): Promise<StatementWithWeight[]> {
    // PHASE 2 OPTIMIZATION: Parallelize statement data and vote counts fetch
    const [stmts, voteCounts] = await Promise.all([
      // Get statement data
      db.select()
        .from(statements)
        .where(
          and(
            eq(statements.pollId, pollId),
            inArray(statements.id, statementIds)
          )
        ),
      // Get vote counts
      getStatementVoteCounts(pollId, statementIds)
    ]);

    // Calculate average votes
    const totalVotes = Array.from(voteCounts.values()).reduce(
      (sum, v) => sum + v.total,
      0
    );
    const avgVotes = statementIds.length > 0 ? totalVotes / statementIds.length : 0;

    // Calculate weights
    const weights: StatementWithWeight[] = [];

    for (const stmt of stmts) {
      const votes = voteCounts.get(stmt.id)!;

      const components = calculateColdStartWeight(
        stmt.createdAt!,
        {
          agree: votes.agree,
          disagree: votes.disagree,
          pass: votes.pass,
        },
        votes.total,
        avgVotes
      );

      weights.push({
        statementId: stmt.id,
        weight: components.combinedWeight,
        components,
      });
    }

    return weights;
  }

  /**
   * Invalidate cached weights for a poll
   *
   * Call this when:
   * - Clustering is recomputed (new group data available)
   * - New statement is approved (affects recency distribution)
   *
   * @param pollId - Poll ID to invalidate
   */
  static async invalidateWeights(pollId: string): Promise<void> {
    await invalidateWeightsQuery(pollId);
  }
}

// Import for recency calculation helper (used in fallback)
import { calculateRecencyBoost } from "@/lib/utils/statement-weights";
