import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { votes, type Vote, type NewVote } from "../schema/votes";

export async function getVoteById(id: string): Promise<Vote | undefined> {
  const result = await db
    .select()
    .from(votes)
    .where(eq(votes.id, id))
    .limit(1);

  return result[0];
}

export async function getAllVotes(): Promise<Vote[]> {
  return await db
    .select()
    .from(votes)
    .orderBy(desc(votes.createdAt));
}

export async function getVotesByStatementId(statementId: string): Promise<Vote[]> {
  return await db
    .select()
    .from(votes)
    .where(eq(votes.statementId, statementId))
    .orderBy(desc(votes.createdAt));
}

export async function getVotesByUserId(userId: string): Promise<Vote[]> {
  return await db
    .select()
    .from(votes)
    .where(eq(votes.userId, userId))
    .orderBy(desc(votes.createdAt));
}

export async function getVoteByUserAndStatement(userId: string, statementId: string): Promise<Vote | undefined> {
  const result = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, userId), eq(votes.statementId, statementId)))
    .limit(1);

  return result[0];
}

export async function createVote(data: NewVote): Promise<Vote> {
  const result = await db
    .insert(votes)
    .values(data)
    .returning();

  return result[0];
}

export async function updateVote(id: string, data: Partial<NewVote>): Promise<Vote | undefined> {
  const result = await db
    .update(votes)
    .set(data)
    .where(eq(votes.id, id))
    .returning();

  return result[0];
}

export async function upsertVote(userId: string, statementId: string, value: number): Promise<Vote> {
  const existingVote = await getVoteByUserAndStatement(userId, statementId);

  if (existingVote) {
    const result = await db
      .update(votes)
      .set({ value })
      .where(eq(votes.id, existingVote.id))
      .returning();
    return result[0];
  } else {
    return await createVote({ userId, statementId, value });
  }
}

export async function deleteVote(id: string): Promise<boolean> {
  const result = await db
    .delete(votes)
    .where(eq(votes.id, id));

  return result.length > 0;
}