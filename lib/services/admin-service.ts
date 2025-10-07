import { eq, sql, desc, and, inArray, gte } from "drizzle-orm";
import { db } from "@/db/db";
import { polls, users, votes, statements } from "@/db/schema";

export class AdminService {
  /**
   * Get system-wide statistics for admin dashboard
   */
  static async getSystemStats(): Promise<{
    totalPolls: number;
    activePolls: number;
    draftPolls: number;
    closedPolls: number;
    totalUsers: number;
    authenticatedUsers: number;
    anonymousUsers: number;
    totalVotes: number;
    pendingModeration: number;
  }> {
    // Get poll counts by status
    const allPolls = await db.select().from(polls);
    const totalPolls = allPolls.length;
    const activePolls = allPolls.filter(p => p.status === 'published').length;
    const draftPolls = allPolls.filter(p => p.status === 'draft').length;
    const closedPolls = allPolls.filter(p => p.status === 'closed').length;

    // Get user counts
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;
    const authenticatedUsers = allUsers.filter(u => u.clerkUserId !== null).length;
    const anonymousUsers = allUsers.filter(u => u.clerkUserId === null).length;

    // Get total vote count
    const voteCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes);
    const totalVotes = voteCountResult[0]?.count || 0;

    // Get pending moderation count (statements with approved = null)
    const pendingStatementsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(statements)
      .where(sql`${statements.approved} IS NULL`);
    const pendingModeration = pendingStatementsResult[0]?.count || 0;

    return {
      totalPolls,
      activePolls,
      draftPolls,
      closedPolls,
      totalUsers,
      authenticatedUsers,
      anonymousUsers,
      totalVotes,
      pendingModeration,
    };
  }

  /**
   * Get recent activity for admin dashboard
   */
  static async getRecentActivity(limit: number = 10): Promise<Array<{
    type: 'poll' | 'vote' | 'statement' | 'moderation';
    message: string;
    time: string;
    timestamp: Date;
  }>> {
    const activities: Array<{
      type: 'poll' | 'vote' | 'statement' | 'moderation';
      message: string;
      time: string;
      timestamp: Date;
    }> = [];

    // Get recent polls (created)
    const recentPolls = await db
      .select({
        id: polls.id,
        question: polls.question,
        status: polls.status,
        createdAt: polls.createdAt,
      })
      .from(polls)
      .orderBy(desc(polls.createdAt))
      .limit(5);

    for (const poll of recentPolls) {
      activities.push({
        type: 'poll',
        message: `New poll created: "${poll.question.substring(0, 50)}${poll.question.length > 50 ? '...' : ''}"`,
        time: formatTimeAgo(poll.createdAt),
        timestamp: poll.createdAt,
      });
    }

    // Get recent votes count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVotesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes)
      .where(gte(votes.createdAt, today));

    const todayVotes = todayVotesResult[0]?.count || 0;

    if (todayVotes > 0) {
      activities.push({
        type: 'vote',
        message: `${todayVotes} votes cast today`,
        time: 'Today',
        timestamp: today,
      });
    }

    // Get pending moderation count
    const pendingStatementsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(statements)
      .where(sql`${statements.approved} IS NULL`);

    const pendingCount = pendingStatementsResult[0]?.count || 0;

    if (pendingCount > 0) {
      const recentPendingTime = await db
        .select({ createdAt: statements.createdAt })
        .from(statements)
        .where(sql`${statements.approved} IS NULL`)
        .orderBy(desc(statements.createdAt))
        .limit(1);

      activities.push({
        type: 'moderation',
        message: `${pendingCount} statements pending moderation`,
        time: recentPendingTime[0] ? formatTimeAgo(recentPendingTime[0].createdAt) : 'Recently',
        timestamp: recentPendingTime[0]?.createdAt || new Date(),
      });
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get list of all polls for admin management
   */
  static async getAllPollsForAdmin(): Promise<Array<{
    id: string;
    slug: string;
    question: string;
    status: string;
    createdAt: Date;
    totalVoters: number;
    totalStatements: number;
  }>> {
    const allPolls = await db
      .select({
        id: polls.id,
        slug: polls.slug,
        question: polls.question,
        status: polls.status,
        createdAt: polls.createdAt,
      })
      .from(polls)
      .orderBy(desc(polls.createdAt));

    // Get vote and statement counts for each poll
    const pollsWithStats = await Promise.all(
      allPolls.map(async (poll) => {
        // Get approved statements for this poll
        const pollStatements = await db
          .select({ id: statements.id })
          .from(statements)
          .where(
            and(
              eq(statements.pollId, poll.id),
              eq(statements.approved, true)
            )
          );

        const statementIds = pollStatements.map(s => s.id);

        let totalVoters = 0;
        if (statementIds.length > 0) {
          const pollVotes = await db
            .select({ userId: votes.userId })
            .from(votes)
            .where(inArray(votes.statementId, statementIds));

          totalVoters = new Set(pollVotes.map(v => v.userId)).size;
        }

        return {
          ...poll,
          totalVoters,
          totalStatements: pollStatements.length,
        };
      })
    );

    return pollsWithStats;
  }
}

/**
 * Format timestamp as relative time ago
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
