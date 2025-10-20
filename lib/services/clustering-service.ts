/**
 * Clustering Service
 * Orchestrates the complete opinion clustering pipeline:
 * 1. Build opinion matrix from votes
 * 2. PCA dimensionality reduction
 * 3. K-means clustering
 * 4. Hierarchical coarse grouping
 * 5. Consensus detection
 * 6. Quality validation
 * 7. Database persistence
 */

import { db } from "@/db/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  votes,
  statements,
  users,
  pollClusteringMetadata,
  userClusteringPositions,
  statementClassifications,
} from "@/db/schema";
import { PCAEngine } from "@/lib/clustering/pca-engine";
import { KMeansEngine } from "@/lib/clustering/kmeans-engine";
import { ConsensusDetector } from "@/lib/clustering/consensus-detector";
import type {
  PollClusteringMetadata,
  UserClusteringPosition,
  StatementClassification,
} from "@/db/schema";

export interface ClusteringResult {
  pollId: string;
  metadata: {
    totalUsers: number;
    totalStatements: number;
    numFineClusters: number;
    numCoarseGroups: number;
    silhouetteScore: number;
    totalVarianceExplained: number;
  };
  userPositions: Array<{
    userId: string;
    pc1: number;
    pc2: number;
    fineClusterId: number;
    coarseGroupId: number;
  }>;
  statementClassifications: Array<{
    statementId: string;
    type: string;
    averageAgreement: number;
  }>;
}

export class ClusteringService {
  /** Minimum users required for clustering */
  private static readonly MIN_USERS = 20;
  /** Minimum statements required for clustering */
  private static readonly MIN_STATEMENTS = 6;
  /** Minimum variance explained by PCA (40%) */
  private static readonly MIN_VARIANCE_EXPLAINED = 0.4;
  /** Minimum silhouette score for acceptable clustering */
  private static readonly MIN_SILHOUETTE_SCORE = 0.25;

  /**
   * Compute complete opinion clustering for a poll
   *
   * @param pollId - Poll ID
   * @returns Clustering result with metadata, user positions, and statement classifications
   * @throws Error if insufficient data or quality too low
   */
  static async computeOpinionLandscape(
    pollId: string
  ): Promise<ClusteringResult> {
    // =========================================================================
    // STEP 1: Build Opinion Matrix
    // =========================================================================

    // Get all approved statements for this poll
    const pollStatements = await db
      .select()
      .from(statements)
      .where(and(eq(statements.pollId, pollId), eq(statements.approved, true)))
      .orderBy(statements.createdAt);

    if (pollStatements.length < this.MIN_STATEMENTS) {
      throw new Error(
        `Insufficient statements for clustering: ${pollStatements.length}. ` +
          `Minimum required: ${this.MIN_STATEMENTS}.`
      );
    }

    const statementIds = pollStatements.map((s) => s.id);

    // Get all votes for these statements (OPTIMIZED: single query)
    const allVotes = await db
      .select({
        userId: votes.userId,
        statementId: votes.statementId,
        value: votes.value,
      })
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    // Group votes by user
    const votesByUser = new Map<string, Map<string, number>>();

    for (const vote of allVotes) {
      if (!votesByUser.has(vote.userId)) {
        votesByUser.set(vote.userId, new Map());
      }
      votesByUser.get(vote.userId)!.set(vote.statementId, vote.value);
    }

    // Get unique user IDs who voted
    const userIds = Array.from(votesByUser.keys());

    if (userIds.length < this.MIN_USERS) {
      throw new Error(
        `Insufficient users for clustering: ${userIds.length}. ` +
          `Minimum required: ${this.MIN_USERS}.`
      );
    }

    // Build opinion matrix [users x statements]
    // null = pass vote (treat as missing data)
    const opinionMatrixData: (number | null)[][] = [];

    for (const userId of userIds) {
      const userVotes = votesByUser.get(userId)!;
      const row: (number | null)[] = [];

      for (const stmtId of statementIds) {
        const voteValue = userVotes.get(stmtId);
        // Convert pass (0) to null for PCA mean imputation
        row.push(voteValue === 0 ? null : voteValue ?? null);
      }

      opinionMatrixData.push(row);
    }

    // =========================================================================
    // STEP 2: PCA Dimensionality Reduction
    // =========================================================================

    const pcaResult = PCAEngine.computePCA({
      data: opinionMatrixData,
      userIds,
      statementIds,
    });

    // Validate PCA quality
    if (pcaResult.totalVarianceExplained < this.MIN_VARIANCE_EXPLAINED) {
      throw new Error(
        `PCA quality too low: ${(pcaResult.totalVarianceExplained * 100).toFixed(1)}% variance explained. ` +
          `Minimum required: ${this.MIN_VARIANCE_EXPLAINED * 100}%.`
      );
    }

    // =========================================================================
    // STEP 3: K-Means Fine-Grained Clustering
    // =========================================================================

    const kmeansResult = KMeansEngine.cluster(pcaResult.transformedData);

    // Validate clustering quality
    if (kmeansResult.silhouetteScore < this.MIN_SILHOUETTE_SCORE) {
      console.warn(
        `Low clustering quality: silhouette score ${kmeansResult.silhouetteScore.toFixed(3)}. ` +
          `Proceeding anyway, but results may be unreliable.`
      );
    }

    // =========================================================================
    // STEP 4: Hierarchical Coarse Grouping
    // =========================================================================

    const coarseGrouping = KMeansEngine.createCoarseGroups(
      kmeansResult.centroids
    );

    // Build coarse group metadata
    const coarseGroups = Array.from({ length: coarseGrouping.coarseK }).map(
      (_, groupId) => {
        // Find all fine clusters in this coarse group
        const fineClusterIds: number[] = [];
        coarseGrouping.fineToCoarseMapping.forEach((coarseId, fineId) => {
          if (coarseId === groupId) {
            fineClusterIds.push(fineId);
          }
        });

        // Count users in this group
        const userCount = kmeansResult.clusters.filter((fineId) =>
          fineClusterIds.includes(fineId)
        ).length;

        return {
          id: groupId,
          label: `קבוצת דעות ${groupId + 1}`, // Hebrew: "Opinion Group N"
          centroid: coarseGrouping.coarseCentroids[groupId],
          fineClusterIds,
          userCount,
        };
      }
    );

    // =========================================================================
    // STEP 5: Consensus Detection
    // =========================================================================

    // Build user -> coarse group mapping
    const userGroupAssignments = new Map<string, number>();
    userIds.forEach((userId, idx) => {
      const fineCluster = kmeansResult.clusters[idx];
      const coarseGroup = coarseGrouping.fineToCoarseMapping.get(fineCluster)!;
      userGroupAssignments.set(userId, coarseGroup);
    });

    // Build vote data structure for consensus detector
    const voteDataForConsensus = userIds.map((userId) => {
      const userVotes = votesByUser.get(userId)!;
      return {
        userId,
        votes: statementIds.map((stmtId) => {
          const vote = userVotes.get(stmtId);
          // Convert pass (0) to 0, null to 0 for consensus calculation
          return vote ?? 0;
        }),
      };
    });

    const statementClassificationsResult =
      ConsensusDetector.classifyAllStatements(
        voteDataForConsensus,
        userGroupAssignments,
        statementIds
      );

    // =========================================================================
    // STEP 6: Persist to Database (within transaction)
    // =========================================================================

    await db.transaction(async (tx) => {
      // 6.1: Delete existing clustering data for this poll
      await tx
        .delete(pollClusteringMetadata)
        .where(eq(pollClusteringMetadata.pollId, pollId));

      await tx
        .delete(userClusteringPositions)
        .where(eq(userClusteringPositions.pollId, pollId));

      await tx
        .delete(statementClassifications)
        .where(eq(statementClassifications.pollId, pollId));

      // 6.2: Insert poll clustering metadata
      await tx.insert(pollClusteringMetadata).values({
        pollId,
        pcaComponents: pcaResult.components,
        varianceExplained: pcaResult.varianceExplained,
        meanVector: pcaResult.meanVector,
        clusterCentroids: kmeansResult.centroids,
        numFineClusters: kmeansResult.numClusters,
        coarseGroups,
        silhouetteScore: kmeansResult.silhouetteScore,
        totalVarianceExplained: pcaResult.totalVarianceExplained,
        totalUsers: userIds.length,
        totalStatements: statementIds.length,
        computedAt: new Date(),
        version: 1,
      });

      // 6.3: Insert user clustering positions
      const userPositionRecords = userIds.map((userId, idx) => {
        const [pc1, pc2] = pcaResult.transformedData[idx];
        const fineClusterId = kmeansResult.clusters[idx];
        const coarseGroupId =
          coarseGrouping.fineToCoarseMapping.get(fineClusterId)!;

        // Calculate vote statistics
        const userVotes = votesByUser.get(userId)!;
        const voteValues = Array.from(userVotes.values());
        const agreeCount = voteValues.filter((v) => v === 1).length;
        const disagreeCount = voteValues.filter((v) => v === -1).length;
        const passCount = voteValues.filter((v) => v === 0).length;

        return {
          pollId,
          userId,
          pc1,
          pc2,
          fineClusterId,
          coarseGroupId,
          totalVotes: voteValues.length,
          agreeCount,
          disagreeCount,
          passCount,
          computedAt: new Date(),
        };
      });

      await tx.insert(userClusteringPositions).values(userPositionRecords);

      // 6.4: Insert statement classifications
      const statementClassificationRecords =
        statementClassificationsResult.map((classification) => ({
          pollId,
          statementId: classification.statementId,
          classificationType: classification.type,
          groupAgreements: classification.groupAgreements,
          averageAgreement: classification.averageAgreement,
          standardDeviation: classification.standardDeviation,
          bridgeScore: classification.bridgeScore ?? null,
          connectsGroups: classification.connectsGroups ?? null,
          computedAt: new Date(),
        }));

      if (statementClassificationRecords.length > 0) {
        await tx
          .insert(statementClassifications)
          .values(statementClassificationRecords);
      }
    });

    // =========================================================================
    // STEP 7: Return Result
    // =========================================================================

    return {
      pollId,
      metadata: {
        totalUsers: userIds.length,
        totalStatements: statementIds.length,
        numFineClusters: kmeansResult.numClusters,
        numCoarseGroups: coarseGrouping.coarseK,
        silhouetteScore: kmeansResult.silhouetteScore,
        totalVarianceExplained: pcaResult.totalVarianceExplained,
      },
      userPositions: userIds.map((userId, idx) => ({
        userId,
        pc1: pcaResult.transformedData[idx][0],
        pc2: pcaResult.transformedData[idx][1],
        fineClusterId: kmeansResult.clusters[idx],
        coarseGroupId: coarseGrouping.fineToCoarseMapping.get(
          kmeansResult.clusters[idx]
        )!,
      })),
      statementClassifications: statementClassificationsResult.map((c) => ({
        statementId: c.statementId,
        type: c.type,
        averageAgreement: c.averageAgreement,
      })),
    };
  }

  /**
   * Get existing clustering data for a poll (from database)
   *
   * @param pollId - Poll ID
   * @returns Clustering data or null if not computed yet
   */
  static async getClusteringData(
    pollId: string
  ): Promise<ClusteringResult | null> {
    // Get metadata
    const metadata = await db
      .select()
      .from(pollClusteringMetadata)
      .where(eq(pollClusteringMetadata.pollId, pollId))
      .limit(1);

    if (metadata.length === 0) {
      return null;
    }

    // Get user positions
    const positions = await db
      .select()
      .from(userClusteringPositions)
      .where(eq(userClusteringPositions.pollId, pollId));

    // Get statement classifications
    const classifications = await db
      .select()
      .from(statementClassifications)
      .where(eq(statementClassifications.pollId, pollId));

    const meta = metadata[0];

    return {
      pollId,
      metadata: {
        totalUsers: meta.totalUsers,
        totalStatements: meta.totalStatements,
        numFineClusters: meta.numFineClusters,
        numCoarseGroups: meta.coarseGroups.length,
        silhouetteScore: meta.silhouetteScore,
        totalVarianceExplained: meta.totalVarianceExplained,
      },
      userPositions: positions.map((p) => ({
        userId: p.userId,
        pc1: p.pc1,
        pc2: p.pc2,
        fineClusterId: p.fineClusterId,
        coarseGroupId: p.coarseGroupId,
      })),
      statementClassifications: classifications.map((c) => ({
        statementId: c.statementId,
        type: c.classificationType,
        averageAgreement: c.averageAgreement,
      })),
    };
  }

  /**
   * Check if poll has sufficient data for clustering
   *
   * @param pollId - Poll ID
   * @returns Object with eligibility status and reason
   */
  static async isEligibleForClustering(pollId: string): Promise<{
    eligible: boolean;
    reason?: string;
    userCount?: number;
    statementCount?: number;
  }> {
    // Count approved statements
    const stmtCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(statements)
      .where(and(eq(statements.pollId, pollId), eq(statements.approved, true)));

    const statementCount = Number(stmtCount[0]?.count ?? 0);

    if (statementCount < this.MIN_STATEMENTS) {
      return {
        eligible: false,
        reason: `Insufficient statements: ${statementCount}/${this.MIN_STATEMENTS}`,
        statementCount,
      };
    }

    // Get statement IDs
    const stmts = await db
      .select({ id: statements.id })
      .from(statements)
      .where(and(eq(statements.pollId, pollId), eq(statements.approved, true)));

    const statementIds = stmts.map((s) => s.id);

    // Count unique users who voted
    const userCount = await db
      .selectDistinct({ userId: votes.userId })
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    const uniqueUserCount = userCount.length;

    if (uniqueUserCount < this.MIN_USERS) {
      return {
        eligible: false,
        reason: `Insufficient users: ${uniqueUserCount}/${this.MIN_USERS}`,
        userCount: uniqueUserCount,
        statementCount,
      };
    }

    return {
      eligible: true,
      userCount: uniqueUserCount,
      statementCount,
    };
  }

  /**
   * Trigger background clustering computation (non-blocking)
   * Should be called after votes are cast
   *
   * @param pollId - Poll ID
   */
  static async triggerBackgroundClustering(pollId: string): Promise<void> {
    // Check eligibility first (fast query)
    const eligibility = await this.isEligibleForClustering(pollId);

    if (!eligibility.eligible) {
      // Not enough data yet, skip silently
      return;
    }

    // Trigger async computation (don't await - run in background)
    this.computeOpinionLandscape(pollId).catch((error) => {
      console.error(`Background clustering failed for poll ${pollId}:`, error);
      // Don't throw - this is background processing
    });
  }
}
