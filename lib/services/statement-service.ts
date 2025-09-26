import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { statements, polls, votes } from "@/db/schema";
import type { Statement } from "@/db/schema";
import { createStatementSchema, updateStatementSchema, approveStatementSchema, statementQuerySchema } from "@/lib/validations/statement";
import { PollService } from "./poll-service";
import { z } from "zod";

export class StatementService {
  static async createStatement(data: z.infer<typeof createStatementSchema>): Promise<Statement> {
    const validatedData = createStatementSchema.parse(data);

    // Verify poll exists and allows user statements
    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.id, validatedData.pollId))
      .limit(1);

    if (!poll[0]) {
      throw new Error("Poll not found");
    }

    if (!poll[0].allowUserStatements) {
      throw new Error("This poll does not allow user-submitted statements");
    }

    // Check if voting is still active
    const isVotingActive = await PollService.isVotingActive(poll[0]);
    if (!isVotingActive) {
      throw new Error("Cannot submit statements - voting is not active");
    }

    // Determine approval status based on poll settings
    let approved: boolean | null = null;
    let approvedAt: Date | null = null;

    if (poll[0].autoApproveStatements) {
      approved = true;
      approvedAt = new Date();
    }

    const [newStatement] = await db
      .insert(statements)
      .values({
        pollId: validatedData.pollId,
        text: validatedData.text,
        submittedBy: validatedData.submittedBy,
        approved,
        approvedAt,
      })
      .returning();

    return newStatement;
  }

  static async updateStatement(data: z.infer<typeof updateStatementSchema>): Promise<Statement> {
    const validatedData = updateStatementSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const [updatedStatement] = await db
      .update(statements)
      .set(updateData)
      .where(eq(statements.id, id))
      .returning();

    if (!updatedStatement) {
      throw new Error("Statement not found");
    }

    return updatedStatement;
  }

  static async approveStatement(data: z.infer<typeof approveStatementSchema>): Promise<Statement> {
    const validatedData = approveStatementSchema.parse(data);

    const updateData = {
      approved: validatedData.approved,
      approvedBy: validatedData.approvedBy,
      approvedAt: validatedData.approved ? new Date() : null,
    };

    const [approvedStatement] = await db
      .update(statements)
      .set(updateData)
      .where(eq(statements.id, validatedData.id))
      .returning();

    if (!approvedStatement) {
      throw new Error("Statement not found");
    }

    // If statement is rejected (approved = false), delete it
    if (!validatedData.approved) {
      await this.deleteStatement(validatedData.id);
      return approvedStatement;
    }

    return approvedStatement;
  }

  static async findById(id: string): Promise<Statement | null> {
    const [statement] = await db
      .select()
      .from(statements)
      .where(eq(statements.id, id))
      .limit(1);

    return statement || null;
  }

  static async findMany(query: {
    pollId: string;
    approved?: boolean | null;
    submittedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<Statement[]> {
    const validatedQuery = statementQuerySchema.parse({
      ...query,
      limit: query.limit || 50,
      offset: query.offset || 0,
    });

    const dbQuery = db.select().from(statements);
    const conditions = [eq(statements.pollId, validatedQuery.pollId)];

    // Filter by approval status
    if (validatedQuery.approved === true) {
      conditions.push(eq(statements.approved, true));
    } else if (validatedQuery.approved === false) {
      conditions.push(eq(statements.approved, false));
    } else if (validatedQuery.approved === null) {
      conditions.push(isNull(statements.approved));
    }

    // Filter by submitter
    if (validatedQuery.submittedBy) {
      conditions.push(eq(statements.submittedBy, validatedQuery.submittedBy));
    }

    const results = await dbQuery
      .where(and(...conditions))
      .orderBy(desc(statements.createdAt))
      .limit(validatedQuery.limit)
      .offset(validatedQuery.offset);

    return results;
  }

  static async getApprovedStatements(pollId: string): Promise<Statement[]> {
    return this.findMany({ pollId, approved: true });
  }

  static async getPendingStatements(pollId: string): Promise<Statement[]> {
    return this.findMany({ pollId, approved: null });
  }

  static async getRejectedStatements(pollId: string): Promise<Statement[]> {
    return this.findMany({ pollId, approved: false });
  }

  static async deleteStatement(id: string): Promise<void> {
    // This will cascade delete related votes
    await db
      .delete(statements)
      .where(eq(statements.id, id));
  }

  static async getStatementWithVoteCount(statementId: string): Promise<{
    statement: Statement;
    voteCount: number;
  } | null> {
    const statement = await this.findById(statementId);
    if (!statement) return null;

    // Count votes for this statement
    const voteCount = await db
      .select()
      .from(votes)
      .where(eq(votes.statementId, statementId));

    return {
      statement,
      voteCount: voteCount.length,
    };
  }

  static async canUserSubmitStatement(pollId: string): Promise<{
    canSubmit: boolean;
    reason?: string;
  }> {
    const poll = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId))
      .limit(1);

    if (!poll[0]) {
      return { canSubmit: false, reason: "Poll not found" };
    }

    if (!poll[0].allowUserStatements) {
      return { canSubmit: false, reason: "Poll does not allow user statements" };
    }

    const isVotingActive = await PollService.isVotingActive(poll[0]);
    if (!isVotingActive) {
      return { canSubmit: false, reason: "Voting is not active" };
    }

    return { canSubmit: true };
  }

  static async getModerationQueue(limit: number = 50, offset: number = 0): Promise<{
    statements: Statement[];
    total: number;
  }> {
    // Get pending statements across all polls
    const pendingStatements = await db
      .select()
      .from(statements)
      .where(isNull(statements.approved))
      .orderBy(desc(statements.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total pending statements
    const totalResult = await db
      .select()
      .from(statements)
      .where(isNull(statements.approved));

    return {
      statements: pendingStatements,
      total: totalResult.length,
    };
  }

  static async bulkApproveStatements(statementIds: string[], approvedBy: string): Promise<Statement[]> {
    if (statementIds.length === 0) return [];

    const approvedStatements = await db
      .update(statements)
      .set({
        approved: true,
        approvedBy,
        approvedAt: new Date(),
      })
      .where(inArray(statements.id, statementIds))
      .returning();

    return approvedStatements;
  }

  static async bulkRejectStatements(statementIds: string[]): Promise<void> {
    if (statementIds.length === 0) return;

    // Delete rejected statements (as per business rule)
    await db
      .delete(statements)
      .where(inArray(statements.id, statementIds));
  }
}