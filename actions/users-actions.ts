"use server";

import { revalidatePath } from "next/cache";
import {
  createUser,
  deleteUser,
  getUserById,
  getUserByClerkId,
  getUserBySessionId,
  getAllUsers,
  updateUser,
  upgradeUser,
} from "@/db/queries/users-queries";
import { type NewUser } from "@/db/schema/users";
import { getOrCreateSessionId } from "@/lib/utils/session";
import { UserService } from "@/lib/services/user-service";

export async function createUserAction(data: NewUser) {
  try {
    const user = await createUser(data);
    revalidatePath("/users");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserAction(id: string, data: Partial<NewUser>) {
  try {
    const updatedUser = await updateUser(id, data);
    if (!updatedUser) {
      return { success: false, error: "User not found" };
    }
    revalidatePath("/users");
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUserAction(id: string) {
  try {
    const success = await deleteUser(id);
    if (!success) {
      return { success: false, error: "User not found" };
    }
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function getUsersAction() {
  try {
    const users = await getAllUsers();
    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserByIdAction(id: string) {
  try {
    const user = await getUserById(id);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function getUserByClerkIdAction(clerkUserId: string) {
  try {
    const user = await getUserByClerkId(clerkUserId);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function getUserBySessionIdAction(sessionId: string) {
  try {
    const user = await getUserBySessionId(sessionId);
    if (!user) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching user by session ID:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function upgradeUserAction(id: string) {
  try {
    const upgradedUser = await upgradeUser(id);
    if (!upgradedUser) {
      return { success: false, error: "User not found" };
    }
    revalidatePath("/users");
    return { success: true, data: upgradedUser };
  } catch (error) {
    console.error("Error upgrading user:", error);
    return { success: false, error: "Failed to upgrade user" };
  }
}

/**
 * Get session ID for anonymous users (creates if doesn't exist)
 * This is a server action that can be called from client components
 */
export async function getSessionIdAction() {
  try {
    const sessionId = await getOrCreateSessionId();
    return { success: true, data: sessionId };
  } catch (error) {
    console.error("Error getting session ID:", error);
    return { success: false, error: "Failed to get session ID" };
  }
}

/**
 * Ensure user exists (creates if doesn't exist)
 * Used when user takes first action (vote/submit statement)
 */
export async function ensureUserExistsAction(params: {
  clerkUserId?: string;
  sessionId?: string;
}) {
  try {
    const user = await UserService.ensureUserExists(params);
    revalidatePath("/");
    return { success: true, data: user };
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return { success: false, error: "Failed to create user" };
  }
}