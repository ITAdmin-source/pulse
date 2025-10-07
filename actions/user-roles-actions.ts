"use server";

import { revalidatePath } from "next/cache";
import {
  createUserRole,
  deleteUserRole,
  deleteUserRolesByUserId,
  deleteUserRolesByPollId,
  getUserRoleById,
  getUserRolesByUserId,
  getUserRolesByPollId,
  getUserRoleByUserAndPoll,
  getAllUserRoles,
  updateUserRole,
  transferPollOwnership,
} from "@/db/queries/user-roles-queries";
import { type NewUserRole } from "@/db/schema/user-roles";

export async function createUserRoleAction(data: NewUserRole) {
  try {
    const userRole = await createUserRole(data);
    revalidatePath("/roles");
    revalidatePath("/admin");
    return { success: true, data: userRole };
  } catch (error) {
    console.error("Error creating user role:", error);
    return { success: false, error: "Failed to create user role" };
  }
}

export async function updateUserRoleAction(id: string, data: Partial<NewUserRole>) {
  try {
    const updatedUserRole = await updateUserRole(id, data);
    if (!updatedUserRole) {
      return { success: false, error: "User role not found" };
    }
    revalidatePath("/roles");
    revalidatePath("/admin");
    return { success: true, data: updatedUserRole };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function deleteUserRoleAction(id: string) {
  try {
    const success = await deleteUserRole(id);
    if (!success) {
      return { success: false, error: "User role not found" };
    }
    revalidatePath("/roles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user role:", error);
    return { success: false, error: "Failed to delete user role" };
  }
}

export async function deleteUserRolesByUserIdAction(userId: string) {
  try {
    const success = await deleteUserRolesByUserId(userId);
    if (!success) {
      return { success: false, error: "No user roles found for user" };
    }
    revalidatePath("/roles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user roles by user ID:", error);
    return { success: false, error: "Failed to delete user roles" };
  }
}

export async function deleteUserRolesByPollIdAction(pollId: string) {
  try {
    const success = await deleteUserRolesByPollId(pollId);
    if (!success) {
      return { success: false, error: "No user roles found for poll" };
    }
    revalidatePath("/roles");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user roles by poll ID:", error);
    return { success: false, error: "Failed to delete user roles" };
  }
}

export async function getUserRolesAction() {
  try {
    const userRoles = await getAllUserRoles();
    return { success: true, data: userRoles };
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return { success: false, error: "Failed to fetch user roles" };
  }
}

export async function getUserRoleByIdAction(id: string) {
  try {
    const userRole = await getUserRoleById(id);
    if (!userRole) {
      return { success: false, error: "User role not found" };
    }
    return { success: true, data: userRole };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { success: false, error: "Failed to fetch user role" };
  }
}

export async function getUserRolesByUserIdAction(userId: string) {
  try {
    const userRoles = await getUserRolesByUserId(userId);
    return { success: true, data: userRoles };
  } catch (error) {
    console.error("Error fetching user roles by user ID:", error);
    return { success: false, error: "Failed to fetch user roles" };
  }
}

export async function getUserRolesByPollIdAction(pollId: string) {
  try {
    const userRoles = await getUserRolesByPollId(pollId);
    return { success: true, data: userRoles };
  } catch (error) {
    console.error("Error fetching user roles by poll ID:", error);
    return { success: false, error: "Failed to fetch user roles" };
  }
}

export async function getUserRoleByUserAndPollAction(userId: string, pollId: string | null) {
  try {
    const userRoles = await getUserRoleByUserAndPoll(userId, pollId);
    return { success: true, data: userRoles };
  } catch (error) {
    console.error("Error fetching user role by user and poll:", error);
    return { success: false, error: "Failed to fetch user role" };
  }
}

export async function transferPollOwnershipAction(
  pollId: string,
  currentOwnerId: string,
  newOwnerId: string,
  makePreviousOwnerManager: boolean = false
) {
  try {
    const result = await transferPollOwnership(
      pollId,
      currentOwnerId,
      newOwnerId,
      makePreviousOwnerManager
    );

    if (!result.success) {
      return { success: false, error: result.error || "Failed to transfer ownership" };
    }

    revalidatePath("/roles");
    revalidatePath("/admin");
    revalidatePath(`/polls/${pollId}/manage`);
    return { success: true };
  } catch (error) {
    console.error("Error transferring poll ownership:", error);
    return { success: false, error: "Failed to transfer ownership" };
  }
}