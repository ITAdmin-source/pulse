import { eq, desc, and, or, isNull } from "drizzle-orm";
import { db } from "../db";
import { polls, type Poll, type NewPoll } from "../schema/polls";

export async function getPollById(id: string): Promise<Poll | undefined> {
  const result = await db
    .select()
    .from(polls)
    .where(eq(polls.id, id))
    .limit(1);

  return result[0];
}

export async function getPollBySlug(slug: string): Promise<Poll | undefined> {
  const result = await db
    .select()
    .from(polls)
    .where(eq(polls.slug, slug))
    .limit(1);

  return result[0];
}

export async function getAllPolls(): Promise<Poll[]> {
  return await db
    .select()
    .from(polls)
    .orderBy(desc(polls.createdAt));
}

export async function getPollsByStatus(status: "draft" | "published"): Promise<Poll[]> {
  return await db
    .select()
    .from(polls)
    .where(eq(polls.status, status))
    .orderBy(desc(polls.createdAt));
}

export async function getPollsByCreator(createdBy: string): Promise<Poll[]> {
  return await db
    .select()
    .from(polls)
    .where(eq(polls.createdBy, createdBy))
    .orderBy(desc(polls.createdAt));
}

export async function getPublishedPolls(): Promise<Poll[]> {
  return await db
    .select()
    .from(polls)
    .where(eq(polls.status, "published"))
    .orderBy(desc(polls.createdAt));
}

export async function getActivePolls(): Promise<Poll[]> {
  const now = new Date();
  return await db
    .select()
    .from(polls)
    .where(
      and(
        eq(polls.status, "published"),
        or(
          isNull(polls.startTime),
          eq(polls.startTime, null)
        ),
        or(
          isNull(polls.endTime),
          eq(polls.endTime, null)
        )
      )
    )
    .orderBy(desc(polls.createdAt));
}

export async function createPoll(data: NewPoll): Promise<Poll> {
  const result = await db
    .insert(polls)
    .values(data)
    .returning();

  return result[0];
}

export async function updatePoll(id: string, data: Partial<NewPoll>): Promise<Poll | undefined> {
  const result = await db
    .update(polls)
    .set(data)
    .where(eq(polls.id, id))
    .returning();

  return result[0];
}

export async function deletePoll(id: string): Promise<boolean> {
  const result = await db
    .delete(polls)
    .where(eq(polls.id, id))
    .returning({ id: polls.id });

  return result.length > 0;
}

export async function publishPoll(id: string): Promise<Poll | undefined> {
  return await updatePoll(id, { status: "published" });
}

export async function unpublishPoll(id: string): Promise<Poll | undefined> {
  return await updatePoll(id, { status: "draft" });
}