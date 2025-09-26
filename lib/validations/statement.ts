import { z } from "zod";

export const createStatementSchema = z.object({
  pollId: z.string().uuid("Invalid poll ID"),
  text: z.string()
    .min(1, "Statement text is required")
    .max(280, "Statement too long (max 280 characters)"),
  submittedBy: z.string().uuid("Invalid user ID").optional(),
});

export const updateStatementSchema = z.object({
  id: z.string().uuid("Invalid statement ID"),
  text: z.string()
    .min(1, "Statement text is required")
    .max(280, "Statement too long (max 280 characters)")
    .optional(),
  approved: z.boolean().optional(),
  approvedBy: z.string().uuid("Invalid approver ID").optional(),
  approvedAt: z.date().optional(),
});

export const approveStatementSchema = z.object({
  id: z.string().uuid("Invalid statement ID"),
  approved: z.boolean(),
  approvedBy: z.string().uuid("Invalid approver ID"),
});

export const statementQuerySchema = z.object({
  pollId: z.string().uuid("Invalid poll ID"),
  approved: z.boolean().nullable().optional(),
  submittedBy: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});