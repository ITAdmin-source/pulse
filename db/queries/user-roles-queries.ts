import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db";
import { userRoles, type UserRole, type NewUserRole } from "../schema/user-roles";

export async function getUserRoleById(id: string): Promise<UserRole | undefined> {
  const result = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.id, id))
    .limit(1);

  return result[0];
}

export async function getUserRolesByUserId(userId: string): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
}

export async function getUserRolesByPollId(pollId: string): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.pollId, pollId));
}

export async function getUserRoleByUserAndPoll(userId: string, pollId: string | null): Promise<UserRole[]> {
  const conditions = [eq(userRoles.userId, userId)];

  if (pollId === null) {
    // For global roles, pollId should be null
    conditions.push(isNull(userRoles.pollId));
  } else {
    conditions.push(eq(userRoles.pollId, pollId));
  }

  return await db
    .select()
    .from(userRoles)
    .where(and(...conditions));
}

export async function getAllUserRoles(): Promise<UserRole[]> {
  return await db
    .select()
    .from(userRoles);
}

export async function createUserRole(data: NewUserRole): Promise<UserRole> {
  const result = await db
    .insert(userRoles)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUserRole(id: string, data: Partial<NewUserRole>): Promise<UserRole | undefined> {
  const result = await db
    .update(userRoles)
    .set(data)
    .where(eq(userRoles.id, id))
    .returning();

  return result[0];
}

export async function deleteUserRole(id: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.id, id))
    .returning({ id: userRoles.id });

  return result.length > 0;
}

export async function deleteUserRolesByUserId(userId: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.userId, userId))
    .returning({ id: userRoles.id });

  return result.length > 0;
}

export async function deleteUserRolesByPollId(pollId: string): Promise<boolean> {
  const result = await db
    .delete(userRoles)
    .where(eq(userRoles.pollId, pollId))
    .returning({ id: userRoles.id });

  return result.length > 0;
}

/**
 * Transfer poll ownership from current owner to new owner
 * Optionally makes previous owner a manager
 */
export async function transferPollOwnership(
  pollId: string,
  currentOwnerId: string,
  newOwnerId: string,
  makePreviousOwnerManager: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify current owner exists
    const currentOwnerRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, currentOwnerId),
          eq(userRoles.role, 'poll_owner'),
          eq(userRoles.pollId, pollId)
        )
      )
      .limit(1);

    if (currentOwnerRole.length === 0) {
      return { success: false, error: "Current user is not the poll owner" };
    }

    // Verify new owner is not the same as current owner
    if (currentOwnerId === newOwnerId) {
      return { success: false, error: "Cannot transfer ownership to yourself" };
    }

    // Check if new owner already has a role for this poll
    const existingNewOwnerRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, newOwnerId),
          eq(userRoles.pollId, pollId)
        )
      );

    // Execute transfer in a transaction
    await db.transaction(async (tx) => {
      // Remove current owner's poll_owner role
      await tx
        .delete(userRoles)
        .where(eq(userRoles.id, currentOwnerRole[0].id));

      // Remove new owner's existing roles for this poll (if any)
      if (existingNewOwnerRole.length > 0) {
        await tx
          .delete(userRoles)
          .where(
            and(
              eq(userRoles.userId, newOwnerId),
              eq(userRoles.pollId, pollId)
            )
          );
      }

      // Add new owner role
      await tx
        .insert(userRoles)
        .values({
          userId: newOwnerId,
          role: 'poll_owner',
          pollId,
        });

      // Optionally make previous owner a manager
      if (makePreviousOwnerManager) {
        await tx
          .insert(userRoles)
          .values({
            userId: currentOwnerId,
            role: 'poll_manager',
            pollId,
          });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error transferring poll ownership:", error);
    return { success: false, error: "Failed to transfer ownership" };
  }
}