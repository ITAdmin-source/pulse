"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
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
import { UserService } from "@/lib/services/user-service";

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

/**
 * @deprecated Votes are immutable and cannot be updated. Use createVoteAction instead.
 * This function is kept for backward compatibility but should not be used.
 */
export async function updateVoteAction(id: string, data: Partial<NewVote>) {
  console.warn("DEPRECATED: updateVoteAction called. Votes are immutable and cannot be updated.");
  return { success: false, error: "Votes are immutable and cannot be updated" };
}

/**
 * @deprecated Use createVoteAction instead. Votes are immutable and cannot be updated.
 * This function is kept for backward compatibility but should not be used.
 */
export async function upsertVoteAction(userId: string, statementId: string, value: number) {
  console.warn("DEPRECATED: upsertVoteAction called. Votes are immutable - use createVoteAction instead.");
  return { success: false, error: "Votes are immutable. Use createVoteAction to create new votes only." };
}

export async function deleteVoteAction(id: string) {
  try {
    // CRITICAL: Votes are immutable per business rules
    // Only allow system admins to delete votes (emergency operations only)
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow system admins to delete votes
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (!isAdmin) {
      return { success: false, error: "Only system administrators can delete votes" };
    }

    // Log this critical operation
    console.warn(`ADMIN VOTE DELETION: Admin ${currentUser.id} deleted vote ${id}`);

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
    // ADD PERMISSION CHECK: Only allow users to access their own votes OR system admins
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow users to access their own votes OR system admins
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (currentUser.id !== userId && !isAdmin) {
      return { success: false, error: "Unauthorized access to user votes" };
    }

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
    // ADD PERMISSION CHECK: Only allow users to access their own vote counts OR system admins
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow users to access their own data OR system admins
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (currentUser.id !== userId && !isAdmin) {
      return { success: false, error: "Unauthorized access to user vote data" };
    }

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