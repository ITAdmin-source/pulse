"use server";

import { PollResultsService } from "@/lib/services/poll-results-service";
import type { DemographicAttribute, HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";

/**
 * Get heatmap data for a poll by demographic attribute
 * Public access - no authorization required
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
