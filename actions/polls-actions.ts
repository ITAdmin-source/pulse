"use server";

import { revalidatePath } from "next/cache";
import {
  createPoll,
  deletePoll,
  getPollById,
  getPollBySlug,
  getAllPolls,
  getPollsByStatus,
  getPollsByCreator,
  getPublishedPolls,
  getVisiblePolls,
  getVisiblePollsWithStats,
  getActivePolls,
  updatePoll,
  publishPoll,
  unpublishPoll,
  getPollsByUserRoles,
} from "@/db/queries/polls-queries";
import { type NewPoll } from "@/db/schema/polls";
import { UserService } from "@/lib/services/user-service";

export async function createPollAction(data: NewPoll) {
  try {
    // Verify creator exists and has permission to create polls
    if (!data.createdBy) {
      return { success: false, error: "User ID required to create poll" };
    }

    // Check if user has permission to create polls
    const canCreate = await UserService.canUserCreatePolls(data.createdBy);
    if (!canCreate) {
      return {
        success: false,
        error: "You need Poll Creator permissions to create polls. Contact a system administrator."
      };
    }

    // Create the poll
    const poll = await createPoll(data);

    // Auto-assign poll_owner role to creator
    await UserService.assignPollOwnerRole(data.createdBy, poll.id);

    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return { success: true, data: poll };
  } catch (error) {
    console.error("Error creating poll:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create poll";
    return { success: false, error: errorMessage };
  }
}

export async function updatePollAction(id: string, data: Partial<NewPoll>) {
  try {
    const updatedPoll = await updatePoll(id, data);
    if (!updatedPoll) {
      return { success: false, error: "Poll not found" };
    }
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    revalidatePath(`/polls/${updatedPoll.slug}`);
    return { success: true, data: updatedPoll };
  } catch (error) {
    console.error("Error updating poll:", error);
    return { success: false, error: "Failed to update poll" };
  }
}

export async function deletePollAction(id: string) {
  try {
    const success = await deletePoll(id);
    if (!success) {
      return { success: false, error: "Poll not found" };
    }
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    return { success: true };
  } catch (error) {
    console.error("Error deleting poll:", error);
    return { success: false, error: "Failed to delete poll" };
  }
}

export async function publishPollAction(id: string) {
  try {
    const publishedPoll = await publishPoll(id);
    if (!publishedPoll) {
      return { success: false, error: "Poll not found" };
    }
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    revalidatePath(`/polls/${publishedPoll.slug}`);
    return { success: true, data: publishedPoll };
  } catch (error) {
    console.error("Error publishing poll:", error);
    return { success: false, error: "Failed to publish poll" };
  }
}

export async function unpublishPollAction(id: string) {
  try {
    const unpublishedPoll = await unpublishPoll(id);
    if (!unpublishedPoll) {
      return { success: false, error: "Poll not found" };
    }
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    revalidatePath(`/polls/${unpublishedPoll.slug}`);
    return { success: true, data: unpublishedPoll };
  } catch (error) {
    console.error("Error unpublishing poll:", error);
    return { success: false, error: "Failed to unpublish poll" };
  }
}

export async function closePollAction(id: string) {
  try {
    const { PollService } = await import("@/lib/services/poll-service");
    const closedPoll = await PollService.closePoll(id);
    revalidatePath("/polls");
    revalidatePath("/admin/polls");
    revalidatePath(`/polls/${closedPoll.slug}`);
    return { success: true, data: closedPoll };
  } catch (error) {
    console.error("Error closing poll:", error);
    return { success: false, error: "Failed to close poll" };
  }
}

export async function getPollsAction() {
  try {
    const polls = await getAllPolls();
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching polls:", error);
    return { success: false, error: "Failed to fetch polls" };
  }
}

export async function getPollByIdAction(id: string) {
  try {
    const poll = await getPollById(id);
    if (!poll) {
      return { success: false, error: "Poll not found" };
    }
    return { success: true, data: poll };
  } catch (error) {
    console.error("Error fetching poll:", error);
    return { success: false, error: "Failed to fetch poll" };
  }
}

export async function getPollBySlugAction(slug: string) {
  try {
    const poll = await getPollBySlug(slug);
    if (!poll) {
      return { success: false, error: "Poll not found" };
    }
    return { success: true, data: poll };
  } catch (error) {
    console.error("Error fetching poll by slug:", error);
    return { success: false, error: "Failed to fetch poll" };
  }
}

export async function getPollsByStatusAction(status: "draft" | "published") {
  try {
    const polls = await getPollsByStatus(status);
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching polls by status:", error);
    return { success: false, error: "Failed to fetch polls" };
  }
}

export async function getPollsByCreatorAction(createdBy: string) {
  try {
    const polls = await getPollsByCreator(createdBy);
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching polls by creator:", error);
    return { success: false, error: "Failed to fetch polls" };
  }
}

export async function getPublishedPollsAction() {
  try {
    const polls = await getVisiblePollsWithStats();
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching published polls:", error);
    return { success: false, error: "Failed to fetch published polls" };
  }
}

export async function getActivePollsAction() {
  try {
    const polls = await getActivePolls();
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching active polls:", error);
    return { success: false, error: "Failed to fetch active polls" };
  }
}

export async function getManagedPollsAction(userId: string) {
  try {
    const polls = await getPollsByUserRoles(userId);
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching managed polls:", error);
    return { success: false, error: "Failed to fetch managed polls" };
  }
}