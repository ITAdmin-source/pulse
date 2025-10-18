"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  createStatement,
  deleteStatement,
  getStatementById,
  getAllStatements,
  getStatementsByPollId,
  getApprovedStatementsByPollId,
  getAllPendingStatements,
  updateStatement,
} from "@/db/queries/statements-queries";
import { type NewStatement } from "@/db/schema/statements";
import { UserService } from "@/lib/services/user-service";
import { z } from "zod";
import { getPollByIdAction } from "@/actions/polls-actions";

// PHASE 4 SECURITY: Zod validation schema for statement creation
const createStatementSchema = z.object({
  pollId: z.string().uuid("Invalid poll ID"),
  text: z.string()
    .min(10, "Statement must be at least 10 characters")
    .max(500, "Statement must not exceed 500 characters")
    .trim(),
  submittedBy: z.string().uuid("Invalid user ID").optional().nullable(),
  approved: z.boolean().optional().nullable(),
  approvedBy: z.string().uuid("Invalid approver ID").optional().nullable(),
});

/**
 * Create a new statement with comprehensive validation
 * SECURITY: Validates input, sanitizes content, verifies poll status
 */
export async function createStatementAction(data: NewStatement) {
  try {
    // PHASE 4 SECURITY: Validate input with Zod schema
    const validated = createStatementSchema.safeParse(data);
    if (!validated.success) {
      const errors = validated.error.issues.map(e => e.message).join(", ");
      return {
        success: false,
        error: `Invalid statement data: ${errors}`
      };
    }

    // PHASE 4 SECURITY: Verify poll exists and allows user statements
    const pollResult = await getPollByIdAction(validated.data.pollId);
    if (!pollResult.success || !pollResult.data) {
      return {
        success: false,
        error: "Poll not found"
      };
    }

    const poll = pollResult.data;

    // Check if poll allows user-submitted statements
    if (!poll.allowUserStatements) {
      return {
        success: false,
        error: "This poll does not accept user-submitted statements"
      };
    }

    // Check if poll is published (can't add statements to draft/closed polls)
    if (poll.status !== "published") {
      return {
        success: false,
        error: "Cannot submit statements to this poll"
      };
    }

    // PHASE 4 SECURITY: Sanitize text content (remove HTML, trim whitespace)
    const sanitizedText = validated.data.text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Create statement with sanitized content
    const statement = await createStatement({
      ...validated.data,
      text: sanitizedText,
    });

    revalidatePath("/polls");
    revalidateTag("statements"); // Invalidate statements cache
    return { success: true, data: statement };
  } catch (error) {
    console.error("Error creating statement:", error);
    return { success: false, error: "Failed to create statement" };
  }
}

export async function updateStatementAction(id: string, data: Partial<NewStatement>) {
  try {
    // AUTHORIZATION: Only poll owner, poll manager, or system admin can update statements
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Get the statement to find its poll
    const statement = await getStatementById(id);
    if (!statement || !statement.pollId) {
      return { success: false, error: "Statement not found" };
    }

    // Get user's roles to check permissions
    const roles = await UserService.getUserRoles(currentUser.id);
    const isSystemAdmin = roles.some(r => r.role === 'system_admin');
    const isPollOwner = roles.some(r => r.role === 'poll_owner' && r.pollId === statement.pollId);
    const isPollManager = roles.some(r => r.role === 'poll_manager' && r.pollId === statement.pollId);

    if (!isSystemAdmin && !isPollOwner && !isPollManager) {
      return { success: false, error: "You do not have permission to modify this statement" };
    }

    const updatedStatement = await updateStatement(id, data);
    if (!updatedStatement) {
      return { success: false, error: "Statement not found" };
    }
    revalidatePath("/polls");
    revalidateTag("statements"); // Invalidate statements cache
    return { success: true, data: updatedStatement };
  } catch (error) {
    console.error("Error updating statement:", error);
    return { success: false, error: "Failed to update statement" };
  }
}

export async function deleteStatementAction(id: string) {
  try {
    // AUTHORIZATION: Only poll owner, poll manager, or system admin can delete statements
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Get the statement to find its poll
    const statement = await getStatementById(id);
    if (!statement || !statement.pollId) {
      return { success: false, error: "Statement not found" };
    }

    // Get user's roles to check permissions
    const roles = await UserService.getUserRoles(currentUser.id);
    const isSystemAdmin = roles.some(r => r.role === 'system_admin');
    const isPollOwner = roles.some(r => r.role === 'poll_owner' && r.pollId === statement.pollId);
    const isPollManager = roles.some(r => r.role === 'poll_manager' && r.pollId === statement.pollId);

    if (!isSystemAdmin && !isPollOwner && !isPollManager) {
      return { success: false, error: "You do not have permission to delete this statement" };
    }

    const success = await deleteStatement(id);
    if (!success) {
      return { success: false, error: "Statement not found" };
    }
    revalidatePath("/polls");
    revalidateTag("statements"); // Invalidate statements cache
    return { success: true };
  } catch (error) {
    console.error("Error deleting statement:", error);
    return { success: false, error: "Failed to delete statement" };
  }
}

export async function getStatementsAction() {
  try {
    const statements = await getAllStatements();
    return { success: true, data: statements };
  } catch (error) {
    console.error("Error fetching statements:", error);
    return { success: false, error: "Failed to fetch statements" };
  }
}

export async function getPendingStatementsAction() {
  try {
    const statements = await getAllPendingStatements();
    return { success: true, data: statements };
  } catch (error) {
    console.error("Error fetching pending statements:", error);
    return { success: false, error: "Failed to fetch pending statements" };
  }
}

export async function getStatementsByPollIdAction(pollId: string) {
  try {
    const statements = await getStatementsByPollId(pollId);
    return { success: true, data: statements };
  } catch (error) {
    console.error("Error fetching statements for poll:", error);
    return { success: false, error: "Failed to fetch statements for poll" };
  }
}

export async function getApprovedStatementsByPollIdAction(pollId: string) {
  const timestamp = new Date().toISOString();
  console.log(`[ACTION ${timestamp}] getApprovedStatementsByPollIdAction called for poll:`, pollId);

  try {
    const startTime = performance.now();
    const statements = await getApprovedStatementsByPollId(pollId);
    const duration = performance.now() - startTime;

    console.log(`[ACTION ${timestamp}] Query completed in ${duration.toFixed(2)}ms, found ${statements.length} statements`);
    return { success: true, data: statements };
  } catch (error) {
    console.error(`[ACTION ${timestamp}] Error fetching approved statements for poll:`, error);
    return { success: false, error: "Failed to fetch approved statements for poll" };
  }
}

export async function getStatementByIdAction(id: string) {
  try {
    const statement = await getStatementById(id);
    if (!statement) {
      return { success: false, error: "Statement not found" };
    }
    return { success: true, data: statement };
  } catch (error) {
    console.error("Error fetching statement:", error);
    return { success: false, error: "Failed to fetch statement" };
  }
}

export async function rejectStatementAction(id: string) {
  try {
    // AUTHORIZATION: Only poll owner, poll manager, or system admin can reject statements
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Get the statement to find its poll
    const statement = await getStatementById(id);
    if (!statement || !statement.pollId) {
      return { success: false, error: "Statement not found" };
    }

    // Get user's roles to check permissions
    const roles = await UserService.getUserRoles(currentUser.id);
    const isSystemAdmin = roles.some(r => r.role === 'system_admin');
    const isPollOwner = roles.some(r => r.role === 'poll_owner' && r.pollId === statement.pollId);
    const isPollManager = roles.some(r => r.role === 'poll_manager' && r.pollId === statement.pollId);

    if (!isSystemAdmin && !isPollOwner && !isPollManager) {
      return { success: false, error: "You do not have permission to reject this statement" };
    }

    const success = await deleteStatement(id);
    if (!success) {
      return { success: false, error: "Statement not found" };
    }
    revalidatePath("/polls");
    revalidateTag("statements"); // Invalidate statements cache
    return { success: true };
  } catch (error) {
    console.error("Error rejecting statement:", error);
    return { success: false, error: "Failed to reject statement" };
  }
}

export async function approveStatementAction(id: string) {
  try {
    // AUTHORIZATION: Only poll owner, poll manager, or system admin can approve statements
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return { success: false, error: "Authentication required" };
    }

    const currentUser = await UserService.findByClerkId(clerkUserId);
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Get the statement to find its poll
    const statement = await getStatementById(id);
    if (!statement || !statement.pollId) {
      return { success: false, error: "Statement not found" };
    }

    // Get user's roles to check permissions
    const roles = await UserService.getUserRoles(currentUser.id);
    const isSystemAdmin = roles.some(r => r.role === 'system_admin');
    const isPollOwner = roles.some(r => r.role === 'poll_owner' && r.pollId === statement.pollId);
    const isPollManager = roles.some(r => r.role === 'poll_manager' && r.pollId === statement.pollId);

    if (!isSystemAdmin && !isPollOwner && !isPollManager) {
      return { success: false, error: "You do not have permission to approve this statement" };
    }

    const updatedStatement = await updateStatement(id, { approved: true });
    if (!updatedStatement) {
      return { success: false, error: "Statement not found" };
    }
    revalidatePath("/polls");
    revalidateTag("statements"); // Invalidate statements cache
    return { success: true, data: updatedStatement };
  } catch (error) {
    console.error("Error approving statement:", error);
    return { success: false, error: "Failed to approve statement" };
  }
}