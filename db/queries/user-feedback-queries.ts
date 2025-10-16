import { eq, desc, count, sql } from "drizzle-orm";
import { db } from "../db";
import { userFeedback, type UserFeedback, type NewUserFeedback } from "../schema/user-feedback";

/**
 * Create a new feedback entry
 */
export async function createFeedback(data: NewUserFeedback): Promise<UserFeedback> {
  const result = await db
    .insert(userFeedback)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Get feedback by ID
 */
export async function getFeedbackById(id: string): Promise<UserFeedback | undefined> {
  const result = await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.id, id))
    .limit(1);

  return result[0];
}

/**
 * Get all feedback entries (for admin panel)
 * Ordered by creation date (newest first)
 */
export async function getAllFeedback(
  limit: number = 50,
  offset: number = 0
): Promise<UserFeedback[]> {
  return await db
    .select()
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get feedback by status (for admin filtering)
 */
export async function getFeedbackByStatus(
  status: "new" | "reviewed" | "resolved" | "dismissed",
  limit: number = 50,
  offset: number = 0
): Promise<UserFeedback[]> {
  return await db
    .select()
    .from(userFeedback)
    .where(eq(userFeedback.status, status))
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Update feedback status (for admin management)
 */
export async function updateFeedbackStatus(
  id: string,
  status: "new" | "reviewed" | "resolved" | "dismissed",
  adminNotes?: string
): Promise<UserFeedback | undefined> {
  const updateData: Partial<NewUserFeedback> = { status };
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  const result = await db
    .update(userFeedback)
    .set(updateData)
    .where(eq(userFeedback.id, id))
    .returning();

  return result[0];
}

/**
 * Get count of feedback by status
 */
export async function getFeedbackCountByStatus(): Promise<
  Array<{ status: string; count: number }>
> {
  const result = await db
    .select({
      status: userFeedback.status,
      count: count(userFeedback.id),
    })
    .from(userFeedback)
    .groupBy(userFeedback.status);

  return result.map((r) => ({
    status: r.status as string,
    count: Number(r.count),
  }));
}

/**
 * Delete feedback entry (for admin cleanup)
 */
export async function deleteFeedback(id: string): Promise<boolean> {
  const result = await db
    .delete(userFeedback)
    .where(eq(userFeedback.id, id))
    .returning({ id: userFeedback.id });

  return result.length > 0;
}
