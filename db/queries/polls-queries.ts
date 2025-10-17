import { eq, desc, and, isNull, or, lte, gt, inArray, sql, count } from "drizzle-orm";
import { db } from "../db";
import { polls, type Poll, type NewPoll } from "../schema/polls";
import { statements } from "../schema/statements";
import { votes } from "../schema/votes";
import { userRoles } from "../schema/user-roles";

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

export async function getVisiblePolls(): Promise<Poll[]> {
  return await db
    .select()
    .from(polls)
    .where(or(eq(polls.status, "published"), eq(polls.status, "closed")))
    .orderBy(desc(polls.createdAt));
}

/**
 * Get visible polls with aggregate statistics (voter count, total votes)
 * Used for poll listing pages
 */
export async function getVisiblePollsWithStats(): Promise<Array<Poll & { totalVoters: number; totalVotes: number }>> {
  // First get all visible polls
  const visiblePolls = await db
    .select()
    .from(polls)
    .where(or(eq(polls.status, "published"), eq(polls.status, "closed")))
    .orderBy(desc(polls.createdAt));

  // For each poll, calculate stats
  const pollsWithStats = await Promise.all(
    visiblePolls.map(async (poll) => {
      // Count unique voters (distinct users who voted on approved statements)
      const voterCountResult = await db
        .select({ userId: votes.userId })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(and(
          eq(statements.pollId, poll.id),
          eq(statements.approved, true)
        ))
        .groupBy(votes.userId);

      const totalVoters = voterCountResult.length;

      // Count total votes (all votes on approved statements)
      const totalVotesResult = await db
        .select({ count: count() })
        .from(votes)
        .innerJoin(statements, eq(votes.statementId, statements.id))
        .where(and(
          eq(statements.pollId, poll.id),
          eq(statements.approved, true)
        ));

      const totalVotes = totalVotesResult[0]?.count || 0;

      return {
        ...poll,
        totalVoters,
        totalVotes: Number(totalVotes),
      };
    })
  );

  return pollsWithStats;
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
          lte(polls.startTime, now)
        ),
        or(
          isNull(polls.endTime),
          gt(polls.endTime, now)
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

export async function closePoll(id: string): Promise<Poll | undefined> {
  return await updatePoll(id, { status: "closed" });
}

/**
 * Get all polls where user is owner or manager
 */
export async function getPollsByUserRoles(userId: string): Promise<Poll[]> {
  // Get all poll IDs where user has owner or manager role
  const roles = await db
    .select({ pollId: userRoles.pollId })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, userId),
        or(
          eq(userRoles.role, 'poll_owner'),
          eq(userRoles.role, 'poll_manager')
        )
      )
    );

  const pollIds = roles.map(r => r.pollId).filter(id => id !== null) as string[];

  if (pollIds.length === 0) {
    return [];
  }

  // Get all polls for those poll IDs
  return await db
    .select()
    .from(polls)
    .where(inArray(polls.id, pollIds))
    .orderBy(desc(polls.createdAt));
}