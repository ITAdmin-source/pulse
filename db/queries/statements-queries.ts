import { eq, desc, and, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "../db";
import { statements, type Statement, type NewStatement } from "../schema/statements";
import { polls } from "../schema/polls";

export async function getStatementById(id: string): Promise<Statement | undefined> {
  const result = await db
    .select()
    .from(statements)
    .where(eq(statements.id, id))
    .limit(1);

  return result[0];
}

export async function getAllStatements(): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .orderBy(desc(statements.createdAt));
}

export async function getStatementsByPollId(pollId: string): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .where(eq(statements.pollId, pollId))
    .orderBy(desc(statements.createdAt));
}

// Use Next.js unstable_cache for cross-request caching
// This enables prefetch to work across Server Action boundaries
export const getApprovedStatementsByPollId = unstable_cache(
  async (pollId: string): Promise<Statement[]> => {
    const queryId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();

    console.log(`[QUERY ${queryId}] ${timestamp} - Cache MISS - Executing DB query for poll: ${pollId}`);

    const startTime = performance.now();
    const result = await db
      .select()
      .from(statements)
      .where(and(eq(statements.pollId, pollId), eq(statements.approved, true)))
      .orderBy(desc(statements.createdAt));
    const duration = performance.now() - startTime;

    console.log(`[QUERY ${queryId}] DB query completed in ${duration.toFixed(2)}ms, found ${result.length} statements`);
    return result;
  },
  ['approved-statements'], // Cache key prefix
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['statements'] // Tag for cache invalidation
  }
);

export async function getAllPendingStatements(): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .where(isNull(statements.approved))
    .orderBy(desc(statements.createdAt));
}

export async function createStatement(data: NewStatement): Promise<Statement> {
  const finalData = { ...data };

  if (data.pollId) {
    const pollResult = await db.select().from(polls).where(eq(polls.id, data.pollId)).limit(1);
    const poll = pollResult[0];

    if (poll?.autoApproveStatements) {
      finalData.approved = true;
      finalData.approvedAt = new Date();
    }
  }

  const result = await db
    .insert(statements)
    .values(finalData)
    .returning();

  return result[0];
}

export async function updateStatement(id: string, data: Partial<NewStatement>): Promise<Statement | undefined> {
  const result = await db
    .update(statements)
    .set(data)
    .where(eq(statements.id, id))
    .returning();

  return result[0];
}

export async function deleteStatement(id: string): Promise<boolean> {
  const result = await db
    .delete(statements)
    .where(eq(statements.id, id));

  return result.length > 0;
}