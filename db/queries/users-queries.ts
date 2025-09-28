import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { users, type User, type NewUser } from "../schema/users";

export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0];
}

export async function getUserByClerkId(clerkUserId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  return result[0];
}

export async function getUserBySessionId(sessionId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.sessionId, sessionId))
    .limit(1);

  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function createUser(data: NewUser): Promise<User> {
  const result = await db
    .insert(users)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
  const result = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();

  return result[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  return result.length > 0;
}

export async function upgradeUser(id: string): Promise<User | undefined> {
  const result = await db
    .update(users)
    .set({ lastSyncedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  return result[0];
}