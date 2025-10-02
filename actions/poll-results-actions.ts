"use server";

import { revalidatePath } from "next/cache";
import { PollResultsService } from "@/lib/services/poll-results-service";

export async function getPollResultsAction(pollId: string) {
  try {
    const results = await PollResultsService.getPollResults(pollId);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching poll results:", error);
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
    revalidatePath(`/polls/${pollId}/results`);
    return { success: true };
  } catch (error) {
    console.error("Error invalidating poll summary:", error);
    return { success: false, error: "Failed to invalidate poll summary" };
  }
}
