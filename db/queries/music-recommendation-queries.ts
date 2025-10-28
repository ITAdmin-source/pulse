import { db } from "@/db/db";
import { userMusicRecommendations } from "@/db/schema/user-music-recommendations";
import { eq, and } from "drizzle-orm";
import type { NewUserMusicRecommendation, UserMusicRecommendation } from "@/db/schema/user-music-recommendations";

/**
 * Get cached music recommendation for a user-poll-insight combination
 *
 * @param userId - User's database ID
 * @param pollId - Poll ID
 * @param insightFingerprint - MD5 hash of insight content (for cache invalidation)
 * @returns Music recommendation or null if not cached
 */
export async function getMusicRecommendation(
  userId: string,
  pollId: string,
  insightFingerprint: string
): Promise<UserMusicRecommendation | null> {
  const result = await db.query.userMusicRecommendations.findFirst({
    where: and(
      eq(userMusicRecommendations.userId, userId),
      eq(userMusicRecommendations.pollId, pollId),
      eq(userMusicRecommendations.insightFingerprint, insightFingerprint)
    )
  });

  return result || null;
}

/**
 * Save music recommendation to database (upsert)
 *
 * @param data - Music recommendation data
 * @returns Saved music recommendation
 */
export async function saveMusicRecommendation(
  data: NewUserMusicRecommendation
): Promise<UserMusicRecommendation> {
  const [result] = await db
    .insert(userMusicRecommendations)
    .values(data)
    .onConflictDoUpdate({
      target: [userMusicRecommendations.userId, userMusicRecommendations.pollId],
      set: {
        songTitle: data.songTitle,
        artistName: data.artistName,
        spotifyLink: data.spotifyLink,
        appleMusicLink: data.appleMusicLink,
        thumbnailUrl: data.thumbnailUrl,
        reasoning: data.reasoning,
        insightFingerprint: data.insightFingerprint,
        generatedAt: new Date()
      }
    })
    .returning();

  return result;
}

/**
 * Get all music recommendations for a user
 *
 * @param userId - User's database ID
 * @returns Array of music recommendations
 */
export async function getUserMusicRecommendations(
  userId: string
): Promise<UserMusicRecommendation[]> {
  return await db.query.userMusicRecommendations.findMany({
    where: eq(userMusicRecommendations.userId, userId)
  });
}

/**
 * Delete music recommendation
 *
 * @param userId - User's database ID
 * @param pollId - Poll ID
 * @returns True if deleted, false if not found
 */
export async function deleteMusicRecommendation(
  userId: string,
  pollId: string
): Promise<boolean> {
  const result = await db
    .delete(userMusicRecommendations)
    .where(
      and(
        eq(userMusicRecommendations.userId, userId),
        eq(userMusicRecommendations.pollId, pollId)
      )
    )
    .returning({ userId: userMusicRecommendations.userId });

  return result.length > 0;
}
