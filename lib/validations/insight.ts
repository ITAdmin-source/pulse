import { z } from "zod";

export const createUserPollInsightSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  pollId: z.string().uuid("Invalid poll ID"),
  insight: z.string().min(1, "Insight content is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateUserPollInsightSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  pollId: z.string().uuid("Invalid poll ID"),
  insight: z.string().min(1, "Insight content is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const getUserPollInsightSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  pollId: z.string().uuid("Invalid poll ID"),
});