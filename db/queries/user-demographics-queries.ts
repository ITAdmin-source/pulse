import { eq } from "drizzle-orm";
import { db } from "../db";
import { userDemographics, type UserDemographics, type NewUserDemographics } from "../schema/user-demographics";

export async function getUserDemographicsById(userId: string): Promise<UserDemographics | undefined> {
  const result = await db
    .select()
    .from(userDemographics)
    .where(eq(userDemographics.userId, userId))
    .limit(1);

  return result[0];
}

export async function getAllUserDemographics(): Promise<UserDemographics[]> {
  return await db
    .select()
    .from(userDemographics);
}

export async function createUserDemographics(data: NewUserDemographics): Promise<UserDemographics> {
  const result = await db
    .insert(userDemographics)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUserDemographics(userId: string, data: Partial<NewUserDemographics>): Promise<UserDemographics | undefined> {
  const result = await db
    .update(userDemographics)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userDemographics.userId, userId))
    .returning();

  return result[0];
}

export async function deleteUserDemographics(userId: string): Promise<boolean> {
  const result = await db
    .delete(userDemographics)
    .where(eq(userDemographics.userId, userId))
    .returning({ userId: userDemographics.userId });

  return result.length > 0;
}