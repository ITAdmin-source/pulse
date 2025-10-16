import { z } from "zod";

export const createFeedbackSchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין").nullable().optional(),
  feedbackText: z.string()
    .min(1, "אנא כתבו את המשוב שלכם")
    .max(1000, "המשוב ארוך מדי (מקסימום 1000 תווים)"),
  pageUrl: z.string().optional(),
  userAgent: z.string().optional(),
});

export const updateFeedbackStatusSchema = z.object({
  id: z.string().uuid("מזהה משוב לא תקין"),
  status: z.enum(["new", "reviewed", "resolved", "dismissed"]),
  adminNotes: z.string().optional(),
});

export const feedbackQuerySchema = z.object({
  status: z.enum(["new", "reviewed", "resolved", "dismissed"]).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type FeedbackQueryInput = z.infer<typeof feedbackQuerySchema>;
