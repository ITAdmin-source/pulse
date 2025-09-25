"use server";

import { revalidatePath } from "next/cache";
import {
  createUserDemographics,
  deleteUserDemographics,
  getUserDemographicsById,
  getAllUserDemographics,
  updateUserDemographics,
} from "@/db/queries/user-demographics-queries";
import { type NewUserDemographics } from "@/db/schema/user-demographics";

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

export async function updateUserDemographicsAction(userId: string, data: Partial<NewUserDemographics>) {
  try {
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

export async function deleteUserDemographicsAction(userId: string) {
  try {
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

export async function getUserDemographicsByIdAction(userId: string) {
  try {
    const userDemographics = await getUserDemographicsById(userId);
    if (!userDemographics) {
      return { success: false, error: "User demographics not found" };
    }
    return { success: true, data: userDemographics };
  } catch (error) {
    console.error("Error fetching user demographics:", error);
    return { success: false, error: "Failed to fetch user demographics" };
  }
}