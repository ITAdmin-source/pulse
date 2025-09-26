import { z } from "zod";

export const voteValueSchema = z.union([
  z.literal(-1),
  z.literal(0),
  z.literal(1),
], {
  message: "Vote value must be -1 (disagree), 0 (neutral), or 1 (agree)",
});

export const createVoteSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  statementId: z.string().uuid("Invalid statement ID"),
  value: voteValueSchema,
});

export const updateVoteSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  statementId: z.string().uuid("Invalid statement ID"),
  value: voteValueSchema,
});

export const voteQuerySchema = z.object({
  userId: z.string().uuid("Invalid user ID").optional(),
  statementId: z.string().uuid("Invalid statement ID").optional(),
  pollId: z.string().uuid("Invalid poll ID").optional(),
  value: voteValueSchema.optional(),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().min(0).default(0),
});

export const userVotingProgressSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  pollId: z.string().uuid("Invalid poll ID"),
});