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
import { AIService } from "@/lib/services/ai-service";

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

/**
 * Fetch insight with poll details for modal display
 */
export async function getInsightWithPollDetailsAction(userId: string, pollId: string) {
  try {
    const insight = await getUserPollInsight(userId, pollId);

    if (!insight) {
      return { success: false, error: "Insight not found" };
    }

    // Fetch poll details
    const { getPollById } = await import("@/db/queries/polls-queries");
    const poll = await getPollById(pollId);

    if (!poll) {
      return { success: false, error: "Poll not found" };
    }

    return {
      success: true,
      data: {
        insight,
        poll: {
          question: poll.question,
          slug: poll.slug,
        }
      }
    };
  } catch (error) {
    console.error("Error fetching insight with poll details:", error);
    return { success: false, error: "Failed to fetch insight details" };
  }
}

/**
 * Generate insight using AIService and automatically save to database
 * This combines generation + persistence in one atomic operation (server-side)
 */
export async function generateAndSaveInsightAction(userId: string, pollId: string) {
  try {
    // Generate insight using AIService (same as old UI)
    const generated = await AIService.generatePersonalInsight(userId, pollId);

    // Save to database immediately
    const saveResult = await upsertUserPollInsight(userId, pollId, generated.title, generated.body);

    revalidatePath("/polls");

    return {
      success: true,
      data: {
        title: saveResult.title,
        body: saveResult.body
      }
    };
  } catch (error) {
    console.error("Error generating and saving insight:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate insight"
    };
  }
}

// Artifact Collection Actions

export async function getUserArtifactCollectionAction(userId: string) {
  try {
    const { getUserArtifactCollection } = await import("@/db/queries/user-poll-insights-queries");
    const artifacts = await getUserArtifactCollection(userId);
    return { success: true, data: artifacts };
  } catch (error) {
    console.error("Error fetching user artifact collection:", error);
    return { success: false, error: "Failed to fetch artifact collection" };
  }
}

export async function markArtifactAsSeenAction(userId: string, pollId: string) {
  try {
    const { markArtifactAsSeen } = await import("@/db/queries/user-poll-insights-queries");
    await markArtifactAsSeen(userId, pollId);
    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error marking artifact as seen:", error);
    return { success: false, error: "Failed to mark artifact as seen" };
  }
}

export async function getUserArtifactCountAction(userId: string) {
  try {
    const { getUserArtifactCount } = await import("@/db/queries/user-poll-insights-queries");
    const count = await getUserArtifactCount(userId);
    return { success: true, data: count };
  } catch (error) {
    console.error("Error getting user artifact count:", error);
    return { success: false, error: "Failed to get artifact count" };
  }
}

export async function updateArtifactRarityAction(userId: string, pollId: string, rarity: 'common' | 'rare' | 'legendary') {
  try {
    const { updateArtifactRarity } = await import("@/db/queries/user-poll-insights-queries");
    await updateArtifactRarity(userId, pollId, rarity);
    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error updating artifact rarity:", error);
    return { success: false, error: "Failed to update artifact rarity" };
  }
}

export async function getNewArtifactsAction(userId: string) {
  try {
    const { getNewArtifacts } = await import("@/db/queries/user-poll-insights-queries");
    const newArtifacts = await getNewArtifacts(userId);
    return { success: true, data: newArtifacts };
  } catch (error) {
    console.error("Error fetching new artifacts:", error);
    return { success: false, error: "Failed to fetch new artifacts" };
  }
}