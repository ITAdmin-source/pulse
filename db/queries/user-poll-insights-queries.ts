import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { userPollInsights, type UserPollInsight, type NewUserPollInsight } from "../schema/user-poll-insights";

export async function getUserPollInsight(userId: string, pollId: string): Promise<UserPollInsight | undefined> {
  const result = await db
    .select()
    .from(userPollInsights)
    .where(and(eq(userPollInsights.userId, userId), eq(userPollInsights.pollId, pollId)))
    .limit(1);

  return result[0];
}

export async function getAllUserPollInsights(): Promise<UserPollInsight[]> {
  return await db
    .select()
    .from(userPollInsights)
    .orderBy(desc(userPollInsights.generatedAt));
}

export async function getUserPollInsightsByUserId(userId: string): Promise<UserPollInsight[]> {
  return await db
    .select()
    .from(userPollInsights)
    .where(eq(userPollInsights.userId, userId))
    .orderBy(desc(userPollInsights.generatedAt));
}

export async function getUserPollInsightsByPollId(pollId: string): Promise<UserPollInsight[]> {
  return await db
    .select()
    .from(userPollInsights)
    .where(eq(userPollInsights.pollId, pollId))
    .orderBy(desc(userPollInsights.generatedAt));
}

export async function createUserPollInsight(data: NewUserPollInsight): Promise<UserPollInsight> {
  const result = await db
    .insert(userPollInsights)
    .values(data)
    .returning();

  return result[0];
}

export async function updateUserPollInsight(userId: string, pollId: string, data: Partial<NewUserPollInsight>): Promise<UserPollInsight | undefined> {
  const result = await db
    .update(userPollInsights)
    .set({ ...data, generatedAt: new Date() })
    .where(and(eq(userPollInsights.userId, userId), eq(userPollInsights.pollId, pollId)))
    .returning();

  return result[0];
}

export async function upsertUserPollInsight(userId: string, pollId: string, title: string, body: string): Promise<UserPollInsight> {
  const existingInsight = await getUserPollInsight(userId, pollId);

  if (existingInsight) {
    const result = await db
      .update(userPollInsights)
      .set({ title, body, generatedAt: new Date() })
      .where(and(eq(userPollInsights.userId, userId), eq(userPollInsights.pollId, pollId)))
      .returning();
    return result[0];
  } else {
    return await createUserPollInsight({ userId, pollId, title, body });
  }
}

export async function deleteUserPollInsight(userId: string, pollId: string): Promise<boolean> {
  const result = await db
    .delete(userPollInsights)
    .where(and(eq(userPollInsights.userId, userId), eq(userPollInsights.pollId, pollId)));

  return result.length > 0;
}

// Artifact Collection Queries

export async function getUserArtifactCollection(userId: string): Promise<UserPollInsight[]> {
  return await db
    .select()
    .from(userPollInsights)
    .where(eq(userPollInsights.userId, userId))
    .orderBy(desc(userPollInsights.generatedAt));
}

export async function markArtifactAsSeen(userId: string, pollId: string): Promise<void> {
  await db
    .update(userPollInsights)
    .set({
      isNewArtifact: false,
      firstSeenAt: new Date()
    })
    .where(and(
      eq(userPollInsights.userId, userId),
      eq(userPollInsights.pollId, pollId),
      eq(userPollInsights.isNewArtifact, true)
    ));
}

export async function getUserArtifactCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: desc(userPollInsights.userId) })
    .from(userPollInsights)
    .where(eq(userPollInsights.userId, userId));

  return result.length;
}

export async function updateArtifactRarity(userId: string, pollId: string, rarity: 'common' | 'rare' | 'legendary'): Promise<void> {
  await db
    .update(userPollInsights)
    .set({ artifactRarity: rarity })
    .where(and(
      eq(userPollInsights.userId, userId),
      eq(userPollInsights.pollId, pollId)
    ));
}

export async function getNewArtifacts(userId: string): Promise<UserPollInsight[]> {
  return await db
    .select()
    .from(userPollInsights)
    .where(and(
      eq(userPollInsights.userId, userId),
      eq(userPollInsights.isNewArtifact, true)
    ))
    .orderBy(desc(userPollInsights.generatedAt));
}