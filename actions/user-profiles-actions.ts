"use server";

import { revalidatePath } from "next/cache";
import {
  createUserProfile,
  deleteUserProfile,
  getUserProfileById,
  getAllUserProfiles,
  updateUserProfile,
} from "@/db/queries/user-profiles-queries";
import { type NewUserProfile } from "@/db/schema/user-profiles";

export async function createUserProfileAction(data: NewUserProfile) {
  try {
    const userProfile = await createUserProfile(data);
    revalidatePath("/profile");
    return { success: true, data: userProfile };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { success: false, error: "Failed to create user profile" };
  }
}

export async function updateUserProfileAction(userId: string, data: Partial<NewUserProfile>) {
  try {
    const updatedUserProfile = await updateUserProfile(userId, data);
    if (!updatedUserProfile) {
      return { success: false, error: "User profile not found" };
    }
    revalidatePath("/profile");
    return { success: true, data: updatedUserProfile };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update user profile" };
  }
}

export async function deleteUserProfileAction(userId: string) {
  try {
    const success = await deleteUserProfile(userId);
    if (!success) {
      return { success: false, error: "User profile not found" };
    }
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user profile:", error);
    return { success: false, error: "Failed to delete user profile" };
  }
}

export async function getUserProfilesAction() {
  try {
    const userProfiles = await getAllUserProfiles();
    return { success: true, data: userProfiles };
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return { success: false, error: "Failed to fetch user profiles" };
  }
}

export async function getUserProfileByIdAction(userId: string) {
  try {
    const userProfile = await getUserProfileById(userId);
    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }
    return { success: true, data: userProfile };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Failed to fetch user profile" };
  }
}