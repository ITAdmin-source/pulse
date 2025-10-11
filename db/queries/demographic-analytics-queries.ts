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
