import { db } from "../db/db";
import { clusteringQueue } from "../db/schema";
import { sql } from "drizzle-orm";

async function checkQueueStatus() {
  console.log("📊 Clustering Queue Status\n");

  try {
    // Get status counts
    const stats = await db
      .select({
        status: clusteringQueue.status,
        count: sql<number>`count(*)`,
      })
      .from(clusteringQueue)
      .groupBy(clusteringQueue.status);

    console.log("Status breakdown:");
    stats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat.count}`);
    });

    // Get recent jobs
    console.log("\nRecent jobs:");
    const recentJobs = await db
      .select()
      .from(clusteringQueue)
      .orderBy(clusteringQueue.createdAt)
      .limit(10);

    recentJobs.forEach((job) => {
      console.log(
        `   [${job.id}] ${job.pollId.substring(0, 8)}... - ${job.status} - ${
          job.errorMessage || "no error"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Failed to check queue:", error);
  }

  process.exit(0);
}

checkQueueStatus();
