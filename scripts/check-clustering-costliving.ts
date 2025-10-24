/**
 * Script to diagnose clustering data for costLiving poll
 */

import "dotenv/config";
import { db } from "../db/db";
import { polls, statements, votes, pollClusteringMetadata, userClusteringPositions } from "../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

async function checkClusteringData() {
  console.log("=".repeat(70));
  console.log("  CLUSTERING DIAGNOSIS FOR 'costLiving' POLL");
  console.log("=".repeat(70));
  console.log("");

  try {
    // Step 1: Find the poll
    console.log("STEP 1: Finding poll by slug 'costLiving'...");
    const pollResult = await db
      .select()
      .from(polls)
      .where(eq(polls.slug, "costLiving"))
      .limit(1);

    if (pollResult.length === 0) {
      console.log("❌ ERROR: Poll with slug 'costLiving' not found!");
      return;
    }

    const poll = pollResult[0];
    console.log(`✅ Poll found: "${poll.title}"`);
    console.log(`   Poll ID: ${poll.id}`);
    console.log(`   Created: ${poll.createdAt}`);
    console.log(`   Status: ${poll.status}`);
    console.log("");

    // Step 2: Count approved statements
    console.log("STEP 2: Counting approved statements...");
    const statementsResult = await db
      .select()
      .from(statements)
      .where(
        and(
          eq(statements.pollId, poll.id),
          eq(statements.approved, true)
        )
      );

    const statementCount = statementsResult.length;
    console.log(`   Approved statements: ${statementCount}`);
    console.log(`   Minimum required: 6`);
    console.log(`   ✅ Sufficient statements: ${statementCount >= 6 ? "YES" : "NO"}`);
    console.log("");

    if (statementCount === 0) {
      console.log("❌ No statements found. Cannot compute clustering.");
      return;
    }

    const statementIds = statementsResult.map(s => s.id);

    // Step 3: Count total votes
    console.log("STEP 3: Counting votes...");
    const totalVotesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    const totalVotes = Number(totalVotesResult[0]?.count ?? 0);
    console.log(`   Total votes cast: ${totalVotes}`);
    console.log("");

    // Step 4: Count unique users who voted
    console.log("STEP 4: Counting unique voters...");
    const uniqueUsersResult = await db
      .selectDistinct({ userId: votes.userId })
      .from(votes)
      .where(inArray(votes.statementId, statementIds));

    const uniqueUserCount = uniqueUsersResult.length;
    console.log(`   Unique users who voted: ${uniqueUserCount}`);
    console.log(`   Minimum required: 20`);
    console.log(`   ✅ Sufficient users: ${uniqueUserCount >= 20 ? "YES" : "NO"}`);
    console.log("");

    // Show vote distribution per user
    console.log("STEP 5: Vote distribution per user...");
    const votesByUserResult = await db
      .select({
        userId: votes.userId,
        count: sql<number>`count(*)`,
      })
      .from(votes)
      .where(inArray(votes.statementId, statementIds))
      .groupBy(votes.userId)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    console.log("   Top 10 voters:");
    votesByUserResult.forEach((user, idx) => {
      console.log(`   ${idx + 1}. User ${user.userId.substring(0, 8)}...: ${user.count} votes`);
    });
    console.log("");

    // Step 6: Check clustering metadata
    console.log("STEP 6: Checking clustering metadata...");
    const metadataResult = await db
      .select()
      .from(pollClusteringMetadata)
      .where(eq(pollClusteringMetadata.pollId, poll.id))
      .limit(1);

    if (metadataResult.length === 0) {
      console.log("   ❌ No clustering metadata found in database");
      console.log("");
    } else {
      const metadata = metadataResult[0];
      console.log("   ✅ Clustering metadata EXISTS");
      console.log(`   Computed at: ${metadata.computedAt}`);
      console.log(`   Total users: ${metadata.totalUsers}`);
      console.log(`   Total statements: ${metadata.totalStatements}`);
      console.log(`   Fine clusters: ${metadata.numFineClusters}`);
      console.log(`   Coarse groups: ${metadata.coarseGroups.length}`);
      console.log(`   Silhouette score: ${metadata.silhouetteScore.toFixed(3)}`);
      console.log(`   Variance explained: ${(metadata.totalVarianceExplained * 100).toFixed(1)}%`);
      console.log("");
    }

    // Step 7: Check user positions
    console.log("STEP 7: Checking user clustering positions...");
    const positionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userClusteringPositions)
      .where(eq(userClusteringPositions.pollId, poll.id));

    const positionCount = Number(positionsResult[0]?.count ?? 0);
    console.log(`   User positions stored: ${positionCount}`);
    console.log("");

    // Step 8: Summary and diagnosis
    console.log("=".repeat(70));
    console.log("  DIAGNOSIS SUMMARY");
    console.log("=".repeat(70));
    console.log("");

    const hasMetadata = metadataResult.length > 0;
    const isEligible = statementCount >= 6 && uniqueUserCount >= 20;

    if (hasMetadata) {
      console.log("✅ STATUS: Clustering data EXISTS");
      console.log("");
      console.log("The error message is unexpected. Clustering data is present in the database.");
      console.log("This suggests a potential issue with:");
      console.log("  1. Data retrieval in getCompleteClusteringDataAction");
      console.log("  2. Query logic in getCompleteClusteringData");
      console.log("  3. Caching layer returning stale/null data");
      console.log("");
    } else if (isEligible) {
      console.log("⚠️  STATUS: ELIGIBLE BUT NOT COMPUTED");
      console.log("");
      console.log("The poll has sufficient data for clustering:");
      console.log(`  ✅ Statements: ${statementCount} (>= 6 required)`);
      console.log(`  ✅ Users: ${uniqueUserCount} (>= 20 required)`);
      console.log("");
      console.log("BUT clustering has NOT been computed yet.");
      console.log("");
      console.log("LIKELY CAUSE:");
      console.log("  - Clustering is NOT automatically triggered when votes are cast");
      console.log("  - No automatic trigger exists in the vote casting flow");
      console.log("");
      console.log("RECOMMENDED SOLUTION:");
      console.log("  1. Manual trigger via computeClusteringAction");
      console.log("  2. Add automatic trigger after vote casting");
      console.log("  3. Add periodic background job to compute clustering");
      console.log("");
    } else {
      console.log("✅ STATUS: EXPECTED BEHAVIOR (Insufficient Data)");
      console.log("");
      console.log("The poll does NOT have sufficient data for clustering:");
      console.log(`  ${statementCount >= 6 ? "✅" : "❌"} Statements: ${statementCount} (>= 6 required)`);
      console.log(`  ${uniqueUserCount >= 20 ? "✅" : "❌"} Users: ${uniqueUserCount} (>= 20 required)`);
      console.log("");
      console.log("The error message is correct and expected.");
      console.log("");
      console.log("NEXT STEPS:");
      if (statementCount < 6) {
        console.log(`  - Add ${6 - statementCount} more approved statements`);
      }
      if (uniqueUserCount < 20) {
        console.log(`  - Get ${20 - uniqueUserCount} more unique users to vote`);
      }
      console.log("");
    }

    console.log("=".repeat(70));

  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  } finally {
    process.exit(0);
  }
}

checkClusteringData();
