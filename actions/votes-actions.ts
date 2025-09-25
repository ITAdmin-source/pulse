"use server";

import { revalidatePath } from "next/cache";
import {
  createVote,
  deleteVote,
  getVoteById,
  getAllVotes,
  getVotesByStatementId,
  getVotesByUserId,
  getVoteByUserAndStatement,
  updateVote,
  upsertVote,
} from "@/db/queries/votes-queries";
import { type NewVote } from "@/db/schema/votes";

export async function createVoteAction(data: NewVote) {
  try {
    const vote = await createVote(data);
    revalidatePath("/polls");
    return { success: true, data: vote };
  } catch (error) {
    console.error("Error creating vote:", error);
    return { success: false, error: "Failed to create vote" };
  }
}

export async function updateVoteAction(id: string, data: Partial<NewVote>) {
  try {
    const updatedVote = await updateVote(id, data);
    if (!updatedVote) {
      return { success: false, error: "Vote not found" };
    }
    revalidatePath("/polls");
    return { success: true, data: updatedVote };
  } catch (error) {
    console.error("Error updating vote:", error);
    return { success: false, error: "Failed to update vote" };
  }
}

export async function upsertVoteAction(userId: string, statementId: string, value: number) {
  try {
    // Validate vote value
    if (![-1, 0, 1].includes(value)) {
      return { success: false, error: "Invalid vote value. Must be -1, 0, or 1" };
    }

    const vote = await upsertVote(userId, statementId, value);
    revalidatePath("/polls");
    return { success: true, data: vote };
  } catch (error) {
    console.error("Error upserting vote:", error);
    return { success: false, error: "Failed to save vote" };
  }
}

export async function deleteVoteAction(id: string) {
  try {
    const success = await deleteVote(id);
    if (!success) {
      return { success: false, error: "Vote not found" };
    }
    revalidatePath("/polls");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vote:", error);
    return { success: false, error: "Failed to delete vote" };
  }
}

export async function getVotesAction() {
  try {
    const votes = await getAllVotes();
    return { success: true, data: votes };
  } catch (error) {
    console.error("Error fetching votes:", error);
    return { success: false, error: "Failed to fetch votes" };
  }
}

export async function getVotesByStatementIdAction(statementId: string) {
  try {
    const votes = await getVotesByStatementId(statementId);
    return { success: true, data: votes };
  } catch (error) {
    console.error("Error fetching votes for statement:", error);
    return { success: false, error: "Failed to fetch votes for statement" };
  }
}

export async function getVotesByUserIdAction(userId: string) {
  try {
    const votes = await getVotesByUserId(userId);
    return { success: true, data: votes };
  } catch (error) {
    console.error("Error fetching votes for user:", error);
    return { success: false, error: "Failed to fetch votes for user" };
  }
}

export async function getVoteByIdAction(id: string) {
  try {
    const vote = await getVoteById(id);
    if (!vote) {
      return { success: false, error: "Vote not found" };
    }
    return { success: true, data: vote };
  } catch (error) {
    console.error("Error fetching vote:", error);
    return { success: false, error: "Failed to fetch vote" };
  }
}

export async function getVoteByUserAndStatementAction(userId: string, statementId: string) {
  try {
    const vote = await getVoteByUserAndStatement(userId, statementId);
    return { success: true, data: vote };
  } catch (error) {
    console.error("Error fetching user vote for statement:", error);
    return { success: false, error: "Failed to fetch user vote for statement" };
  }
}