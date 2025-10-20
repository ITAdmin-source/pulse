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
 * Get complete clustering data with all details
 * For the opinion map page
 *
 * @param pollId - Poll ID
 * @returns Complete clustering data
 */
export async function getCompleteClusteringDataAction(pollId: string) {
  try {
    const data = await getCompleteClusteringData(pollId);

    if (!data || !data.metadata) {
      return {
        success: false,
        error: "No clustering data available for this poll",
      };
    }

    return {
      success: true,
      data: {
        metadata: data.metadata,
        userPositions: data.userPositions,
        statementClassifications: data.statementClassifications,
        coarseGroups: data.metadata.coarseGroups,
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
