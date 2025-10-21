"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createUserDemographics,
  deleteUserDemographics,
  getUserDemographicsById,
  getAllUserDemographics,
  updateUserDemographics,
} from "@/db/queries/user-demographics-queries";
import { type NewUserDemographics } from "@/db/schema/user-demographics";
import { UserService } from "@/lib/services/user-service";

export async function createUserDemographicsAction(data: NewUserDemographics) {
  try {
    const userDemographics = await createUserDemographics(data);
    revalidatePath("/demographics");
    return { success: true, data: userDemographics };
  } catch (error) {
    console.error("Error creating user demographics:", error);
    return { success: false, error: "Failed to create user demographics" };
  }
}

/**
 * Update user demographics
 * PHASE 5 SECURITY: Only allows users to update their own demographics OR system admins
 */
export async function updateUserDemographicsAction(userId: string, data: Partial<NewUserDemographics>) {
  try {
    // PHASE 5 SECURITY: Authorization check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow users to update their own demographics OR system admins
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (currentUser.id !== userId && !isAdmin) {
      return { success: false, error: "Unauthorized to update user demographics" };
    }

    const updatedUserDemographics = await updateUserDemographics(userId, data);
    if (!updatedUserDemographics) {
      return { success: false, error: "User demographics not found" };
    }
    revalidatePath("/demographics");
    return { success: true, data: updatedUserDemographics };
  } catch (error) {
    console.error("Error updating user demographics:", error);
    return { success: false, error: "Failed to update user demographics" };
  }
}

/**
 * Delete user demographics
 * PHASE 5 SECURITY: Only allows users to delete their own demographics OR system admins
 */
export async function deleteUserDemographicsAction(userId: string) {
  try {
    // PHASE 5 SECURITY: Authorization check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow users to delete their own demographics OR system admins
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (currentUser.id !== userId && !isAdmin) {
      return { success: false, error: "Unauthorized to delete user demographics" };
    }

    const success = await deleteUserDemographics(userId);
    if (!success) {
      return { success: false, error: "User demographics not found" };
    }
    revalidatePath("/demographics");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user demographics:", error);
    return { success: false, error: "Failed to delete user demographics" };
  }
}

export async function getUserDemographicsAction() {
  try {
    const userDemographics = await getAllUserDemographics();
    return { success: true, data: userDemographics };
  } catch (error) {
    console.error("Error fetching user demographics:", error);
    return { success: false, error: "Failed to fetch user demographics" };
  }
}

/**
 * Get user demographics by user ID
 * Works for both anonymous and authenticated users using internal userId
 * No Clerk auth required - demographics are checked by internal userId only
 */
export async function getUserDemographicsByIdAction(userId: string) {
  try {
    const userDemographics = await getUserDemographicsById(userId);
    // Return success with null data when demographics don't exist yet
    // This distinguishes "no demographics" from "error fetching demographics"
    return { success: true, data: userDemographics || null };
  } catch (error) {
    console.error("Error fetching user demographics:", error);
    return { success: false, error: "Failed to fetch user demographics" };
  }
}

/**
 * Save demographics and ensure user exists
 * This creates the user DB record if it doesn't exist yet
 */
export async function saveDemographicsAction(params: {
  clerkUserId?: string;
  sessionId?: string;
  demographics: {
    ageGroupId?: number;
    genderId?: number;
    ethnicityId?: number;
    politicalPartyId?: number;
  };
}) {
  try {
    const { UserService } = await import("@/lib/services/user-service");

    const user = await UserService.ensureUserExists({
      clerkUserId: params.clerkUserId,
      sessionId: params.sessionId,
      demographics: params.demographics,
    });

    revalidatePath("/");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error saving demographics:", error);
    return { success: false, error: "Failed to save demographics" };
  }
}