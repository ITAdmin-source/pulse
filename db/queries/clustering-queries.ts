/**
 * Clustering Queries
 * Database queries for opinion clustering data
 */

import { db } from "@/db/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  pollClusteringMetadata,
  userClusteringPositions,
  statementClassifications,
  userDemographics,
  ageGroups,
  genders,
  ethnicities,
  politicalParties,
  type PollClusteringMetadata,
  type UserClusteringPosition,
  type StatementClassification,
} from "@/db/schema";

/**
 * Get clustering metadata for a poll
 */
export async function getPollClusteringMetadata(
  pollId: string
): Promise<PollClusteringMetadata | null> {
  const result = await db
    .select()
    .from(pollClusteringMetadata)
    .where(eq(pollClusteringMetadata.pollId, pollId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get all user positions for a poll
 */
export async function getUserClusteringPositions(
  pollId: string
): Promise<UserClusteringPosition[]> {
  return await db
    .select()
    .from(userClusteringPositions)
    .where(eq(userClusteringPositions.pollId, pollId));
}

/**
 * Get a specific user's position in a poll
 */
export async function getUserClusteringPosition(
  pollId: string,
  userId: string
): Promise<UserClusteringPosition | null> {
  const result = await db
    .select()
    .from(userClusteringPositions)
    .where(
      and(
        eq(userClusteringPositions.pollId, pollId),
        eq(userClusteringPositions.userId, userId)
      )
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get statement classifications for a poll
 */
export async function getStatementClassifications(
  pollId: string
): Promise<StatementClassification[]> {
  return await db
    .select()
    .from(statementClassifications)
    .where(eq(statementClassifications.pollId, pollId));
}

/**
 * Get specific statement classifications by type
 */
export async function getStatementClassificationsByType(
  pollId: string,
  type: "positive_consensus" | "negative_consensus" | "divisive" | "bridge" | "normal"
): Promise<StatementClassification[]> {
  return await db
    .select()
    .from(statementClassifications)
    .where(
      and(
        eq(statementClassifications.pollId, pollId),
        eq(statementClassifications.classificationType, type)
      )
    );
}

/**
 * Get all consensus statements (positive + negative)
 */
export async function getConsensusStatements(
  pollId: string
): Promise<StatementClassification[]> {
  return await db
    .select()
    .from(statementClassifications)
    .where(
      and(
        eq(statementClassifications.pollId, pollId),
        inArray(statementClassifications.classificationType, [
          "positive_consensus",
          "negative_consensus",
        ])
      )
    );
}

/**
 * Get divisive statements
 */
export async function getDivisiveStatements(
  pollId: string
): Promise<StatementClassification[]> {
  return await db
    .select()
    .from(statementClassifications)
    .where(
      and(
        eq(statementClassifications.pollId, pollId),
        eq(statementClassifications.classificationType, "divisive")
      )
    );
}

/**
 * Get bridge statements
 */
export async function getBridgeStatements(
  pollId: string
): Promise<StatementClassification[]> {
  return await db
    .select()
    .from(statementClassifications)
    .where(
      and(
        eq(statementClassifications.pollId, pollId),
        eq(statementClassifications.classificationType, "bridge")
      )
    );
}

/**
 * Get users in a specific coarse group
 */
export async function getUsersInCoarseGroup(
  pollId: string,
  groupId: number
): Promise<UserClusteringPosition[]> {
  return await db
    .select()
    .from(userClusteringPositions)
    .where(
      and(
        eq(userClusteringPositions.pollId, pollId),
        eq(userClusteringPositions.coarseGroupId, groupId)
      )
    );
}

/**
 * Get complete clustering data for a poll (optimized single query)
 */
export async function getCompleteClusteringData(pollId: string): Promise<{
  metadata: PollClusteringMetadata | null;
  userPositions: UserClusteringPosition[];
  statementClassifications: StatementClassification[];
} | null> {
  // Get metadata first to check if clustering exists
  const metadata = await getPollClusteringMetadata(pollId);

  if (!metadata) {
    return null;
  }

  // Fetch user positions and classifications in parallel
  const [userPositions, statementClassifications] = await Promise.all([
    getUserClusteringPositions(pollId),
    getStatementClassifications(pollId),
  ]);

  return {
    metadata,
    userPositions,
    statementClassifications,
  };
}

/**
 * Delete all clustering data for a poll
 * Used when recalculating clustering
 */
export async function deleteClusteringData(pollId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(statementClassifications)
      .where(eq(statementClassifications.pollId, pollId));

    await tx
      .delete(userClusteringPositions)
      .where(eq(userClusteringPositions.pollId, pollId));

    await tx
      .delete(pollClusteringMetadata)
      .where(eq(pollClusteringMetadata.pollId, pollId));
  });
}

/**
 * Demographic breakdown for a cluster group
 */
export interface GroupDemographics {
  coarseGroupId: number;
  totalUsers: number;
  ageGroups: Record<string, number>; // label -> count
  genders: Record<string, number>; // label -> count
  ethnicities: Record<string, number>; // label -> count
  politicalParties: Record<string, number>; // label -> count
}

/**
 * Get demographic breakdowns for all coarse groups in a poll
 */
export async function getCoarseGroupDemographics(
  pollId: string
): Promise<GroupDemographics[]> {
  // Get all user positions with their demographics
  const usersWithDemographics = await db
    .select({
      coarseGroupId: userClusteringPositions.coarseGroupId,
      userId: userClusteringPositions.userId,
      ageGroupLabel: ageGroups.label,
      genderLabel: genders.label,
      ethnicityLabel: ethnicities.label,
      politicalPartyLabel: politicalParties.label,
    })
    .from(userClusteringPositions)
    .leftJoin(
      userDemographics,
      eq(userClusteringPositions.userId, userDemographics.userId)
    )
    .leftJoin(ageGroups, eq(userDemographics.ageGroupId, ageGroups.id))
    .leftJoin(genders, eq(userDemographics.genderId, genders.id))
    .leftJoin(ethnicities, eq(userDemographics.ethnicityId, ethnicities.id))
    .leftJoin(
      politicalParties,
      eq(userDemographics.politicalPartyId, politicalParties.id)
    )
    .where(eq(userClusteringPositions.pollId, pollId));

  // Aggregate demographics by coarse group
  const groupMap = new Map<number, GroupDemographics>();

  for (const user of usersWithDemographics) {
    const groupId = user.coarseGroupId;

    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        coarseGroupId: groupId,
        totalUsers: 0,
        ageGroups: {},
        genders: {},
        ethnicities: {},
        politicalParties: {},
      });
    }

    const group = groupMap.get(groupId)!;
    group.totalUsers++;

    // Count demographics (handle nulls for users without demographics)
    if (user.ageGroupLabel) {
      group.ageGroups[user.ageGroupLabel] =
        (group.ageGroups[user.ageGroupLabel] || 0) + 1;
    }
    if (user.genderLabel) {
      group.genders[user.genderLabel] = (group.genders[user.genderLabel] || 0) + 1;
    }
    if (user.ethnicityLabel) {
      group.ethnicities[user.ethnicityLabel] =
        (group.ethnicities[user.ethnicityLabel] || 0) + 1;
    }
    if (user.politicalPartyLabel) {
      group.politicalParties[user.politicalPartyLabel] =
        (group.politicalParties[user.politicalPartyLabel] || 0) + 1;
    }
  }

  return Array.from(groupMap.values());
}
