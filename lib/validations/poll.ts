import { z } from "zod";

export const createPollSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question too long"),
  description: z.string().max(2000, "Description too long").optional(),
  allowUserStatements: z.boolean().default(false),
  autoApproveStatements: z.boolean().default(false),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  votingGoal: z.number().int().positive().optional(),
  supportButtonLabel: z.string().max(10, "Label too long").optional(),
  opposeButtonLabel: z.string().max(10, "Label too long").optional(),
  unsureButtonLabel: z.string().max(10, "Label too long").optional(),
  minStatementsVotedToEnd: z.number().int().min(1).default(5),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export const updatePollSchema = createPollSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published']).optional(),
});

export const publishPollSchema = z.object({
  id: z.string().uuid(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
});

export const pollStatusSchema = z.enum(['draft', 'published']);

export const pollQuerySchema = z.object({
  status: pollStatusSchema.optional(),
  createdBy: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  search: z.string().max(100).optional(),
});