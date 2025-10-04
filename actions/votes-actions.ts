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
  getUserVoteCountForPoll,
  hasUserMetVotingThreshold,
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

export async function getUserVoteCountForPollAction(userId: string, pollId: string) {
  try {
    const count = await getUserVoteCountForPoll(userId, pollId);
    return { success: true, data: count };
  } catch (error) {
    console.error("Error fetching user vote count for poll:", error);
    return { success: false, error: "Failed to fetch user vote count for poll" };
  }
}

export async function hasUserMetVotingThresholdAction(userId: string, pollId: string) {
  try {
    const hasMetThreshold = await hasUserMetVotingThreshold(userId, pollId);
    return { success: true, data: hasMetThreshold };
  } catch (error) {
    console.error("Error checking voting threshold for user:", error);
    return { success: false, error: "Failed to check voting threshold" };
  }
}

export async function getStatementBatchAction(pollId: string, userId: string, batchNumber: number) {
  try {
    const { VotingService } = await import("@/lib/services/voting-service");
    const statements = await VotingService.getStatementBatch(pollId, userId, batchNumber);
    return { success: true, data: statements };
  } catch (error) {
    console.error("Error fetching statement batch:", error);
    return { success: false, error: "Failed to fetch statement batch" };
  }
}

export async function getVotingProgressAction(pollId: string, userId: string) {
  try {
    const { VotingService } = await import("@/lib/services/voting-service");
    const progress = await VotingService.getVotingProgress(pollId, userId);
    return { success: true, data: progress };
  } catch (error) {
    console.error("Error fetching voting progress:", error);
    return { success: false, error: "Failed to fetch voting progress" };
  }
}

export async function getStatementVoteDistributionAction(statementId: string) {
  try {
    const { getStatementVoteDistribution } = await import("@/db/queries/votes-queries");
    const distribution = await getStatementVoteDistribution(statementId);
    return { success: true, data: distribution };
  } catch (error) {
    console.error("Error fetching statement vote distribution:", error);
    return { success: false, error: "Failed to fetch vote distribution" };
  }
}

export async function getUserVotesForPollAction(userId: string, pollId: string) {
  try {
    const { VotingService } = await import("@/lib/services/voting-service");
    const votes = await VotingService.getUserVotesForPoll(userId, pollId);

    // Convert to lookup object for O(1) access
    const votesLookup: Record<string, -1 | 0 | 1> = {};
    votes.forEach((vote) => {
      votesLookup[vote.statementId] = vote.value as -1 | 0 | 1;
    });

    return { success: true, data: votesLookup };
  } catch (error) {
    console.error("Error fetching user votes for poll:", error);
    return { success: false, error: "Failed to fetch user votes for poll" };
  }
}