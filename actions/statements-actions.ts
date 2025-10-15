"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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

export async function createStatementAction(data: NewStatement) {
  try {
    const statement = await createStatement(data);
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