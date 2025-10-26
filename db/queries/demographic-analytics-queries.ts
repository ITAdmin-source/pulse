import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { votes, statements, users, userDemographics, ageGroups, genders, ethnicities, politicalParties } from "../schema";

/**
 * Demographic breakdown result for a single demographic category
 */
export interface DemographicVoteBreakdown {
  categoryId: number;
  categoryLabel: string;
  agreeCount: number;
  disagreeCount: number;
  neutralCount: number;
  totalVotes: number;
  agreePercent: number;
  disagreePercent: number;
  neutralPercent: number;
}

/**
 * Get vote breakdown by age group for a specific statement
 */
export async function getVoteBreakdownByAgeGroup(statementId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: ageGroups.id,
      categoryLabel: ageGroups.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(ageGroups, eq(userDemographics.ageGroupId, ageGroups.id))
    .where(eq(votes.statementId, statementId))
    .groupBy(ageGroups.id, ageGroups.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get vote breakdown by gender for a specific statement
 */
export async function getVoteBreakdownByGender(statementId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: genders.id,
      categoryLabel: genders.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(genders, eq(userDemographics.genderId, genders.id))
    .where(eq(votes.statementId, statementId))
    .groupBy(genders.id, genders.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get vote breakdown by ethnicity for a specific statement
 */
export async function getVoteBreakdownByEthnicity(statementId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: ethnicities.id,
      categoryLabel: ethnicities.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(ethnicities, eq(userDemographics.ethnicityId, ethnicities.id))
    .where(eq(votes.statementId, statementId))
    .groupBy(ethnicities.id, ethnicities.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get vote breakdown by political party for a specific statement
 */
export async function getVoteBreakdownByPoliticalParty(statementId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: politicalParties.id,
      categoryLabel: politicalParties.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(politicalParties, eq(userDemographics.politicalPartyId, politicalParties.id))
    .where(eq(votes.statementId, statementId))
    .groupBy(politicalParties.id, politicalParties.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get aggregate vote breakdown by age group for all statements in a poll
 */
export async function getPollVoteBreakdownByAgeGroup(pollId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: ageGroups.id,
      categoryLabel: ageGroups.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(ageGroups, eq(userDemographics.ageGroupId, ageGroups.id))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ))
    .groupBy(ageGroups.id, ageGroups.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get aggregate vote breakdown by gender for all statements in a poll
 */
export async function getPollVoteBreakdownByGender(pollId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: genders.id,
      categoryLabel: genders.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(genders, eq(userDemographics.genderId, genders.id))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ))
    .groupBy(genders.id, genders.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get aggregate vote breakdown by ethnicity for all statements in a poll
 */
export async function getPollVoteBreakdownByEthnicity(pollId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: ethnicities.id,
      categoryLabel: ethnicities.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(ethnicities, eq(userDemographics.ethnicityId, ethnicities.id))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ))
    .groupBy(ethnicities.id, ethnicities.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get aggregate vote breakdown by political party for all statements in a poll
 */
export async function getPollVoteBreakdownByPoliticalParty(pollId: string): Promise<DemographicVoteBreakdown[]> {
  const results = await db
    .select({
      categoryId: politicalParties.id,
      categoryLabel: politicalParties.label,
      agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
      disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
      neutralCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      totalVotes: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .innerJoin(politicalParties, eq(userDemographics.politicalPartyId, politicalParties.id))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ))
    .groupBy(politicalParties.id, politicalParties.label);

  return results.map(r => ({
    ...r,
    agreePercent: r.totalVotes > 0 ? Math.round((Number(r.agreeCount) / r.totalVotes) * 100) : 0,
    disagreePercent: r.totalVotes > 0 ? Math.round((Number(r.disagreeCount) / r.totalVotes) * 100) : 0,
    neutralPercent: r.totalVotes > 0 ? Math.round((Number(r.neutralCount) / r.totalVotes) * 100) : 0,
    agreeCount: Number(r.agreeCount),
    disagreeCount: Number(r.disagreeCount),
    neutralCount: Number(r.neutralCount),
    totalVotes: r.totalVotes,
  }));
}

/**
 * Get participant count by demographic category for a poll
 * Useful for understanding the demographic distribution of participants
 */
export async function getPollParticipantsByDemographic(pollId: string): Promise<{
  byAgeGroup: Array<{ categoryId: number; categoryLabel: string; count: number }>;
  byGender: Array<{ categoryId: number; categoryLabel: string; count: number }>;
  byEthnicity: Array<{ categoryId: number; categoryLabel: string; count: number }>;
  byPoliticalParty: Array<{ categoryId: number; categoryLabel: string; count: number }>;
}> {
  // Get all user IDs who voted in this poll
  const voterIds = await db
    .selectDistinct({ userId: votes.userId })
    .from(votes)
    .innerJoin(statements, eq(votes.statementId, statements.id))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ));

  const voterIdList = voterIds.map(v => v.userId);

  if (voterIdList.length === 0) {
    return {
      byAgeGroup: [],
      byGender: [],
      byEthnicity: [],
      byPoliticalParty: [],
    };
  }

  // Count by age group
  const ageGroupCounts = await db
    .select({
      categoryId: ageGroups.id,
      categoryLabel: ageGroups.label,
      count: sql<number>`COUNT(DISTINCT ${userDemographics.userId})`,
    })
    .from(userDemographics)
    .innerJoin(ageGroups, eq(userDemographics.ageGroupId, ageGroups.id))
    .where(inArray(userDemographics.userId, voterIdList))
    .groupBy(ageGroups.id, ageGroups.label);

  // Count by gender
  const genderCounts = await db
    .select({
      categoryId: genders.id,
      categoryLabel: genders.label,
      count: sql<number>`COUNT(DISTINCT ${userDemographics.userId})`,
    })
    .from(userDemographics)
    .innerJoin(genders, eq(userDemographics.genderId, genders.id))
    .where(inArray(userDemographics.userId, voterIdList))
    .groupBy(genders.id, genders.label);

  // Count by ethnicity
  const ethnicityCounts = await db
    .select({
      categoryId: ethnicities.id,
      categoryLabel: ethnicities.label,
      count: sql<number>`COUNT(DISTINCT ${userDemographics.userId})`,
    })
    .from(userDemographics)
    .innerJoin(ethnicities, eq(userDemographics.ethnicityId, ethnicities.id))
    .where(inArray(userDemographics.userId, voterIdList))
    .groupBy(ethnicities.id, ethnicities.label);

  // Count by political party
  const politicalPartyCounts = await db
    .select({
      categoryId: politicalParties.id,
      categoryLabel: politicalParties.label,
      count: sql<number>`COUNT(DISTINCT ${userDemographics.userId})`,
    })
    .from(userDemographics)
    .innerJoin(politicalParties, eq(userDemographics.politicalPartyId, politicalParties.id))
    .where(inArray(userDemographics.userId, voterIdList))
    .groupBy(politicalParties.id, politicalParties.label);

  return {
    byAgeGroup: ageGroupCounts.map(c => ({ ...c, count: Number(c.count) })),
    byGender: genderCounts.map(c => ({ ...c, count: Number(c.count) })),
    byEthnicity: ethnicityCounts.map(c => ({ ...c, count: Number(c.count) })),
    byPoliticalParty: politicalPartyCounts.map(c => ({ ...c, count: Number(c.count) })),
  };
}

/**
 * HEATMAP QUERIES
 */

export type DemographicAttribute = 'ageGroup' | 'gender' | 'ethnicity' | 'politicalParty';

export interface HeatmapCellData {
  groupId: number;
  groupLabel: string;
  agreeCount: number;
  disagreeCount: number;
  passCount: number;
  agreementPercentage: number | null; // null if below threshold
  totalVotes: number; // excludes passes
  totalResponses: number; // includes passes
  passPercentage: number;
  hasHighPasses: boolean; // true if >30% passed
}

export interface HeatmapStatementData {
  statementId: string;
  statementText: string;
  cells: HeatmapCellData[];
  classificationType: 'consensus' | 'partial' | 'split' | 'divisive';
  classificationLabel: string;
}

/**
 * Get heatmap data for a poll by demographic attribute
 * OPTIMIZED: Single query instead of N×M queries
 */
export async function getHeatmapDataForAttribute(
  pollId: string,
  attribute: DemographicAttribute,
  privacyThreshold: number = 3
): Promise<HeatmapStatementData[]> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] [getHeatmapDataForAttribute] START - pollId: ${pollId}, attribute: ${attribute}`);

  // OPTIMIZATION: Early exit check - count voters with demographics for this poll
  // This prevents expensive query when there's insufficient data
  const earlyCheckStart = Date.now();
  const votersWithDemographics = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${users.id})` })
    .from(statements)
    .innerJoin(votes, eq(statements.id, votes.statementId))
    .innerJoin(users, eq(votes.userId, users.id))
    .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
    .where(and(
      eq(statements.pollId, pollId),
      eq(statements.approved, true)
    ))
    .limit(1);

  const voterCount = Number(votersWithDemographics[0]?.count || 0);
  console.log(`[${requestId}] Early check (${Date.now() - earlyCheckStart}ms): ${voterCount} voters with demographics`);

  // If fewer than privacyThreshold voters have demographics, return empty
  if (voterCount < privacyThreshold) {
    console.log(`[${requestId}] EARLY EXIT: Insufficient demographic data (${voterCount} < ${privacyThreshold})`);
    return [];
  }

  // Get demographic field based on attribute
  const { field, labelField, tableAlias } = getDemographicFieldInfo(attribute);

  // SINGLE QUERY: Get all vote counts grouped by statement and demographic
  // This replaces N×M queries with just ONE query
  // Uses INNER JOIN on userDemographics to only include votes from users with demographics
  console.log(`[${requestId}] [QUERY START] Running main heatmap query for ${attribute}...`);
  const queryStart = Date.now();

  // Query progress tracking
  const queryTimeout = setTimeout(() => {
    console.warn(`[${requestId}] ⚠️ QUERY TIMEOUT: Main heatmap query for ${attribute} still running after 10 seconds`);
  }, 10000);

  let voteData;
  try {
    voteData = await db
      .select({
        statementId: statements.id,
        statementText: statements.text,
        groupId: field,
        groupLabel: labelField,
        agreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 1 THEN 1 END)`,
        disagreeCount: sql<number>`COUNT(CASE WHEN ${votes.value} = -1 THEN 1 END)`,
        passCount: sql<number>`COUNT(CASE WHEN ${votes.value} = 0 THEN 1 END)`,
      })
      .from(statements)
      .leftJoin(votes, eq(statements.id, votes.statementId))
      .innerJoin(users, eq(votes.userId, users.id))
      .innerJoin(userDemographics, eq(users.id, userDemographics.userId))
      .innerJoin(tableAlias, eq(field, sql`${tableAlias}.id`))
      .where(and(
        eq(statements.pollId, pollId),
        eq(statements.approved, true)
      ))
      .groupBy(statements.id, statements.text, field, labelField);

    clearTimeout(queryTimeout);
    const queryDuration = Date.now() - queryStart;
    console.log(`[${requestId}] [QUERY SUCCESS] Main query completed in ${queryDuration}ms - ${voteData.length} rows`);
  } catch (error) {
    clearTimeout(queryTimeout);
    const queryDuration = Date.now() - queryStart;
    console.error(`[${requestId}] [QUERY ERROR] Main query failed after ${queryDuration}ms:`, error);
    throw error;
  }

  if (voteData.length === 0) {
    console.log(`[${requestId}] No vote data found - returning empty`);
    return [];
  }

  // Get all demographic groups for this attribute
  console.log(`[${requestId}] Fetching demographic groups...`);
  const groupsStart = Date.now();
  const groups = await getDemographicGroups(attribute);
  console.log(`[${requestId}] Got ${groups.length} groups in ${Date.now() - groupsStart}ms`);

  // Group data by statement
  const statementMap = new Map<string, {
    text: string;
    cells: Map<number, { agreeCount: number; disagreeCount: number; passCount: number; groupLabel: string }>;
  }>();

  // Process vote data
  for (const row of voteData) {
    if (!statementMap.has(row.statementId)) {
      statementMap.set(row.statementId, {
        text: row.statementText,
        cells: new Map(),
      });
    }

    const statement = statementMap.get(row.statementId)!;

    if (row.groupId !== null) {
      statement.cells.set(row.groupId, {
        agreeCount: Number(row.agreeCount),
        disagreeCount: Number(row.disagreeCount),
        passCount: Number(row.passCount),
        groupLabel: row.groupLabel || 'Unknown',
      });
    }
  }

  // Build final heatmap data
  const heatmapData: HeatmapStatementData[] = [];

  for (const [statementId, statementInfo] of statementMap.entries()) {
    const cells: HeatmapCellData[] = [];

    // Ensure all demographic groups are represented
    for (const group of groups) {
      const cellData = statementInfo.cells.get(group.id) || {
        agreeCount: 0,
        disagreeCount: 0,
        passCount: 0,
        groupLabel: group.label,
      };

      const totalVotes = cellData.agreeCount + cellData.disagreeCount; // Excludes passes
      const totalResponses = totalVotes + cellData.passCount;

      // Calculate agreement percentage (null if below threshold)
      let agreementPercentage: number | null = null;
      if (totalResponses >= privacyThreshold && totalVotes > 0) {
        agreementPercentage = Math.round(((cellData.agreeCount - cellData.disagreeCount) / totalVotes) * 100);
      }

      // Calculate pass percentage
      const passPercentage = totalResponses > 0 ? (cellData.passCount / totalResponses) * 100 : 0;
      const hasHighPasses = passPercentage > 30;

      cells.push({
        groupId: group.id,
        groupLabel: cellData.groupLabel,
        agreeCount: cellData.agreeCount,
        disagreeCount: cellData.disagreeCount,
        passCount: cellData.passCount,
        agreementPercentage,
        totalVotes,
        totalResponses,
        passPercentage,
        hasHighPasses,
      });
    }

    // Classify statement
    const classification = classifyStatement(cells);

    heatmapData.push({
      statementId,
      statementText: statementInfo.text,
      cells,
      classificationType: classification.type,
      classificationLabel: classification.label,
    });
  }

  const totalDuration = Date.now() - startTime;
  console.log(`[${requestId}] [getHeatmapDataForAttribute] COMPLETE - ${heatmapData.length} statements in ${totalDuration}ms`);

  return heatmapData;
}

/**
 * Helper: Get demographic field info for optimized query
 */
function getDemographicFieldInfo(attribute: DemographicAttribute) {
  switch (attribute) {
    case 'ageGroup':
      return {
        field: userDemographics.ageGroupId,
        labelField: ageGroups.label,
        tableAlias: ageGroups
      };
    case 'gender':
      return {
        field: userDemographics.genderId,
        labelField: genders.label,
        tableAlias: genders
      };
    case 'ethnicity':
      return {
        field: userDemographics.ethnicityId,
        labelField: ethnicities.label,
        tableAlias: ethnicities
      };
    case 'politicalParty':
      return {
        field: userDemographics.politicalPartyId,
        labelField: politicalParties.label,
        tableAlias: politicalParties
      };
  }
}

/**
 * Helper: Get all groups for a demographic attribute
 */
async function getDemographicGroups(attribute: DemographicAttribute): Promise<Array<{ id: number; label: string }>> {
  switch (attribute) {
    case 'ageGroup':
      return await db.select({ id: ageGroups.id, label: ageGroups.label }).from(ageGroups);
    case 'gender':
      return await db.select({ id: genders.id, label: genders.label }).from(genders);
    case 'ethnicity':
      return await db.select({ id: ethnicities.id, label: ethnicities.label }).from(ethnicities);
    case 'politicalParty':
      return await db.select({ id: politicalParties.id, label: politicalParties.label }).from(politicalParties);
  }
}

/**
 * Helper: Classify statement based on agreement patterns
 */
function classifyStatement(cells: HeatmapCellData[]): { type: 'consensus' | 'partial' | 'split' | 'divisive'; label: string } {
  // Filter out cells with no data
  const validCells = cells.filter(c => c.agreementPercentage !== null);

  if (validCells.length === 0) {
    return { type: 'divisive', label: '❌ חוסר נתונים' };
  }

  const agreements = validCells.map(c => c.agreementPercentage!);
  const numGroups = agreements.length;

  // Count strong positions
  const stronglyAgree = agreements.filter(a => a > 60).length;
  const stronglyDisagree = agreements.filter(a => a < -60).length;

  // CONSENSUS: All groups on same side
  if (stronglyAgree === numGroups) {
    return { type: 'consensus', label: '✓ קונצנזוס' };
  }
  if (stronglyDisagree === numGroups) {
    return { type: 'consensus', label: '✓ קונצנזוס' };
  }

  // PARTIAL: Most groups (all but 1-2) agree
  if (stronglyAgree >= numGroups - 1 && stronglyAgree > 0) {
    return { type: 'partial', label: '⚠ חלקי' };
  }
  if (stronglyDisagree >= numGroups - 1 && stronglyDisagree > 0) {
    return { type: 'partial', label: '⚠ חלקי' };
  }

  // SPLIT: Groups evenly divided
  if (stronglyAgree > 0 && stronglyDisagree > 0 &&
      Math.abs(stronglyAgree - stronglyDisagree) <= 1) {
    return { type: 'split', label: '⚡ מפוצל' };
  }

  // DIVISIVE: Everything else
  return { type: 'divisive', label: '❌ שנוי במחלוקת' };
}
