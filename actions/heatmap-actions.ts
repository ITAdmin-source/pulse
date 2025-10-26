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

  console.log(`[${requestId}] [getAllHeatmapDataAction] ========== START ==========`, {
    pollId,
    privacyThreshold,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  });

  // Timeout warning mechanism
  const timeoutWarnings = [30000, 60000, 120000]; // 30s, 60s, 120s
  const warningTimers = timeoutWarnings.map((timeout) =>
    setTimeout(() => {
      console.warn(`[${requestId}] ⚠️ TIMEOUT WARNING: Request still running after ${timeout/1000}s`);
    }, timeout)
  );

  try {
    // PHASE 1: Validate poll
    console.log(`[${requestId}] [PHASE 1] Validating poll...`);
    const pollValidationStart = Date.now();

    const pollResult = await getPollByIdAction(pollId);

    const pollValidationDuration = Date.now() - pollValidationStart;
    console.log(`[${requestId}] [PHASE 1] COMPLETE - Poll validation: ${pollValidationDuration}ms`);

    if (!pollResult.success || !pollResult.data) {
      console.log(`[${requestId}] Poll not found`);
      warningTimers.forEach(clearTimeout);
      return { success: false, error: "Poll not found" };
    }

    const poll = pollResult.data;

    if (poll.status !== "published" && poll.status !== "closed") {
      console.log(`[${requestId}] Poll not available (status: ${poll.status})`);
      warningTimers.forEach(clearTimeout);
      return { success: false, error: "Poll is not available for viewing" };
    }

    // PHASE 2: Fetch all heatmap categories
    console.log(`[${requestId}] [PHASE 2] Fetching heatmap data for all 4 categories in parallel...`);
    const heatmapStart = Date.now();

    // Track individual category timing
    const categoryTimings: Record<string, number> = {};

    const [gender, ageGroup, ethnicity, politicalParty] = await Promise.all([
      (async () => {
        const catStart = Date.now();
        console.log(`[${requestId}] [PHASE 2.1] Starting gender heatmap...`);
        const result = await PollResultsService.getHeatmapData(pollId, "gender", privacyThreshold);
        categoryTimings.gender = Date.now() - catStart;
        console.log(`[${requestId}] [PHASE 2.1] COMPLETE - Gender: ${categoryTimings.gender}ms`);
        return result;
      })(),
      (async () => {
        const catStart = Date.now();
        console.log(`[${requestId}] [PHASE 2.2] Starting ageGroup heatmap...`);
        const result = await PollResultsService.getHeatmapData(pollId, "ageGroup", privacyThreshold);
        categoryTimings.ageGroup = Date.now() - catStart;
        console.log(`[${requestId}] [PHASE 2.2] COMPLETE - AgeGroup: ${categoryTimings.ageGroup}ms`);
        return result;
      })(),
      (async () => {
        const catStart = Date.now();
        console.log(`[${requestId}] [PHASE 2.3] Starting ethnicity heatmap...`);
        const result = await PollResultsService.getHeatmapData(pollId, "ethnicity", privacyThreshold);
        categoryTimings.ethnicity = Date.now() - catStart;
        console.log(`[${requestId}] [PHASE 2.3] COMPLETE - Ethnicity: ${categoryTimings.ethnicity}ms`);
        return result;
      })(),
      (async () => {
        const catStart = Date.now();
        console.log(`[${requestId}] [PHASE 2.4] Starting politicalParty heatmap...`);
        const result = await PollResultsService.getHeatmapData(pollId, "politicalParty", privacyThreshold);
        categoryTimings.politicalParty = Date.now() - catStart;
        console.log(`[${requestId}] [PHASE 2.4] COMPLETE - PoliticalParty: ${categoryTimings.politicalParty}ms`);
        return result;
      })(),
    ]);

    const heatmapDuration = Date.now() - heatmapStart;
    const totalDuration = Date.now() - startTime;

    console.log(`[${requestId}] [getAllHeatmapDataAction] ========== SUCCESS ==========`, {
      pollId,
      phase1Duration: pollValidationDuration,
      phase2Duration: heatmapDuration,
      categoryTimings,
      totalDuration,
      dataSizes: {
        gender: gender.length,
        ageGroup: ageGroup.length,
        ethnicity: ethnicity.length,
        politicalParty: politicalParty.length,
      },
    });

    warningTimers.forEach(clearTimeout);

    return {
      success: true,
      data: { gender, ageGroup, ethnicity, politicalParty },
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error(`[${requestId}] [getAllHeatmapDataAction] ========== ERROR ==========`, {
      pollId,
      totalDuration,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });

    warningTimers.forEach(clearTimeout);

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
