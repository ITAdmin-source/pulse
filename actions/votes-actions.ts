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
import { VotingService } from "@/lib/services/voting-service";
import { createVoteSchema } from "@/lib/validations/vote";
import { getStatementById } from "@/db/queries/statements-queries";
import { getPollByIdAction } from "@/actions/polls-actions";

/**
 * Create a new vote with comprehensive validation
 * SECURITY: Validates input, verifies statement/poll existence and status
 */
export async function createVoteAction(data: NewVote) {
  try {
    // PHASE 4 SECURITY: Validate input with Zod schema
    const validated = createVoteSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.issues.map(e => e.message).join(", ");
      return {
        success: false,
        error: `Invalid vote data: ${errors}`
      };
    }

    // PHASE 4 SECURITY: Verify statement exists
    const statement = await getStatementById(validated.data.statementId);
    if (!statement || !statement.pollId) {
      return {
        success: false,
        error: "Invalid statement"
      };
    }

    // PHASE 4 SECURITY: Verify poll exists and is published/closed (not draft)
    const pollResult = await getPollByIdAction(statement.pollId);
    if (!pollResult.success || !pollResult.data) {
      return {
        success: false,
        error: "Poll not found"
      };
    }

    const poll = pollResult.data;
    if (poll.status === "draft") {
      return {
        success: false,
        error: "Cannot vote on draft polls"
      };
    }

    // PHASE 4 SECURITY: Check if poll is closed (past endTime)
    if (poll.status === "closed" || (poll.endTime && new Date() > new Date(poll.endTime))) {
      // Allow voting within 10-minute grace period
      if (poll.endTime) {
        const endTime = new Date(poll.endTime);
        const now = new Date();
        const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
        const graceEndTime = new Date(endTime.getTime() + gracePeriodMs);

        if (now > graceEndTime) {
          return {
            success: false,
            error: "Poll is closed and grace period has expired"
          };
        }
      } else {
        return {
          success: false,
          error: "Poll is closed"
        };
      }
    }

    // Create vote using VotingService (includes clustering trigger logic)
    const vote = await VotingService.castVote(validated.data);
    revalidatePath("/polls");
    return { success: true, data: vote };
  } catch (error) {
    console.error("Error creating vote:", error);

    // Handle unique constraint violation (duplicate vote)
    if (error instanceof Error && error.message.includes("unique")) {
      return {
        success: false,
        error: "You have already voted on this statement"
      };
    }

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

/**
 * Get all votes (system-wide)
 * SECURITY: System admin only - prevents unauthorized data access
 */
export async function getVotesAction() {
  try {
    // PHASE 4 SECURITY: System admin authorization required
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');

    if (!isAdmin) {
      return { success: false, error: "System administrator access required" };
    }

    const votes = await getAllVotes();
    return { success: true, data: votes };
  } catch (error) {
    console.error("Error fetching votes:", error);
    return { success: false, error: "Failed to fetch votes" };
  }
}

/**
 * Get all votes for a specific statement
 * PHASE 5 SECURITY: Only allows system admins, poll owners, or poll managers to access statement votes
 */
export async function getVotesByStatementIdAction(statementId: string) {
  try {
    // PHASE 5 SECURITY: Authorization check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Get statement to find its poll
    const statement = await getStatementById(statementId);
    if (!statement || !statement.pollId) {
      return { success: false, error: "Statement not found" };
    }

    // Check authorization: system admin, poll owner, or poll manager
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');
    const isPollOwner = roles.some(r => r.role === 'poll_owner' && r.pollId === statement.pollId);
    const isPollManager = roles.some(r => r.role === 'poll_manager' && r.pollId === statement.pollId);

    if (!isAdmin && !isPollOwner && !isPollManager) {
      return { success: false, error: "Unauthorized access to statement votes" };
    }

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

/**
 * Get a specific vote by ID
 * PHASE 5 SECURITY: Only allows the voter themselves or system admins to access vote details
 */
export async function getVoteByIdAction(id: string) {
  try {
    // PHASE 5 SECURITY: Authorization check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const vote = await getVoteById(id);
    if (!vote) {
      return { success: false, error: "Vote not found" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Only allow voter themselves or system admins
    const roles = await UserService.getUserRoles(currentUser.id);
    const isAdmin = roles.some(r => r.role === 'system_admin');
    const isVoter = vote.userId === currentUser.id;

    if (!isVoter && !isAdmin) {
      return { success: false, error: "Unauthorized access to vote" };
    }

    return { success: true, data: vote };
  } catch (error) {
    console.error("Error fetching vote:", error);
    return { success: false, error: "Failed to fetch vote" };
  }
}

/**
 * Get a specific user's vote for a specific statement
 * PHASE 5 SECURITY: Only allows the voter themselves or system admins to access vote details
 */
export async function getVoteByUserAndStatementAction(userId: string, statementId: string) {
  try {
    // PHASE 5 SECURITY: Authorization check
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
      return { success: false, error: "Unauthorized access to user vote" };
    }

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