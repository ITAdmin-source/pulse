import { z } from "zod";

export const createUserSchema = z.object({
  clerkUserId: z.string().optional(),
  sessionId: z.string().optional(),
  cachedMetadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => data.clerkUserId || data.sessionId,
  {
    message: "Either clerkUserId or sessionId must be provided",
    path: ["clerkUserId"],
  }
);

export const upgradeUserSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  clerkUserId: z.string().min(1, "Clerk user ID is required"),
});

export const userProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  picture: z.string().url().optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  website: z.string().url().optional(),
  twitter: z.string().max(50, "Twitter handle too long").optional(),
  linkedin: z.string().url().optional(),
});

export const userDemographicsSchema = z.object({
  userId: z.string().uuid(),
  ageGroupId: z.string().uuid().optional(),
  genderId: z.string().uuid().optional(),
  ethnicityId: z.string().uuid().optional(),
  politicalPartyId: z.string().uuid().optional(),
});

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['system_admin', 'poll_owner', 'poll_manager']),
  pollId: z.string().uuid().optional(),
}).refine(
  (data) => {
    // System admin doesn't need pollId, others do
    if (data.role === 'system_admin') {
      return true;
    }
    return !!data.pollId;
  },
  {
    message: "Poll ID is required for non-system admin roles",
    path: ["pollId"],
  }
);