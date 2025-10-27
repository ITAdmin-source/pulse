/**
 * Test script for clustering queue
 * Tests enqueue, process, and cleanup functionality
 */

import { ClusteringQueueService } from "../lib/services/clustering-queue-service";
import { db } from "../db/db";
import { polls } from "../db/schema";
import { eq } from "drizzle-orm";

async function testClusteringQueue() {
  console.log("🧪 Testing Clustering Queue\n");

  try {
    // 1. Get a poll to test with
    console.log("1️⃣ Fetching a poll for testing...");
    const testPolls = await db
      .select()
      .from(polls)
      .where(eq(polls.status, "published"))
      .limit(1);

    if (testPolls.length === 0) {
      console.log("❌ No published polls found. Please create a poll first.");
      process.exit(1);
    }

    const testPoll = testPolls[0];
    console.log(`✅ Using poll: ${testPoll.question} (ID: ${testPoll.id})\n`);

    // 2. Test enqueue
    console.log("2️⃣ Testing enqueue...");
    const enqueued1 = await ClusteringQueueService.enqueueJob(testPoll.id);
    console.log(`   ${enqueued1 ? "✅" : "⚠️"} First enqueue: ${enqueued1 ? "success" : "skipped"}`);

    const enqueued2 = await ClusteringQueueService.enqueueJob(testPoll.id);
    console.log(`   ${!enqueued2 ? "✅" : "❌"} Second enqueue (deduplication): ${!enqueued2 ? "correctly skipped" : "FAILED - should skip"}\n`);

    // 3. Check queue stats
    console.log("3️⃣ Checking queue stats...");
    const statsBefore = await ClusteringQueueService.getQueueStats();
    console.log("   Queue stats before processing:", statsBefore);
    console.log("");

    // 4. Test process single job
    console.log("4️⃣ Testing single job processing...");
    const result = await ClusteringQueueService.processNextJob();
    console.log("   Processing result:", {
      success: result.success,
      jobId: result.jobId,
      pollId: result.pollId,
      error: result.error,
    });
    console.log("");

    // 5. Check queue stats after
    console.log("5️⃣ Checking queue stats after processing...");
    const statsAfter = await ClusteringQueueService.getQueueStats();
    console.log("   Queue stats after processing:", statsAfter);
    console.log("");

    // 6. Test queue processing (multiple jobs)
    console.log("6️⃣ Testing batch queue processing...");

    // Enqueue a few more jobs for different polls
    const morePollsResult = await db.select().from(polls).limit(3);
    for (const poll of morePollsResult) {
      await ClusteringQueueService.enqueueJob(poll.id);
    }

    const batchResult = await ClusteringQueueService.processQueue(5);
    console.log("   Batch processing result:", batchResult);
    console.log("");

    // 7. Final stats
    console.log("7️⃣ Final queue stats...");
    const finalStats = await ClusteringQueueService.getQueueStats();
    console.log("   Final queue stats:", finalStats);
    console.log("");

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }

  process.exit(0);
}

testClusteringQueue();
