"use server";

import { PollResultsService } from "@/lib/services/poll-results-service";
import { getPollByIdAction } from "@/actions/polls-actions";
import type { DemographicAttribute, HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";

/**
 * Get heatmap data for a poll by demographic attribute
 * PUBLIC ACCESS - Validates poll status (published/closed only)
 * Prevents data leakage from draft polls
 */
export async function getHeatmapDataAction(
  pollId: string,
  attribute: DemographicAttribute,
  privacyThreshold: number = 3
): Promise<{
  success: boolean;
  data?: HeatmapStatementData[];
  error?: string;
}> {
  try {
    // Validate poll exists and is published/closed
    const pollResult = await getPollByIdAction(pollId);
    if (!pollResult.success || !pollResult.data) {
      return {
        success: false,
        error: "Poll not found",
      };
    }

    const poll = pollResult.data;

    // Only allow access to published or closed polls
    if (poll.status !== "published" && poll.status !== "closed") {
      return {
        success: false,
        error: "Poll is not available for viewing",
      };
    }

    const data = await PollResultsService.getHeatmapData(pollId, attribute, privacyThreshold);
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return {
      success: false,
      error: "Failed to fetch heatmap data",
    };
  }
}

/**
 * Get ALL heatmap data for a poll (all demographic categories)
 * OPTIMIZED: Single action call instead of 4 separate calls
 * PUBLIC ACCESS - Validates poll status (published/closed only)
 * Prevents data leakage from draft polls
 */
export async function getAllHeatmapDataAction(
  pollId: string,
  privacyThreshold: number = 3
): Promise<{
  success: boolean;
  data?: {
    gender: HeatmapStatementData[];
    ageGroup: HeatmapStatementData[];
    ethnicity: HeatmapStatementData[];
    politicalParty: HeatmapStatementData[];
  };
  error?: string;
}> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] [getAllHeatmapDataAction] START`, {
    pollId,
    privacyThreshold,
    timestamp: new Date().toISOString(),
  });

  try {
    // Validate poll
    console.log(`[${requestId}] Validating poll...`);
    const pollValidationStart = Date.now();

    const pollResult = await getPollByIdAction(pollId);

    console.log(`[${requestId}] Poll validation took ${Date.now() - pollValidationStart}ms`);

    if (!pollResult.success || !pollResult.data) {
      console.log(`[${requestId}] Poll not found`);
      return { success: false, error: "Poll not found" };
    }

    const poll = pollResult.data;

    if (poll.status !== "published" && poll.status !== "closed") {
      console.log(`[${requestId}] Poll not available (status: ${poll.status})`);
      return { success: false, error: "Poll is not available for viewing" };
    }

    // Fetch all heatmap categories
    console.log(`[${requestId}] Fetching heatmap data for all categories...`);
    const heatmapStart = Date.now();

    const [gender, ageGroup, ethnicity, politicalParty] = await Promise.all([
      PollResultsService.getHeatmapData(pollId, "gender", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "ageGroup", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "ethnicity", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "politicalParty", privacyThreshold),
    ]);

    const heatmapDuration = Date.now() - heatmapStart;
    const totalDuration = Date.now() - startTime;

    console.log(`[${requestId}] [getAllHeatmapDataAction] SUCCESS`, {
      pollId,
      heatmapDuration,
      totalDuration,
      dataSizes: {
        gender: gender.length,
        ageGroup: ageGroup.length,
        ethnicity: ethnicity.length,
        politicalParty: politicalParty.length,
      },
    });

    return {
      success: true,
      data: { gender, ageGroup, ethnicity, politicalParty },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error(`[${requestId}] [getAllHeatmapDataAction] ERROR`, {
      pollId,
      totalDuration,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });

    return { success: false, error: "Failed to fetch heatmap data" };
  }
}

/**
 * Invalidate heatmap cache for a poll
 * Useful after new votes are cast
 */
export async function invalidateHeatmapCacheAction(pollId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    PollResultsService.invalidateHeatmapCache(pollId);
    return { success: true };
  } catch (error) {
    console.error("Error invalidating heatmap cache:", error);
    return {
      success: false,
      error: "Failed to invalidate cache",
    };
  }
}
