import { db } from "@/db/db";
import { userPollInsights } from "@/db/schema";
import { sql } from "drizzle-orm";

export type ArtifactRarity = "common" | "rare" | "legendary";

/**
 * Service for calculating and managing insight artifact rarity.
 * Rarity is based on emoji frequency across all users:
 * - Legendary: < 5% of users have this emoji
 * - Rare: 5-20% of users have this emoji
 * - Common: > 20% of users have this emoji
 */
export class ArtifactRarityService {
  /**
   * Calculate rarity for a specific emoji based on its frequency
   * across all user poll insights.
   */
  static async calculateRarity(emoji: string): Promise<ArtifactRarity> {
    try {
      // Get total count of all insights
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userPollInsights);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      if (totalCount === 0) {
        // No insights yet, default to common
        return "common";
      }

      // Count how many insights use this emoji
      // We extract emoji from the title field (format: "The Profile 🌟")
      const emojiCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userPollInsights)
        .where(sql`${userPollInsights.title} LIKE ${'%' + emoji + '%'}`);

      const emojiCount = Number(emojiCountResult[0]?.count || 0);

      // Calculate frequency percentage
      const frequency = (emojiCount / totalCount) * 100;

      // Determine rarity based on frequency thresholds
      if (frequency < 5) {
        return "legendary";
      } else if (frequency < 20) {
        return "rare";
      } else {
        return "common";
      }
    } catch (error) {
      console.error("Error calculating artifact rarity:", error);
      // Default to common on error
      return "common";
    }
  }

  /**
   * Calculate rarity for multiple emojis in a single batch operation.
   * More efficient than calling calculateRarity multiple times.
   */
  static async calculateBatchRarity(
    emojis: string[]
  ): Promise<Map<string, ArtifactRarity>> {
    const rarityMap = new Map<string, ArtifactRarity>();

    try {
      // Get total count of all insights
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userPollInsights);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      if (totalCount === 0) {
        // No insights yet, all default to common
        emojis.forEach((emoji) => rarityMap.set(emoji, "common"));
        return rarityMap;
      }

      // Calculate rarity for each emoji
      for (const emoji of emojis) {
        const emojiCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(userPollInsights)
          .where(sql`${userPollInsights.title} LIKE ${'%' + emoji + '%'}`);

        const emojiCount = Number(emojiCountResult[0]?.count || 0);
        const frequency = (emojiCount / totalCount) * 100;

        let rarity: ArtifactRarity;
        if (frequency < 5) {
          rarity = "legendary";
        } else if (frequency < 20) {
          rarity = "rare";
        } else {
          rarity = "common";
        }

        rarityMap.set(emoji, rarity);
      }

      return rarityMap;
    } catch (error) {
      console.error("Error calculating batch artifact rarity:", error);
      // Default all to common on error
      emojis.forEach((emoji) => rarityMap.set(emoji, "common"));
      return rarityMap;
    }
  }

  /**
   * Get rarity statistics across all artifacts.
   * Returns counts and percentages for each rarity tier.
   */
  static async getRarityStatistics(): Promise<{
    common: { count: number; percentage: number };
    rare: { count: number; percentage: number };
    legendary: { count: number; percentage: number };
    total: number;
  }> {
    try {
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(userPollInsights);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      if (totalCount === 0) {
        return {
          common: { count: 0, percentage: 0 },
          rare: { count: 0, percentage: 0 },
          legendary: { count: 0, percentage: 0 },
          total: 0,
        };
      }

      // Count by rarity using the artifactRarity field
      const rarityCounts = await db
        .select({
          rarity: userPollInsights.artifactRarity,
          count: sql<number>`count(*)`,
        })
        .from(userPollInsights)
        .groupBy(userPollInsights.artifactRarity);

      const stats = {
        common: { count: 0, percentage: 0 },
        rare: { count: 0, percentage: 0 },
        legendary: { count: 0, percentage: 0 },
        total: totalCount,
      };

      rarityCounts.forEach((row) => {
        const rarity = row.rarity as ArtifactRarity;
        const count = Number(row.count);
        const percentage = (count / totalCount) * 100;

        if (rarity === "common") {
          stats.common = { count, percentage };
        } else if (rarity === "rare") {
          stats.rare = { count, percentage };
        } else if (rarity === "legendary") {
          stats.legendary = { count, percentage };
        }
      });

      return stats;
    } catch (error) {
      console.error("Error getting rarity statistics:", error);
      return {
        common: { count: 0, percentage: 0 },
        rare: { count: 0, percentage: 0 },
        legendary: { count: 0, percentage: 0 },
        total: 0,
      };
    }
  }

  /**
   * Extract emoji from insight title.
   * Assumes format: "The Profile Name 🌟"
   */
  static extractEmojiFromTitle(title: string): string | null {
    // Match emoji characters (Unicode ranges for emojis)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/u;
    const match = title.match(emojiRegex);
    return match ? match[0] : null;
  }
}
