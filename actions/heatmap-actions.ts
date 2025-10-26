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
  try {
    // Validate poll
    const pollResult = await getPollByIdAction(pollId);
    if (!pollResult.success || !pollResult.data) {
      return { success: false, error: "Poll not found" };
    }

    const poll = pollResult.data;

    if (poll.status !== "published" && poll.status !== "closed") {
      return { success: false, error: "Poll is not available for viewing" };
    }

    // Fetch all heatmap categories in parallel
    const [gender, ageGroup, ethnicity, politicalParty] = await Promise.all([
      PollResultsService.getHeatmapData(pollId, "gender", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "ageGroup", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "ethnicity", privacyThreshold),
      PollResultsService.getHeatmapData(pollId, "politicalParty", privacyThreshold),
    ]);

    return {
      success: true,
      data: { gender, ageGroup, ethnicity, politicalParty },
    };
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
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
