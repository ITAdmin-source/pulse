"use server";

/**
 * Clustering Actions
 * Server actions for opinion clustering functionality
 */

import { ClusteringService } from "@/lib/services/clustering-service";
import {
  getCompleteClusteringData,
  getUserClusteringPosition,
} from "@/db/queries/clustering-queries";
import {
  getCachedClusteringData,
  invalidateAllCaches,
} from "@/lib/caching/clustering-cache";
import { revalidatePath } from "next/cache";

/**
 * Get clustering data for a poll with caching
 *
 * @param pollId - Poll ID
 * @returns Clustering data or null if not computed yet
 */
export async function getClusteringDataAction(pollId: string) {
  try {
    // Use multi-tier cache
    const data = await getCachedClusteringData(pollId, async () => {
      return await ClusteringService.getClusteringData(pollId);
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[getClusteringDataAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get clustering data",
    };
  }
}

/**
 * Compute clustering for a poll
 * This is a heavy operation, should only be called when needed
 *
 * @param pollId - Poll ID
 * @returns Success status with metadata
 */
export async function computeClusteringAction(pollId: string) {
  try {
    // Check eligibility first
    const eligibility = await ClusteringService.isEligibleForClustering(pollId);

    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason ?? "Poll is not eligible for clustering",
        eligibility,
      };
    }

    // Compute clustering
    const result = await ClusteringService.computeOpinionLandscape(pollId);

    // Invalidate caches
    invalidateAllCaches(pollId);

    // Revalidate opinion map page
    revalidatePath(`/polls/${pollId}/opinionmap`);

    return {
      success: true,
      data: result.metadata,
    };
  } catch (error) {
    console.error("[computeClusteringAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to compute clustering",
    };
  }
}

/**
 * Check if a poll is eligible for clustering
 *
 * @param pollId - Poll ID
 * @returns Eligibility status
 */
export async function checkClusteringEligibilityAction(pollId: string) {
  try {
    const eligibility = await ClusteringService.isEligibleForClustering(pollId);

    return {
      success: true,
      data: eligibility,
    };
  } catch (error) {
    console.error("[checkClusteringEligibilityAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check eligibility",
    };
  }
}

/**
 * Get current user's position in the opinion map
 *
 * @param pollId - Poll ID
 * @param userId - User ID
 * @returns User's clustering position or null
 */
export async function getUserPositionAction(pollId: string, userId: string) {
  try {
    const position = await getUserClusteringPosition(pollId, userId);

    return {
      success: true,
      data: position,
    };
  } catch (error) {
    console.error("[getUserPositionAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user position",
    };
  }
}

/**
 * Trigger background clustering computation
 * Non-blocking, returns immediately
 *
 * @param pollId - Poll ID
 */
export async function triggerBackgroundClusteringAction(pollId: string) {
  try {
    // This is non-blocking - fires and forgets
    await ClusteringService.triggerBackgroundClustering(pollId);

    return {
      success: true,
      message: "Background clustering triggered",
    };
  } catch (error) {
    console.error("[triggerBackgroundClusteringAction] Error:", error);
    // Don't fail - background process
    return {
      success: true,
      message: "Background clustering trigger failed (non-critical)",
    };
  }
}

/**
 * Manual trigger for clustering computation (admin/manager only)
 * Bypasses debouncing and idempotency - forces immediate computation
 *
 * @param pollId - Poll ID
 * @returns Success status with detailed metrics
 */
export async function manualTriggerClusteringAction(pollId: string) {
  try {
    console.log(`[manualTriggerClusteringAction] Manual trigger initiated for poll ${pollId}`);

    // Check eligibility first
    const eligibility = await ClusteringService.isEligibleForClustering(pollId);

    if (!eligibility.eligible) {
      console.log(
        `[manualTriggerClusteringAction] Poll ${pollId} not eligible:`,
        eligibility.reason
      );
      return {
        success: false,
        error: eligibility.reason ?? "Poll is not eligible for clustering",
        eligibility,
      };
    }

    // Force computation (awaited for manual trigger)
    const startTime = Date.now();
    const result = await ClusteringService.computeOpinionLandscape(pollId);
    const duration = Date.now() - startTime;

    console.log(
      `[manualTriggerClusteringAction] Manual trigger completed for poll ${pollId} in ${duration}ms`
    );

    // Invalidate caches
    invalidateAllCaches(pollId);

    // Revalidate opinion map page
    revalidatePath(`/polls/${pollId}/opinionmap`);

    return {
      success: true,
      data: {
        ...result.metadata,
        duration,
        triggeredAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("[manualTriggerClusteringAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to compute clustering",
    };
  }
}

/**
 * Get complete clustering data with all details
 * For the opinion map page
 *
 * @param pollId - Poll ID
 * @param options - Optional parameters
 * @param options.includeGroupAgreements - Include statement group agreement matrix for heatmap
 * @param options.includeCoalitionAnalysis - Include coalition analysis data
 * @returns Complete clustering data
 */
export async function getCompleteClusteringDataAction(
  pollId: string,
  options?: {
    includeGroupAgreements?: boolean;
    includeCoalitionAnalysis?: boolean;
  }
) {
  try {
    const data = await getCompleteClusteringData(pollId);

    if (!data || !data.metadata) {
      return {
        success: false,
        error: "No clustering data available for this poll",
      };
    }

    const meta = data.metadata;

    // Calculate consensus level (same logic as in ClusteringService)
    const consensusStatements = data.statementClassifications.filter(
      (c) =>
        c.classificationType === "positive_consensus" ||
        c.classificationType === "negative_consensus"
    );
    const consensusRatio =
      data.statementClassifications.length > 0
        ? consensusStatements.length / data.statementClassifications.length
        : 0;

    const consensusLevel: "high" | "medium" | "low" =
      consensusRatio >= 0.5 ? "high" : consensusRatio >= 0.3 ? "medium" : "low";

    // Calculate quality tier (same logic as in ClusteringService)
    let qualityTier: "high" | "medium" | "low";
    if (meta.totalVarianceExplained >= 0.6 && meta.silhouetteScore >= 0.4) {
      qualityTier = "high";
    } else if (
      meta.totalVarianceExplained >= 0.4 &&
      meta.silhouetteScore >= 0.25
    ) {
      qualityTier = "medium";
    } else {
      qualityTier = "low";
    }

    // Optionally fetch group agreement matrix
    let groupAgreementMatrix;
    if (options?.includeGroupAgreements) {
      groupAgreementMatrix = await ClusteringService.getGroupAgreementMatrix(pollId);
    }

    // Optionally calculate coalition analysis
    let coalitionAnalysis;
    if (options?.includeCoalitionAnalysis && groupAgreementMatrix) {
      const { CoalitionAnalyzer } = await import("@/lib/clustering/coalition-analyzer");
      const coarseGroups = meta.coarseGroups as any[];

      // Transform to format expected by CoalitionAnalyzer
      const statements = groupAgreementMatrix.map((stmt) => ({
        statementId: stmt.statementId,
        groupAgreements: stmt.groupAgreements.reduce(
          (acc, g) => {
            acc[g.groupId] = g.agreementPercentage;
            return acc;
          },
          {} as Record<number, number>
        ),
      }));

      coalitionAnalysis = CoalitionAnalyzer.analyzeCoalitions(
        statements,
        coarseGroups.length,
        coarseGroups.map((g: any) => g.label)
      );
    }

    return {
      success: true,
      data: {
        metadata: {
          totalUsers: meta.totalUsers,
          totalStatements: meta.totalStatements,
          numFineClusters: meta.numFineClusters,
          numCoarseGroups: (meta.coarseGroups as any[])?.length || 0,
          silhouetteScore: meta.silhouetteScore,
          totalVarianceExplained: meta.totalVarianceExplained,
          qualityTier,
          consensusLevel,
        },
        userPositions: data.userPositions,
        statementClassifications: data.statementClassifications,
        coarseGroups: meta.coarseGroups,
        groupAgreementMatrix,
        coalitionAnalysis,
      },
    };
  } catch (error) {
    console.error("[getCompleteClusteringDataAction] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get clustering data",
    };
  }
}
