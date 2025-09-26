import { eq, and, like, desc, inArray } from "drizzle-orm";
import { db } from "@/db/db";
import { polls, statements, votes, userRoles } from "@/db/schema";
import type { Poll } from "@/db/schema";
import { createPollSchema, updatePollSchema, publishPollSchema, pollQuerySchema } from "@/lib/validations/poll";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { z } from "zod";

export class PollService {
  static async createPoll(data: z.infer<typeof createPollSchema>, createdBy: string): Promise<Poll> {
    const validatedData = createPollSchema.parse(data);

    // Generate unique slug
    const existingSlugs = await this.getAllSlugs();
    const slug = generateUniqueSlug(validatedData.question, existingSlugs);

    const [newPoll] = await db
      .insert(polls)
      .values({
        ...validatedData,
        slug,
        createdBy,
      })
      .returning();

    // Assign poll owner role to creator
    await db
      .insert(userRoles)
      .values({
        userId: createdBy,
        role: 'poll_owner',
        pollId: newPoll.id,
      });

    return newPoll;
  }

  static async updatePoll(data: z.infer<typeof updatePollSchema>): Promise<Poll> {
    const validatedData = updatePollSchema.parse(data);
    const { id, ...updateData } = validatedData;

    const [updatedPoll] = await db
      .update(polls)
      .set(updateData)
      .where(eq(polls.id, id))
      .returning();

    if (!updatedPoll) {
      throw new Error("Poll not found");
    }

    return updatedPoll;
  }

  static async publishPoll(data: z.infer<typeof publishPollSchema>): Promise<Poll> {
    const validatedData = publishPollSchema.parse(data);

    const [publishedPoll] = await db
      .update(polls)
      .set({
        status: 'published',
        startTime: validatedData.startTime || new Date(),
        endTime: validatedData.endTime,
      })
      .where(eq(polls.id, validatedData.id))
      .returning();

    if (!publishedPoll) {
      throw new Error("Poll not found");
    }

    return publishedPoll;
  }

  static async findById(id: string): Promise<Poll | null> {
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id))
      .limit(1);

    return poll || null;
  }

  static async findBySlug(slug: string): Promise<Poll | null> {
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.slug, slug))
      .limit(1);

    return poll || null;
  }

  static async findMany(query: Partial<z.infer<typeof pollQuerySchema>> = {}): Promise<Poll[]> {
    const validatedQuery = pollQuerySchema.parse(query);

    const conditions = [];

    // Apply filters
    if (validatedQuery.status) {
      conditions.push(eq(polls.status, validatedQuery.status));
    }

    if (validatedQuery.createdBy) {
      conditions.push(eq(polls.createdBy, validatedQuery.createdBy));
    }

    if (validatedQuery.search) {
      conditions.push(like(polls.question, `%${validatedQuery.search}%`));
    }

    // Build and execute query
    if (conditions.length === 0) {
      return await db
        .select()
        .from(polls)
        .orderBy(desc(polls.createdAt))
        .limit(validatedQuery.limit)
        .offset(validatedQuery.offset);
    } else if (conditions.length === 1) {
      return await db
        .select()
        .from(polls)
        .where(conditions[0])
        .orderBy(desc(polls.createdAt))
        .limit(validatedQuery.limit)
        .offset(validatedQuery.offset);
    } else {
      return await db
        .select()
        .from(polls)
        .where(and(...conditions))
        .orderBy(desc(polls.createdAt))
        .limit(validatedQuery.limit)
        .offset(validatedQuery.offset);
    }
  }

  static async deletePoll(id: string): Promise<void> {
    // This will cascade delete statements, votes, and insights
    await db
      .delete(polls)
      .where(eq(polls.id, id));
  }

  static async getPollStatus(poll: Poll): Promise<'draft' | 'published' | 'closed'> {
    if (poll.status === 'draft') {
      return 'draft';
    }

    const now = new Date();

    // If poll has an end time and it's past, poll is closed
    if (poll.endTime && now > poll.endTime) {
      return 'closed';
    }

    // If poll has a start time and it's not reached yet, treat as draft
    if (poll.startTime && now < poll.startTime) {
      return 'draft';
    }

    return 'published';
  }

  static async isVotingActive(poll: Poll): Promise<boolean> {
    const status = await this.getPollStatus(poll);
    return status === 'published';
  }

  static async canUserSubmitStatements(poll: Poll): Promise<boolean> {
    return poll.allowUserStatements && await this.isVotingActive(poll);
  }

  static async getPollStatistics(pollId: string): Promise<{
    totalStatements: number;
    approvedStatements: number;
    pendingStatements: number;
    totalVotes: number;
    uniqueVoters: number;
  }> {
    // Get statement counts
    const allStatements = await db
      .select()
      .from(statements)
      .where(eq(statements.pollId, pollId));

    const approvedStatements = allStatements.filter(s => s.approved);
    const pendingStatements = allStatements.filter(s => s.approved === null);

    // Get vote counts for approved statements only
    const approvedStatementIds = approvedStatements.map(s => s.id);

    let totalVotes = 0;
    let uniqueVoters = 0;

    if (approvedStatementIds.length > 0) {
      const voteResults = await db
        .select()
        .from(votes)
        .where(inArray(votes.statementId, approvedStatementIds));

      totalVotes = voteResults.length;
      uniqueVoters = new Set(voteResults.map(v => v.userId)).size;
    }

    return {
      totalStatements: allStatements.length,
      approvedStatements: approvedStatements.length,
      pendingStatements: pendingStatements.length,
      totalVotes,
      uniqueVoters,
    };
  }

  private static async getAllSlugs(): Promise<string[]> {
    const results = await db
      .select({ slug: polls.slug })
      .from(polls);

    return results.map(r => r.slug);
  }
}