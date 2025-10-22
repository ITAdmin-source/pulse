"use server";

import { revalidatePath } from "next/cache";
import { PollResultsService } from "@/lib/services/poll-results-service";

export async function getPollResultsAction(pollId: string) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] [getPollResultsAction] START`, {
    pollId,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });

  try {
    console.log(`[${requestId}] Calling PollResultsService.getPollResults...`);
    const serviceStartTime = Date.now();

    const results = await PollResultsService.getPollResults(pollId);

    const serviceDuration = Date.now() - serviceStartTime;
    const totalDuration = Date.now() - startTime;

    console.log(`[${requestId}] [getPollResultsAction] SUCCESS`, {
      pollId,
      serviceDuration,
      totalDuration,
      statementCount: results.statements.length,
      totalVotes: results.totalVotes,
    });

    return { success: true, data: results };
  } catch (error) {
    const totalDuration = Date.now() - startTime;

    console.error(`[${requestId}] [getPollResultsAction] ERROR`, {
      pollId,
      totalDuration,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });

    return { success: false, error: "Failed to fetch poll results" };
  }
}

export async function getPollResultsSummaryAction(pollId: string) {
  try {
    const summary = await PollResultsService.getPollResultsSummary(pollId);
    return { success: true, data: summary };
  } catch (error) {
    console.error("Error fetching poll results summary:", error);
    return { success: false, error: "Failed to fetch poll results summary" };
  }
}

export async function invalidatePollSummaryAction(pollId: string) {
  try {
    await PollResultsService.invalidateSummary(pollId);
    // Revalidate all poll pages since we don't have slug here
    revalidatePath(`/polls`);
    return { success: true };
  } catch (error) {
    console.error("Error invalidating poll summary:", error);
    return { success: false, error: "Failed to invalidate poll summary" };
  }
}
