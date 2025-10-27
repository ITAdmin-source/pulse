import { ClusteringQueueService } from "../lib/services/clustering-queue-service";
import { db } from "../db/db";
import { polls } from "../db/schema";
import { eq } from "drizzle-orm";

async function enqueueTestJob() {
  const testPolls = await db
    .select()
    .from(polls)
    .where(eq(polls.status, "published"))
    .limit(1);

  if (testPolls.length > 0) {
    await ClusteringQueueService.enqueueJob(testPolls[0].id);
    console.log("✅ Job enqueued for poll:", testPolls[0].id);
  } else {
    console.log("❌ No published polls found");
  }

  process.exit(0);
}

enqueueTestJob();
