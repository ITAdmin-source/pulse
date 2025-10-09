import { z } from "zod";

export const createStatementSchema = z.object({
  pollId: z.string().uuid("מזהה סקר לא תקין"),
  text: z.string()
    .min(1, "טקסט ההצהרה נדרש")
    .max(140, "הצהרה ארוכה מדי (מקסימום 140 תווים)"),
  submittedBy: z.string().uuid("מזהה משתמש לא תקין").optional(),
});

export const updateStatementSchema = z.object({
  id: z.string().uuid("מזהה הצהרה לא תקין"),
  text: z.string()
    .min(1, "טקסט ההצהרה נדרש")
    .max(140, "הצהרה ארוכה מדי (מקסימום 140 תווים)")
    .optional(),
  approved: z.boolean().optional(),
  approvedBy: z.string().uuid("מזהה מאשר לא תקין").optional(),
  approvedAt: z.date().optional(),
});

export const approveStatementSchema = z.object({
  id: z.string().uuid("מזהה הצהרה לא תקין"),
  approved: z.boolean(),
  approvedBy: z.string().uuid("מזהה מאשר לא תקין"),
});

export const statementQuerySchema = z.object({
  pollId: z.string().uuid("מזהה סקר לא תקין"),
  approved: z.boolean().nullable().optional(),
  submittedBy: z.string().uuid().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
});