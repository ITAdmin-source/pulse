/**
 * Script to manually trigger clustering computation for costLiving poll
 */

import "dotenv/config";
import { ClusteringService } from "../lib/services/clustering-service";
import { db } from "../db/db";
import { polls } from "../db/schema";
import { eq } from "drizzle-orm";

async function triggerClustering() {
  console.log("=".repeat(70));
  console.log("  MANUAL CLUSTERING TRIGGER FOR 'costLiving' POLL");
  console.log("=".repeat(70));
  console.log("");

  try {
    // Find the poll
    console.log("Step 1: Finding poll...");
    const pollResult = await db
      .select()
      .from(polls)
      .where(eq(polls.slug, "costLiving"))
      .limit(1);

    if (pollResult.length === 0) {
      console.log("❌ ERROR: Poll not found!");
      return;
    }

    const poll = pollResult[0];
    const pollId = poll.id;
    console.log(`✅ Poll found: ${pollId}`);
    console.log("");

    // Check eligibility
    console.log("Step 2: Checking eligibility...");
    const eligibility = await ClusteringService.isEligibleForClustering(pollId);

    console.log(`   Eligible: ${eligibility.eligible}`);
    console.log(`   Users: ${eligibility.userCount}`);
    console.log(`   Statements: ${eligibility.statementCount}`);

    if (!eligibility.eligible) {
      console.log(`   ❌ Reason: ${eligibility.reason}`);
      console.log("");
      console.log("Cannot compute clustering - insufficient data.");
      return;
    }

    console.log("   ✅ Sufficient data for clustering!");
    console.log("");

    // Compute clustering
    console.log("Step 3: Computing clustering (this may take 10-30 seconds)...");
    console.log("");

    const startTime = Date.now();

    try {
      const result = await ClusteringService.computeOpinionLandscape(pollId);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("=".repeat(70));
      console.log("  ✅ CLUSTERING COMPUTATION SUCCESSFUL!");
      console.log("=".repeat(70));
      console.log("");
      console.log(`   Duration: ${duration} seconds`);
      console.log("");
      console.log("CLUSTERING RESULTS:");
      console.log(`   Total Users: ${result.metadata.totalUsers}`);
      console.log(`   Total Statements: ${result.metadata.totalStatements}`);
      console.log(`   Fine Clusters: ${result.metadata.numFineClusters}`);
      console.log(`   Coarse Groups: ${result.metadata.numCoarseGroups}`);
      console.log(`   Silhouette Score: ${result.metadata.silhouetteScore.toFixed(3)} ${result.metadata.silhouetteScore >= 0.5 ? "✅ (good)" : result.metadata.silhouetteScore >= 0.25 ? "⚠️  (acceptable)" : "❌ (poor)"}`);
      console.log(`   Variance Explained: ${(result.metadata.totalVarianceExplained * 100).toFixed(1)}% ${result.metadata.totalVarianceExplained >= 0.6 ? "✅ (good)" : result.metadata.totalVarianceExplained >= 0.4 ? "⚠️  (acceptable)" : "❌ (poor)"}`);
      console.log("");
      console.log("STATEMENT CLASSIFICATIONS:");

      // Count classifications by type
      const classifications = result.statementClassifications;
      const consensusCount = classifications.filter(c =>
        c.type === "positive_consensus" || c.type === "negative_consensus"
      ).length;
      const divisiveCount = classifications.filter(c => c.type === "divisive").length;
      const bridgeCount = classifications.filter(c => c.type === "bridge").length;
      const normalCount = classifications.filter(c => c.type === "normal").length;

      console.log(`   Consensus statements: ${consensusCount}`);
      console.log(`   Divisive statements: ${divisiveCount}`);
      console.log(`   Bridge statements: ${bridgeCount}`);
      console.log(`   Normal statements: ${normalCount}`);
      console.log("");
      console.log("USER POSITIONS:");
      console.log(`   Total users positioned: ${result.userPositions.length}`);
      console.log("");

      // Show distribution across coarse groups
      const groupCounts = new Map<number, number>();
      result.userPositions.forEach(pos => {
        groupCounts.set(pos.coarseGroupId, (groupCounts.get(pos.coarseGroupId) || 0) + 1);
      });

      console.log("OPINION GROUP DISTRIBUTION:");
      Array.from(groupCounts.entries()).sort((a, b) => a[0] - b[0]).forEach(([groupId, count]) => {
        const percentage = ((count / result.userPositions.length) * 100).toFixed(1);
        console.log(`   Group ${groupId + 1}: ${count} users (${percentage}%)`);
      });

      console.log("");
      console.log("=".repeat(70));
      console.log("");
      console.log("✅ The opinion map should now be viewable at:");
      console.log(`   /polls/costLiving/opinionmap`);
      console.log("");

    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log("");
      console.log("=".repeat(70));
      console.log("  ❌ CLUSTERING COMPUTATION FAILED!");
      console.log("=".repeat(70));
      console.log("");
      console.log(`   Duration: ${duration} seconds`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      console.log("");

      if (error instanceof Error && error.stack) {
        console.log("STACK TRACE:");
        console.log(error.stack);
      }
      console.log("");
    }

  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    process.exit(0);
  }
}

triggerClustering();
