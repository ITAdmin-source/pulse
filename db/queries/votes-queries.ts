import { eq, desc, and, sql, count } from "drizzle-orm";
import { db } from "../db";
import { votes, type Vote, type NewVote } from "../schema/votes";
import { statements } from "../schema/statements";
import { polls } from "../schema/polls";

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

/**
 * @deprecated Votes are immutable and cannot be updated per business rules.
 * This function is kept for emergency admin operations only.
 * DO NOT use in application code.
 */
export async function updateVote(id: string, data: Partial<NewVote>): Promise<Vote | undefined> {
  console.warn("DEPRECATED: updateVote called. Votes are immutable per business rules.");
  throw new Error("Votes are immutable and cannot be updated. Use createVote for new votes only.");
}

/**
 * @deprecated Votes are immutable - use createVote with duplicate check instead.
 * This function violates the immutability constraint and should not be used.
 */
export async function upsertVote(userId: string, statementId: string, value: number): Promise<Vote> {
  console.warn("DEPRECATED: upsertVote called. Votes are immutable - use createVote instead.");

  // Check if vote exists and reject if it does (enforce immutability)
  const existingVote = await getVoteByUserAndStatement(userId, statementId);

  if (existingVote) {
    throw new Error("Vote already exists and cannot be modified. Votes are immutable.");
  }

  // Only allow creation of new votes
  return await createVote({ userId, statementId, value });
}

export async function deleteVote(id: string): Promise<boolean> {
  const result = await db
    .delete(votes)
    .where(eq(votes.id, id));

  return result.length > 0;
}

export async function getUserVoteCountForPoll(userId: string, pollId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .where(and(eq(votes.userId, userId), eq(statements.pollId, pollId)));

  return result[0]?.count || 0;
}

export async function hasUserMetVotingThreshold(userId: string, pollId: string): Promise<boolean> {
  const [voteCount, statementResult] = await Promise.all([
    getUserVoteCountForPoll(userId, pollId),
    db.select({ count: count() }).from(statements).where(and(eq(statements.pollId, pollId), eq(statements.approved, true)))
  ]);

  const totalStatements = statementResult[0]?.count || 0;
  const threshold = Math.min(10, totalStatements);
  return voteCount >= threshold;
}

/**
 * Get vote distribution for a specific statement
 * Returns counts and percentages for agree/disagree/unsure votes
 */
export async function getStatementVoteDistribution(statementId: string): Promise<{
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  totalVotes: number;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
}> {
  const statementVotes = await getVotesByStatementId(statementId);

  const agreeCount = statementVotes.filter(v => v.value === 1).length;
  const disagreeCount = statementVotes.filter(v => v.value === -1).length;
  const unsureCount = statementVotes.filter(v => v.value === 0).length;
  const totalVotes = statementVotes.length;

  const agreePercent = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;
  const disagreePercent = totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 0;
  const unsurePercent = totalVotes > 0 ? Math.round((unsureCount / totalVotes) * 100) : 0;

  return {
    agreeCount,
    disagreeCount,
    unsureCount,
    totalVotes,
    agreePercent,
    disagreePercent,
    unsurePercent,
  };
}