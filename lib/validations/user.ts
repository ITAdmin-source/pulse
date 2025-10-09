import { z } from "zod";

export const createUserSchema = z.object({
  clerkUserId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => data.clerkUserId || data.sessionId,
  {
    message: "חובה לספק מזהה Clerk או מזהה סשן",
    path: ["clerkUserId"],
  }
);

export const upgradeUserSchema = z.object({
  sessionId: z.string().min(1, "מזהה סשן נדרש"),
  clerkUserId: z.string().min(1, "מזהה משתמש Clerk נדרש"),
});

export const userProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, "שם נדרש").max(100, "שם ארוך מדי"),
  picture: z.string().url().optional(),
  bio: z.string().max(500, "ביוגרפיה ארוכה מדי").optional(),
  website: z.string().url().optional(),
  twitter: z.string().max(50, "שם משתמש טוויטר ארוך מדי").optional(),
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
    message: "מזהה סקר נדרש עבור תפקידים שאינם מנהל מערכת",
    path: ["pollId"],
  }
);