"use server";

import { FeedbackService } from "@/lib/services/feedback-service";
import type { CreateFeedbackInput } from "@/lib/validations/feedback";

/**
 * Submit user feedback action
 * No revalidation needed as feedback is not displayed on public pages
 */
export async function submitFeedbackAction(input: CreateFeedbackInput) {
  try {
    const feedback = await FeedbackService.submitFeedback(input);
    return { success: true, data: feedback };
  } catch (error) {
    console.error("Error submitting feedback:", error);

    // Return user-friendly error message
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "שגיאה בשליחת המשוב" };
  }
}
