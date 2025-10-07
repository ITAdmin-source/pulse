import { eq, sql, count, and, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { users, userRoles, votes, userPollInsights, statements } from "@/db/schema";

interface UserWithStats {
  id: string;
  email?: string;
  clerkUserId?: string;
  sessionId?: string;
  type: 'authenticated' | 'anonymous';
  pollsParticipated: number;
  totalVotes: number;
  roles: Array<{ role: string; pollId?: string }>;
  createdAt: Date;
}

interface UserStats {
  pollsParticipated: string[]; // poll IDs
  totalVotes: number;
  insightsGenerated: number;
  statementsSubmitted: number;
  roles: Array<{ role: string; pollId?: string }>;
}

interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string;
  userType?: 'all' | 'authenticated' | 'anonymous';
  roleFilter?: 'all' | 'admin' | 'owner' | 'manager' | 'none';
}

export class UserManagementService {
  /**
   * List users with pagination and filtering
   */
  static async listUsers(options: ListUsersOptions): Promise<{
    users: UserWithStats[];
    totalCount: number;
    totalPages: number;
  }> {
    const { page, limit, search, userType = 'all', roleFilter = 'all' } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (userType === 'authenticated') {
      whereConditions.push(sql`${users.clerkUserId} IS NOT NULL`);
    } else if (userType === 'anonymous') {
      whereConditions.push(sql`${users.clerkUserId} IS NULL AND ${users.sessionId} IS NOT NULL`);
    }

    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      whereConditions.push(
        sql`(
          LOWER(${users.clerkUserId}) LIKE ${searchTerm} OR
          LOWER(${users.sessionId}) LIKE ${searchTerm} OR
          LOWER(CAST(${users.metadata} AS TEXT)) LIKE ${searchTerm}
        )`
      );
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(users)
      .$dynamic();

    if (whereConditions.length > 0) {
      countQuery.where(and(...whereConditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Get users with basic info
    const usersQuery = db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        sessionId: users.sessionId,
        metadata: users.metadata,
        createdAt: users.createdAt,
      })
      .from(users)
      .$dynamic();

    if (whereConditions.length > 0) {
      usersQuery.where(and(...whereConditions));
    }

    const usersList = await usersQuery
      .orderBy(sql`${users.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Get all user IDs
    const userIds = usersList.map(u => u.id);

    // Get vote counts per user
    const voteCounts = await db
      .select({
        userId: votes.userId,
        count: count(),
      })
      .from(votes)
      .where(sql`${votes.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(votes.userId);

    const voteCountMap = new Map(voteCounts.map(v => [v.userId, v.count]));

    // Get distinct polls per user (from votes joined with statements)
    const pollParticipation = await db
      .select({
        userId: votes.userId,
        pollId: statements.pollId,
      })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(sql`${votes.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(votes.userId, statements.pollId);

    const pollCountMap = new Map<string, number>();
    pollParticipation.forEach(p => {
      const current = pollCountMap.get(p.userId) || 0;
      pollCountMap.set(p.userId, current + 1);
    });

    // Get all roles for these users
    const allRoles = await db
      .select()
      .from(userRoles)
      .where(sql`${userRoles.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

    const rolesMap = new Map<string, Array<{ role: string; pollId?: string }>>();
    allRoles.forEach(role => {
      const existing = rolesMap.get(role.userId) || [];
      existing.push({ role: role.role, pollId: role.pollId || undefined });
      rolesMap.set(role.userId, existing);
    });

    // Apply role filter
    let filteredUsersList = usersList;
    if (roleFilter !== 'all') {
      filteredUsersList = usersList.filter(user => {
        const roles = rolesMap.get(user.id) || [];

        if (roleFilter === 'none') {
          return roles.length === 0;
        } else if (roleFilter === 'admin') {
          return roles.some(r => r.role === 'system_admin');
        } else if (roleFilter === 'owner') {
          return roles.some(r => r.role === 'poll_owner');
        } else if (roleFilter === 'manager') {
          return roles.some(r => r.role === 'poll_manager');
        }

        return true;
      });
    }

    // Map to UserWithStats
    const usersWithStats: UserWithStats[] = filteredUsersList.map(user => {
      const metadata = user.metadata as { profileData?: { primaryEmailAddress?: { emailAddress: string } } } | null;
      const email = metadata?.profileData?.primaryEmailAddress?.emailAddress;

      return {
        id: user.id,
        email,
        clerkUserId: user.clerkUserId || undefined,
        sessionId: user.sessionId || undefined,
        type: user.clerkUserId ? 'authenticated' : 'anonymous',
        pollsParticipated: pollCountMap.get(user.id) || 0,
        totalVotes: voteCountMap.get(user.id) || 0,
        roles: rolesMap.get(user.id) || [],
        createdAt: user.createdAt,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      users: usersWithStats,
      totalCount,
      totalPages,
    };
  }

  /**
   * Get detailed user participation stats
   */
  static async getUserStats(userId: string): Promise<UserStats> {
    // Get distinct polls from votes (joined with statements)
    const pollsParticipated = await db
      .selectDistinct({ pollId: statements.pollId })
      .from(votes)
      .innerJoin(statements, eq(votes.statementId, statements.id))
      .where(eq(votes.userId, userId));

    // Get total votes
    const [{ count: totalVotes }] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.userId, userId));

    // Get insights count
    const [{ count: insightsGenerated }] = await db
      .select({ count: count() })
      .from(userPollInsights)
      .where(eq(userPollInsights.userId, userId));

    // Get statements submitted count
    const [{ count: statementsSubmitted }] = await db
      .select({ count: count() })
      .from(statements)
      .where(eq(statements.submittedBy, userId));

    // Get roles
    const userRolesList = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    const roles = userRolesList.map(role => ({
      role: role.role,
      pollId: role.pollId || undefined,
    }));

    return {
      pollsParticipated: pollsParticipated.map(p => p.pollId).filter((id): id is string => id !== null),
      totalVotes,
      insightsGenerated,
      statementsSubmitted,
      roles,
    };
  }

  /**
   * Assign system_admin role to user
   */
  static async assignSystemAdmin(userId: string): Promise<void> {
    // Check if user already has system_admin role
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'system_admin'),
          isNull(userRoles.pollId)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      throw new Error("User already has system_admin role");
    }

    // Create system_admin role (pollId is null for global roles)
    await db.insert(userRoles).values({
      userId,
      role: 'system_admin',
      pollId: null,
    });
  }

  /**
   * Revoke system_admin role from user
   */
  static async revokeSystemAdmin(userId: string): Promise<void> {
    const result = await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'system_admin'),
          isNull(userRoles.pollId)
        )
      )
      .returning({ id: userRoles.id });

    if (result.length === 0) {
      throw new Error("User does not have system_admin role");
    }
  }

  /**
   * Check if user is system admin
   */
  static async isSystemAdmin(userId: string): Promise<boolean> {
    const adminRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'system_admin'),
          isNull(userRoles.pollId)
        )
      )
      .limit(1);

    return adminRole.length > 0;
  }
}
