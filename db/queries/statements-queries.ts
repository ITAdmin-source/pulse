import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { statements, type Statement, type NewStatement } from "../schema/statements";

export async function getStatementById(id: string): Promise<Statement | undefined> {
  const result = await db
    .select()
    .from(statements)
    .where(eq(statements.id, id))
    .limit(1);

  return result[0];
}

export async function getAllStatements(): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .orderBy(desc(statements.createdAt));
}

export async function getStatementsByPollId(pollId: string): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .where(eq(statements.pollId, pollId))
    .orderBy(desc(statements.createdAt));
}

export async function getApprovedStatementsByPollId(pollId: string): Promise<Statement[]> {
  return await db
    .select()
    .from(statements)
    .where(and(eq(statements.pollId, pollId), eq(statements.isApproved, true)))
    .orderBy(desc(statements.createdAt));
}

export async function createStatement(data: NewStatement): Promise<Statement> {
  const result = await db
    .insert(statements)
    .values(data)
    .returning();

  return result[0];
}

export async function updateStatement(id: string, data: Partial<NewStatement>): Promise<Statement | undefined> {
  const result = await db
    .update(statements)
    .set(data)
    .where(eq(statements.id, id))
    .returning();

  return result[0];
}

export async function deleteStatement(id: string): Promise<boolean> {
  const result = await db
    .delete(statements)
    .where(eq(statements.id, id));

  return result.length > 0;
}