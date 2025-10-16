import { createFeedback } from "@/db/queries/user-feedback-queries";
import type { NewUserFeedback, UserFeedback } from "@/db/schema/user-feedback";
import { createFeedbackSchema, type CreateFeedbackInput } from "@/lib/validations/feedback";

export class FeedbackService {
  /**
   * Submit user feedback
   * Validates input, auto-captures page URL and user agent
   */
  static async submitFeedback(input: CreateFeedbackInput): Promise<UserFeedback> {
    // Validate input
    const validatedData = createFeedbackSchema.parse(input);

    // Prepare feedback data
    const feedbackData: NewUserFeedback = {
      userId: validatedData.userId || null,
      feedbackText: validatedData.feedbackText.trim(),
      pageUrl: validatedData.pageUrl || null,
      userAgent: validatedData.userAgent || null,
      status: "new",
    };

    // Create feedback in database
    const feedback = await createFeedback(feedbackData);

    return feedback;
  }

  /**
   * Auto-capture page URL from window location (client-side)
   */
  static capturePageUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.pathname + window.location.search;
    }
    return "";
  }

  /**
   * Auto-capture user agent from navigator (client-side)
   */
  static captureUserAgent(): string {
    if (typeof window !== "undefined" && navigator) {
      return navigator.userAgent;
    }
    return "";
  }
}
