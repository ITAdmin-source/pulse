import { eq, sql, and, isNull } from "drizzle-orm";
import { db } from "@/db/db";
import { users, userRoles, userDemographics } from "@/db/schema";
import type { User } from "@/db/schema";
import { createUserSchema, upgradeUserSchema } from "@/lib/validations/user";
import { z } from "zod";
import { UserProfileService } from "./user-profile-service";

export class UserService {
  static async createUser(data: z.infer<typeof createUserSchema>): Promise<User> {
    const validatedData = createUserSchema.parse(data);

    const [newUser] = await db
      .insert(users)
      .values({
        clerkUserId: validatedData.clerkUserId,
        sessionId: validatedData.sessionId,
        metadata: validatedData.metadata,
      })
      .returning();

    return newUser;
  }

  static async findByClerkId(clerkUserId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    return user || null;
  }

  static async findBySessionId(sessionId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.sessionId, sessionId))
      .limit(1);

    return user || null;
  }

  static async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  }

  static async upgradeAnonymousUser(data: z.infer<typeof upgradeUserSchema>): Promise<User> {
    const validatedData = upgradeUserSchema.parse(data);

    // Find the anonymous user by session ID
    const anonymousUser = await this.findBySessionId(validatedData.sessionId);
    if (!anonymousUser) {
      throw new Error("Anonymous user not found");
    }

    // Check if clerk user already exists
    const existingClerkUser = await this.findByClerkId(validatedData.clerkUserId);
    if (existingClerkUser) {
      throw new Error("User with this Clerk ID already exists");
    }

    // Update the user to link Clerk account
    const [upgradedUser] = await db
      .update(users)
      .set({
        clerkUserId: validatedData.clerkUserId,
        sessionId: null, // Clear session ID
        upgradedAt: new Date(), // Set upgrade time
      })
      .where(eq(users.id, anonymousUser.id))
      .returning();

    // Populate profile from Clerk (name + picture from social signup)
    await UserProfileService.saveProfileFromClerk(upgradedUser.id, validatedData.clerkUserId);

    return upgradedUser;
  }

  /**
   * Creates an anonymous user only when they take an action (vote/submit statement)
   * This replaces getOrCreateAnonymousUser which created users just for visiting
   */
  static async createAnonymousUserForAction(sessionId: string): Promise<User> {
    // Check if user already exists first
    const existingUser = await this.findBySessionId(sessionId);
    if (existingUser) {
      return existingUser;
    }

    // Create new anonymous user only when they take action
    return await this.createUser({ sessionId });
  }

  /**
   * Gets existing authenticated user by Clerk ID, creates if from webhook
   * Also populates user_profiles with name and picture from social signup
   */
  static async getOrCreateUserByClerkId(clerkUserId: string): Promise<User> {
    // Try to find existing user by Clerk ID
    let user = await this.findByClerkId(clerkUserId);

    if (!user) {
      // Create new authenticated user (usually from webhook or JIT)
      user = await this.createUser({ clerkUserId });

      // Populate profile from Clerk (name + picture from social signup)
      await UserProfileService.saveProfileFromClerk(user.id, clerkUserId);
    }

    return user;
  }

  /**
   * Gets current user without creating - for checking existence
   */
  static async getCurrentUser(clerkUserId?: string, sessionId?: string): Promise<User | null> {
    if (clerkUserId) {
      // User is authenticated - get by Clerk ID
      return await this.findByClerkId(clerkUserId);
    } else if (sessionId) {
      // User is anonymous - only return if they exist (have taken actions)
      return await this.findBySessionId(sessionId);
    }

    return null;
  }

  static async updateUser(userId: string, data: Partial<Pick<User, 'metadata' | 'upgradedAt'>>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

  /**
   * Update cached metadata for a user
   */
  static async updateCachedMetadata(userId: string, metadata: Record<string, unknown>): Promise<User> {
    return await this.updateUser(userId, {
      metadata: metadata,
    });
  }

  static async deleteUser(userId: string): Promise<void> {
    // This will cascade delete related records due to foreign key constraints
    await db
      .delete(users)
      .where(eq(users.id, userId));
  }

  static async getUserRoles(userId: string): Promise<typeof userRoles.$inferSelect[]> {
    return await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
  }

  static async hasAnyRole(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.length > 0;
  }

  static async isAnonymous(user: User): Promise<boolean> {
    return !user.clerkUserId && !!user.sessionId;
  }

  static async isAuthenticated(user: User): Promise<boolean> {
    return !!user.clerkUserId;
  }

  /**
   * Create or get user (called on demographics save OR first vote)
   * This ensures user exists with demographics if provided
   */
  static async ensureUserExists(params: {
    clerkUserId?: string;
    sessionId?: string;
    demographics?: {
      ageGroupId?: number;
      genderId?: number;
      ethnicityId?: number;
      politicalPartyId?: number;
    };
  }): Promise<User> {
    // Check if user exists
    let existingUser: User | null = null;

    if (params.clerkUserId) {
      existingUser = await this.findByClerkId(params.clerkUserId);
    } else if (params.sessionId) {
      existingUser = await this.findBySessionId(params.sessionId);
    } else {
      throw new Error("Either clerkUserId or sessionId must be provided");
    }

    // If user exists, optionally save demographics and return
    if (existingUser) {
      if (params.demographics) {
        await this.saveDemographics(existingUser.id, params.demographics);
      }
      return existingUser;
    }

    // Create new user
    const newUser = await this.createUser({
      clerkUserId: params.clerkUserId,
      sessionId: params.sessionId,
    });

    // Save demographics if provided
    if (params.demographics) {
      await this.saveDemographics(newUser.id, params.demographics);
    }

    return newUser;
  }

  /**
   * Search users by email or Clerk ID (for autocomplete)
   * Returns authenticated users with their current roles
   */
  static async searchUsers(query: string, limit: number = 10): Promise<Array<{
    id: string;
    clerkUserId?: string;
    email?: string;
    displayName?: string;
    currentRoles: Array<{ role: string; pollId?: string }>;
  }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchQuery = query.trim().toLowerCase();

    // Get all authenticated users
    const allUsers = await db
      .select({
        id: users.id,
        clerkUserId: users.clerkUserId,
        sessionId: users.sessionId,
        metadata: users.metadata,
      })
      .from(users)
      .where(sql`${users.clerkUserId} IS NOT NULL`)
      .limit(100); // Get more for filtering

    // Get all user roles
    const allRoles = await db
      .select()
      .from(userRoles);

    // Create role map
    const roleMap = new Map<string, Array<{ role: string; pollId?: string }>>();
    allRoles.forEach(role => {
      const existing = roleMap.get(role.userId) || [];
      existing.push({ role: role.role, pollId: role.pollId || undefined });
      roleMap.set(role.userId, existing);
    });

    // Filter and map users based on cached profile data
    const matchedUsers = allUsers
      .map(user => {
        const metadata = user.metadata as { profileData?: {
          primaryEmailAddress?: { emailAddress: string };
          fullName?: string;
          firstName?: string;
          lastName?: string;
        }} | null;

        const email = metadata?.profileData?.primaryEmailAddress?.emailAddress || "";
        const fullName = metadata?.profileData?.fullName || "";
        const firstName = metadata?.profileData?.firstName || "";
        const lastName = metadata?.profileData?.lastName || "";
        const clerkId = user.clerkUserId || "";

        // Check if query matches email, name, or Clerk ID
        const matches =
          email.toLowerCase().includes(searchQuery) ||
          fullName.toLowerCase().includes(searchQuery) ||
          firstName.toLowerCase().includes(searchQuery) ||
          lastName.toLowerCase().includes(searchQuery) ||
          clerkId.toLowerCase().includes(searchQuery);

        if (!matches) return null;

        return {
          id: user.id,
          clerkUserId: user.clerkUserId || undefined,
          email: email || undefined,
          displayName: fullName || (firstName && lastName ? `${firstName} ${lastName}` : firstName) || email || "Unknown User",
          currentRoles: roleMap.get(user.id) || [],
        };
      })
      .filter((user): user is NonNullable<typeof user> => user !== null)
      .slice(0, limit);

    return matchedUsers;
  }

  /**
   * Save user demographics (one-time only - cannot be updated after initial submission)
   */
  private static async saveDemographics(
    userId: string,
    demographics: {
      ageGroupId?: number;
      genderId?: number;
      ethnicityId?: number;
      politicalPartyId?: number;
    }
  ): Promise<void> {
    // Demographics are immutable - only INSERT, no updates allowed
    // If conflict occurs, the existing demographics are preserved
    await db
      .insert(userDemographics)
      .values({
        userId,
        ageGroupId: demographics.ageGroupId || null,
        genderId: demographics.genderId || null,
        ethnicityId: demographics.ethnicityId || null,
        politicalPartyId: demographics.politicalPartyId || null,
      })
      .onConflictDoNothing({ target: userDemographics.userId });
  }

  /**
   * Assign poll_creator role to user (system-wide)
   */
  static async assignPollCreatorRole(userId: string): Promise<void> {
    // Check if user already has poll_creator role
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'poll_creator'),
          isNull(userRoles.pollId)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      throw new Error("User already has poll_creator role");
    }

    // Create poll_creator role (pollId is null for global roles)
    await db.insert(userRoles).values({
      userId,
      role: 'poll_creator',
      pollId: null,
    });
  }

  /**
   * Revoke poll_creator role from user
   */
  static async revokePollCreatorRole(userId: string): Promise<void> {
    const result = await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'poll_creator'),
          isNull(userRoles.pollId)
        )
      )
      .returning({ id: userRoles.id });

    if (result.length === 0) {
      throw new Error("User does not have poll_creator role");
    }
  }

  /**
   * Check if user can create polls
   * Returns true if user has: system_admin, poll_creator, or poll_manager role
   */
  static async canUserCreatePolls(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);

    // System admin can create polls
    if (roles.some(r => r.role === 'system_admin')) {
      return true;
    }

    // Poll creator can create polls
    if (roles.some(r => r.role === 'poll_creator')) {
      return true;
    }

    // Poll managers can create polls
    if (roles.some(r => r.role === 'poll_manager')) {
      return true;
    }

    return false;
  }

  /**
   * Assign poll_owner role to user for a specific poll
   * Called automatically when user creates a poll
   */
  static async assignPollOwnerRole(userId: string, pollId: string): Promise<void> {
    // Check if user already has owner role for this poll
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.role, 'poll_owner'),
          eq(userRoles.pollId, pollId)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      // User already owns this poll
      return;
    }

    // Create poll_owner role for this specific poll
    await db.insert(userRoles).values({
      userId,
      role: 'poll_owner',
      pollId,
    });
  }
}