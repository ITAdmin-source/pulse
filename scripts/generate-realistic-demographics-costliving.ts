/**
 * Generate Realistic Demographics for costLiving Poll Voters
 *
 * This script populates demographic data for voters in the costLiving poll
 * using realistic distributions based on Israeli demographics and the poll topic.
 *
 * Cost of living is a primary concern for economically active adults (25-44),
 * so age distribution is weighted accordingly.
 */

import "dotenv/config";
import { db } from "../db/db";
import {
  polls,
  userDemographics,
  ageGroups,
  genders,
  ethnicities,
  politicalParties,
} from "../db/schema";
import { eq, inArray, sql } from "drizzle-orm";

// ============================================================================
// REALISTIC DISTRIBUTION WEIGHTS
// ============================================================================

/**
 * Weighted random selection
 * Returns an index based on probability weights
 */
function weightedRandom(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i;
    }
  }

  return weights.length - 1; // Fallback
}

/**
 * Realistic age distribution for cost of living poll
 * Weighted toward economically active adults (30-49)
 * Matches actual database labels in Hebrew
 */
const AGE_WEIGHTS = {
  "18-29": 15,   // Students, early career
  "30-39": 35,   // Prime concern - housing, living costs
  "40-49": 30,   // Families, established careers
  "50-59": 15,   // Peak earning years
  "60-69": 4,    // Less active on digital platforms
  "70-79": 0.8,  // Minimal digital engagement
  "80+": 0.2,    // Very rare
  "מעדיף/ה לא להגיד": 0,  // Skip "prefer not to say"
};

/**
 * Gender distribution (relatively balanced)
 * Matches actual database labels in Hebrew
 */
const GENDER_WEIGHTS = {
  "גבר": 48,     // Male
  "אישה": 50,    // Female
  "מעדיף/ה לא להגיד": 2,  // Prefer not to say
};

/**
 * Political leaning distribution for economic issues
 * Economic issues tend to be less polarized than security/identity issues
 * Matches actual database labels in Hebrew
 */
const POLITICS_WEIGHTS = {
  "ימין עמוק": 15,   // Deep right
  "ימין": 25,        // Right
  "מרכז": 35,        // Center (most common for economic issues)
  "שמאל": 20,        // Left
  "שמאל עמוק": 3,    // Deep left
  "מעדיף/ה לא להגיד": 2,  // Prefer not to say
};

/**
 * Ethnicity/Sector weights for Israeli population
 * Weighted toward secular/traditional Jewish majority
 */
const ETHNICITY_WEIGHTS: Record<string, number> = {
  "חילוני": 40,      // Secular
  "מסורתי": 25,      // Traditional
  "דתי לאומי": 15,   // Religious Zionist
  "חרדי": 10,        // Ultra-Orthodox
  "מוסלמי": 5,       // Muslim
  "דרוזי": 2,        // Druze
  "נוצרי": 2,        // Christian
  "מעדיף/ה לא להגיד": 0,  // Prefer not to say
  // For any label containing "אחר" or unknown labels, use default weight
};

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function generateRealisticDemographics() {
  console.log("=".repeat(80));
  console.log("  REALISTIC DEMOGRAPHICS GENERATOR - costLiving Poll");
  console.log("=".repeat(80));
  console.log("");

  try {
    // Step 1: Find the costLiving poll
    console.log("STEP 1: Finding costLiving poll...");
    const pollResult = await db
      .select()
      .from(polls)
      .where(eq(polls.slug, "costLiving"))
      .limit(1);

    if (pollResult.length === 0) {
      console.log("❌ ERROR: Poll with slug 'costLiving' not found!");
      console.log("");
      console.log("Available polls:");
      const allPolls = await db.select({ slug: polls.slug, title: polls.question }).from(polls);
      allPolls.forEach((p) => console.log(`  - ${p.slug}: ${p.title}`));
      return;
    }

    const poll = pollResult[0];
    console.log(`✅ Found poll: "${poll.question}"`);
    console.log(`   Poll ID: ${poll.id}`);
    console.log("");

    // Step 2: Get all users who voted on this poll
    console.log("STEP 2: Finding voters...");
    const usersWhoVoted = await db.execute<{ user_id: string }>(sql`
      SELECT DISTINCT v.user_id
      FROM votes v
      INNER JOIN statements s ON v.statement_id = s.id
      WHERE s.poll_id = ${poll.id}
    `);

    const userIds = usersWhoVoted.map((u: { user_id: string }) => u.user_id);
    console.log(`   Found ${userIds.length} unique voters`);
    console.log("");

    if (userIds.length === 0) {
      console.log("⚠️  No voters found for this poll. Nothing to do.");
      return;
    }

    // Step 3: Load all demographic options
    console.log("STEP 3: Loading demographic options...");
    const [ageGroupsList, gendersList, ethnicitiesList, politicalPartiesList] = await Promise.all([
      db.select().from(ageGroups),
      db.select().from(genders),
      db.select().from(ethnicities),
      db.select().from(politicalParties),
    ]);

    console.log(`   Age groups: ${ageGroupsList.length}`);
    ageGroupsList.forEach((ag) => console.log(`     - ${ag.label} (id: ${ag.id})`));
    console.log(`   Genders: ${gendersList.length}`);
    gendersList.forEach((g) => console.log(`     - ${g.label} (id: ${g.id})`));
    console.log(`   Ethnicities: ${ethnicitiesList.length}`);
    ethnicitiesList.forEach((e) => console.log(`     - ${e.label} (id: ${e.id})`));
    console.log(`   Political parties: ${politicalPartiesList.length}`);
    politicalPartiesList.forEach((p) => console.log(`     - ${p.label} (id: ${p.id})`));
    console.log("");

    // Step 4: Check existing demographics
    console.log("STEP 4: Checking existing demographics...");
    const existingDemographics = await db
      .select({ userId: userDemographics.userId })
      .from(userDemographics)
      .where(inArray(userDemographics.userId, userIds));

    const usersWithDemographics = new Set(existingDemographics.map((d) => d.userId));
    const usersNeedingDemographics = userIds.filter((id: string) => !usersWithDemographics.has(id));

    console.log(`   ${usersWithDemographics.size} users already have demographics`);
    console.log(`   ${usersNeedingDemographics.length} users need demographics`);
    console.log("");

    if (usersNeedingDemographics.length === 0) {
      console.log("✅ All voters already have demographics!");
      console.log("");
      console.log("To regenerate demographics:");
      console.log("  1. Delete existing: DELETE FROM user_demographics WHERE user_id IN (...)");
      console.log("  2. Re-run this script");
      return;
    }

    // Step 5: Generate weighted random demographics
    console.log("STEP 5: Generating realistic demographics...");
    console.log(`   Using weighted distributions for Israeli cost-of-living poll:`);
    console.log(`     - Age: Skewed toward 25-44 (economically active)`);
    console.log(`     - Gender: Balanced distribution`);
    console.log(`     - Politics: Moderate/pragmatic lean (economic issues)`);
    console.log("");

    // Create lookup maps for weighted selection
    const ageGroupMap = new Map(ageGroupsList.map((ag) => [ag.label, ag]));
    const genderMap = new Map(gendersList.map((g) => [g.label, g]));
    const ethnicityMap = new Map(ethnicitiesList.map((e) => [e.label, e]));
    const politicsMap = new Map(politicalPartiesList.map((p) => [p.label, p]));

    // Build weighted arrays for selection
    const ageOptions = ageGroupsList.filter((ag) => AGE_WEIGHTS[ag.label as keyof typeof AGE_WEIGHTS] > 0);
    const ageWeights = ageOptions.map((ag) => AGE_WEIGHTS[ag.label as keyof typeof AGE_WEIGHTS] || 1);

    const genderOptions = gendersList.filter((g) => GENDER_WEIGHTS[g.label as keyof typeof GENDER_WEIGHTS] > 0);
    const genderWeights = genderOptions.map((g) => GENDER_WEIGHTS[g.label as keyof typeof GENDER_WEIGHTS] || 1);

    // For ethnicities, use defined weights or default weight of 1 for unknown labels (like "אחר")
    const ethnicityOptions = ethnicitiesList.filter((e) => {
      const weight = ETHNICITY_WEIGHTS[e.label] ?? 1;
      return weight > 0 && !e.label.includes("מעדיף");
    });
    const ethnicityWeights = ethnicityOptions.map((e) => ETHNICITY_WEIGHTS[e.label] || 1);

    const politicsOptions = politicalPartiesList.filter((p) => (POLITICS_WEIGHTS[p.label as keyof typeof POLITICS_WEIGHTS] || 0) > 0);
    const politicsWeights = politicsOptions.map((p) => POLITICS_WEIGHTS[p.label as keyof typeof POLITICS_WEIGHTS] || 1);

    // Ensure we have options for all categories
    if (ageOptions.length === 0 || genderOptions.length === 0 || ethnicityOptions.length === 0 || politicsOptions.length === 0) {
      console.log("❌ ERROR: Missing demographic options after filtering");
      console.log(`   Age options: ${ageOptions.length}`);
      console.log(`   Gender options: ${genderOptions.length}`);
      console.log(`   Ethnicity options: ${ethnicityOptions.length}`);
      console.log(`   Politics options: ${politicsOptions.length}`);
      return;
    }

    // Generate demographics for each user
    const newDemographics = usersNeedingDemographics.map((userId: string) => {
      // Select weighted random options
      const ageGroup = ageOptions[weightedRandom(ageWeights)];
      const gender = genderOptions[weightedRandom(genderWeights)];
      const ethnicity = ethnicityOptions[weightedRandom(ethnicityWeights)];
      const politics = politicsOptions[weightedRandom(politicsWeights)];

      return {
        userId: userId,
        ageGroupId: ageGroup.id,
        genderId: gender.id,
        ethnicityId: ethnicity.id,
        politicalPartyId: politics.id,
      };
    });

    // Step 6: Show statistics before insertion
    console.log("DEMOGRAPHICS BREAKDOWN (to be inserted):");
    console.log("");

    // Count by age group
    const ageCounts = new Map<string, number>();
    newDemographics.forEach((d) => {
      const ag = ageGroupsList.find((a) => a.id === d.ageGroupId);
      if (ag) {
        ageCounts.set(ag.label, (ageCounts.get(ag.label) || 0) + 1);
      }
    });
    console.log("  Age Distribution:");
    ageCounts.forEach((count, label) => {
      const percentage = ((count / newDemographics.length) * 100).toFixed(1);
      console.log(`    ${label}: ${count} (${percentage}%)`);
    });
    console.log("");

    // Count by gender
    const genderCounts = new Map<string, number>();
    newDemographics.forEach((d) => {
      const g = gendersList.find((gen) => gen.id === d.genderId);
      if (g) {
        genderCounts.set(g.label, (genderCounts.get(g.label) || 0) + 1);
      }
    });
    console.log("  Gender Distribution:");
    genderCounts.forEach((count, label) => {
      const percentage = ((count / newDemographics.length) * 100).toFixed(1);
      console.log(`    ${label}: ${count} (${percentage}%)`);
    });
    console.log("");

    // Count by ethnicity
    const ethnicityCounts = new Map<string, number>();
    newDemographics.forEach((d) => {
      const e = ethnicitiesList.find((eth) => eth.id === d.ethnicityId);
      if (e) {
        ethnicityCounts.set(e.label, (ethnicityCounts.get(e.label) || 0) + 1);
      }
    });
    console.log("  Ethnicity Distribution:");
    ethnicityCounts.forEach((count, label) => {
      const percentage = ((count / newDemographics.length) * 100).toFixed(1);
      console.log(`    ${label}: ${count} (${percentage}%)`);
    });
    console.log("");

    // Count by political party
    const politicsCounts = new Map<string, number>();
    newDemographics.forEach((d) => {
      const p = politicalPartiesList.find((pol) => pol.id === d.politicalPartyId);
      if (p) {
        politicsCounts.set(p.label, (politicsCounts.get(p.label) || 0) + 1);
      }
    });
    console.log("  Political Leaning Distribution:");
    politicsCounts.forEach((count, label) => {
      const percentage = ((count / newDemographics.length) * 100).toFixed(1);
      console.log(`    ${label}: ${count} (${percentage}%)`);
    });
    console.log("");

    // Step 7: Insert demographics (with transaction)
    console.log("STEP 6: Inserting demographics into database...");
    await db.insert(userDemographics).values(newDemographics);
    console.log(`✅ Successfully inserted ${newDemographics.length} demographic records`);
    console.log("");

    // Step 8: Final summary
    console.log("=".repeat(80));
    console.log("  SUCCESS!");
    console.log("=".repeat(80));
    console.log("");
    console.log("Next steps:");
    console.log("  1. Visit: /polls/costLiving/opinionmap");
    console.log("  2. Click on any cluster group to expand");
    console.log("  3. View demographic breakdown for each group");
    console.log("");
    console.log("The demographics will now be visible in the opinion map visualization!");
    console.log("");

  } catch (error) {
    console.error("❌ Error generating demographics:", error);
    throw error;
  }
}

// Run the script
generateRealisticDemographics()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
