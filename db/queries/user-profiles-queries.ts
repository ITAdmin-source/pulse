import { eq } from "drizzle-orm";
import { db } from "../db";
import { userProfiles, type UserProfile, type NewUserProfile } from "../schema/user-profiles";

export async function getUserProfileById(userId: string): Promise<UserProfile | undefined> {
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  return result[0];
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  return await db
    .select()
    .from(userProfiles);
}

export async function createUserProfile(data: NewUserProfile): Promise<UserProfile> {
  const result = await db
    .insert(userProfiles)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUserProfile(userId: string, data: Partial<NewUserProfile>): Promise<UserProfile | undefined> {
  const result = await db
    .update(userProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userProfiles.userId, userId))
    .returning();

  return result[0];
}

export async function deleteUserProfile(userId: string): Promise<boolean> {
  const result = await db
    .delete(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .returning({ userId: userProfiles.userId });

  return result.length > 0;
}

export async function upsertUserProfile(data: NewUserProfile): Promise<UserProfile> {
  const result = await db
    .insert(userProfiles)
    .values(data)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        name: data.name,
        pictureUrl: data.pictureUrl,
        socialLink: data.socialLink,
        updatedAt: new Date(),
      },
    })
    .returning();

  return result[0];
}