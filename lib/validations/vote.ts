import { z } from "zod";

export const voteValueSchema = z.union([
  z.literal(-1),
  z.literal(0),
  z.literal(1),
], {
  message: "ערך ההצבעה חייב להיות -1 (לא מסכים), 0 (ניטרלי), או 1 (מסכים)",
});

export const createVoteSchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין"),
  statementId: z.string().uuid("מזהה הצהרה לא תקין"),
  value: voteValueSchema,
});

export const updateVoteSchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין"),
  statementId: z.string().uuid("מזהה הצהרה לא תקין"),
  value: voteValueSchema,
});

export const voteQuerySchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין").optional(),
  statementId: z.string().uuid("מזהה הצהרה לא תקין").optional(),
  pollId: z.string().uuid("מזהה סקר לא תקין").optional(),
  value: voteValueSchema.optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export const userVotingProgressSchema = z.object({
  userId: z.string().uuid("מזהה משתמש לא תקין"),
  pollId: z.string().uuid("מזהה סקר לא תקין"),
});

export const statementBatchSchema = z.object({
  pollId: z.string().uuid("מזהה סקר לא תקין"),
  userId: z.string().uuid("מזהה משתמש לא תקין"),
  batchNumber: z.number().int().positive("מספר האצווה חייב להיות חיובי"),
});

export const votingProgressResponseSchema = z.object({
  totalVoted: z.number().int().min(0),
  currentBatch: z.number().int().positive(),
  hasMoreStatements: z.boolean(),
  thresholdReached: z.boolean(),
});