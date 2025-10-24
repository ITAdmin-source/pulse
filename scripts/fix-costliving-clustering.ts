/**
 * Fix CostLiving Poll Clustering
 * One-time script to recompute clustering for the costLiving poll
 * Run: npx tsx scripts/fix-costliving-clustering.ts
 */

import { ClusteringService } from "@/lib/services/clustering-service";
import { invalidateAllCaches } from "@/lib/caching/clustering-cache";

const POLL_ID = "ab3843ae-359d-4185-90f5-8e6d3b267e8c";
const USER_ID = "af7be192-9042-4bde-ab59-37b16dd8dd3f";

async function main() {
  console.log("===========================");
  console.log("CostLiving Clustering Fix");
  console.log("===========================\n");

  console.log(`Poll ID: ${POLL_ID}`);
  console.log(`Target User ID: ${USER_ID}\n`);

  // Check eligibility
  console.log("Step 1: Checking eligibility...");
  const eligibility = await ClusteringService.isEligibleForClustering(POLL_ID);

  console.log("Eligibility Result:", {
    eligible: eligibility.eligible,
    userCount: eligibility.userCount,
    statementCount: eligibility.statementCount,
    reason: eligibility.reason,
  });

  if (!eligibility.eligible) {
    console.error("\n❌ Poll is not eligible for clustering!");
    console.error("Reason:", eligibility.reason);
    process.exit(1);
  }

  console.log("\n✅ Poll is eligible for clustering\n");

  // Compute clustering
  console.log("Step 2: Computing clustering...");
  const startTime = Date.now();

  try {
    const result = await ClusteringService.computeOpinionLandscape(POLL_ID);
    const duration = Date.now() - startTime;

    console.log("\n✅ Clustering completed successfully!\n");
    console.log("Results:");
    console.log("  Duration:", `${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log("  Total Users:", result.metadata.totalUsers);
    console.log("  Total Statements:", result.metadata.totalStatements);
    console.log("  Number of Groups:", result.metadata.numCoarseGroups);
    console.log("  Quality Tier:", result.metadata.qualityTier);
    console.log("  Consensus Level:", result.metadata.consensusLevel);
    console.log("  Silhouette Score:", (result.metadata.silhouetteScore * 100).toFixed(1) + "%");
    console.log("  Variance Explained:", (result.metadata.totalVarianceExplained * 100).toFixed(1) + "%");

    // Verify target user is included
    console.log("\nStep 3: Verifying target user inclusion...");
    const userPosition = result.userPositions.find((p) => p.userId === USER_ID);

    if (userPosition) {
      console.log("\n✅ Target user FOUND in clustering results!");
      console.log("User Position:", {
        userId: userPosition.userId,
        pc1: userPosition.pc1.toFixed(3),
        pc2: userPosition.pc2.toFixed(3),
        fineClusterId: userPosition.fineClusterId,
        coarseGroupId: userPosition.coarseGroupId,
      });
    } else {
      console.log("\n❌ Target user NOT FOUND in clustering results!");
      console.log("This may indicate a data issue or the user hasn't voted yet.");
    }

    // Invalidate caches
    console.log("\nStep 4: Invalidating caches...");
    invalidateAllCaches(POLL_ID);
    console.log("✅ Caches invalidated\n");

    console.log("===========================");
    console.log("Fix completed successfully!");
    console.log("===========================");
  } catch (error) {
    console.error("\n❌ Error computing clustering:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });
