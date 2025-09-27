import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { users, userRoles } from "@/db/schema";
import type { User } from "@/db/schema";
import { createUserSchema, upgradeUserSchema } from "@/lib/validations/user";
import { z } from "zod";

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
        upgradedAt: new Date(),
      })
      .where(eq(users.id, anonymousUser.id))
      .returning();

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
   */
  static async getOrCreateUserByClerkId(clerkUserId: string): Promise<User> {
    // Try to find existing user by Clerk ID
    let user = await this.findByClerkId(clerkUserId);

    if (!user) {
      // Create new authenticated user (usually from webhook)
      user = await this.createUser({ clerkUserId });
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

  static async updateUser(userId: string, data: Partial<Pick<User, 'metadata'>>): Promise<User> {
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
}