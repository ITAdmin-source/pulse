"use server";

import { revalidatePath } from "next/cache";
import {
  createUserPollInsight,
  deleteUserPollInsight,
  getUserPollInsight,
  getAllUserPollInsights,
  getUserPollInsightsByUserId,
  getUserPollInsightsByPollId,
  updateUserPollInsight,
  upsertUserPollInsight,
} from "@/db/queries/user-poll-insights-queries";
import { type NewUserPollInsight } from "@/db/schema/user-poll-insights";

export async function createUserPollInsightAction(data: NewUserPollInsight) {
  try {
    const insight = await createUserPollInsight(data);
    revalidatePath("/polls");
    return { success: true, data: insight };
  } catch (error) {
    console.error("Error creating user poll insight:", error);
    return { success: false, error: "Failed to create user poll insight" };
  }
}

export async function updateUserPollInsightAction(userId: string, pollId: string, data: Partial<NewUserPollInsight>) {
  try {
    const updatedInsight = await updateUserPollInsight(userId, pollId, data);
    if (!updatedInsight) {
      return { success: false, error: "User poll insight not found" };
    }
    revalidatePath("/polls");
    return { success: true, data: updatedInsight };
  } catch (error) {
    console.error("Error updating user poll insight:", error);
    return { success: false, error: "Failed to update user poll insight" };
  }
}

export async function upsertUserPollInsightAction(userId: string, pollId: string, title: string, body: string) {
  try {
    const insight = await upsertUserPollInsight(userId, pollId, title, body);
    revalidatePath("/polls");
    return { success: true, data: insight };
  } catch (error) {
    console.error("Error upserting user poll insight:", error);
    return { success: false, error: "Failed to save user poll insight" };
  }
}

export async function deleteUserPollInsightAction(userId: string, pollId: string) {
  try {
    const success = await deleteUserPollInsight(userId, pollId);
    if (!success) {
      return { success: false, error: "User poll insight not found" };
    }
    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user poll insight:", error);
    return { success: false, error: "Failed to delete user poll insight" };
  }
}

export async function getUserPollInsightsAction() {
  try {
    const insights = await getAllUserPollInsights();
    return { success: true, data: insights };
  } catch (error) {
    console.error("Error fetching user poll insights:", error);
    return { success: false, error: "Failed to fetch user poll insights" };
  }
}

export async function getUserPollInsightsByUserIdAction(userId: string) {
  try {
    const insights = await getUserPollInsightsByUserId(userId);
    return { success: true, data: insights };
  } catch (error) {
    console.error("Error fetching user poll insights for user:", error);
    return { success: false, error: "Failed to fetch user poll insights for user" };
  }
}

export async function getUserPollInsightsByPollIdAction(pollId: string) {
  try {
    const insights = await getUserPollInsightsByPollId(pollId);
    return { success: true, data: insights };
  } catch (error) {
    console.error("Error fetching user poll insights for poll:", error);
    return { success: false, error: "Failed to fetch user poll insights for poll" };
  }
}

export async function getUserPollInsightAction(userId: string, pollId: string) {
  try {
    const insight = await getUserPollInsight(userId, pollId);
    return { success: true, data: insight };
  } catch (error) {
    console.error("Error fetching user poll insight:", error);
    return { success: false, error: "Failed to fetch user poll insight" };
  }
}