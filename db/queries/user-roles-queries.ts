import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { userRoles, type UserRole, type NewUserRole } from "../schema/user-roles";

export async function getUserRoleById(id: string): Promise<UserRole | undefined> {
  const result = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, id))
    .limit(1);

  return result[0];
}

export async function getUserRolesByUserId(userId: string): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
}

export async function getUserRolesByPollId(pollId: string): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.pollId, pollId));
}

export async function getUserRoleByUserAndPoll(userId: string, pollId: string | null): Promise<UserRole[]> {
  const conditions = [eq(userRoles.userId, userId)];

  if (pollId === null) {
    // For global roles, pollId should be null
    conditions.push(eq(userRoles.pollId, null));
  } else {
    conditions.push(eq(userRoles.pollId, pollId));
  }

  return await db
    .select()
    .from(userRoles)
    .where(and(...conditions));
}

export async function getAllUserRoles(): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles);
}

export async function createUserRole(data: NewUserRole): Promise<UserRole> {
  const result = await db
    .insert(userRoles)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUserRole(id: string, data: Partial<NewUserRole>): Promise<UserRole | undefined> {
  const result = await db
    .update(userRoles)
    .set(data)
    .where(eq(userRoles.id, id))
    .returning();

  return result[0];
}

export async function deleteUserRole(id: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.id, id))
    .returning({ id: userRoles.id });

  return result.length > 0;
}

export async function deleteUserRolesByUserId(userId: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.userId, userId))
    .returning({ id: userRoles.id });

  return result.length > 0;
}

export async function deleteUserRolesByPollId(pollId: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.pollId, pollId))
    .returning({ id: userRoles.id });

  return result.length > 0;
}