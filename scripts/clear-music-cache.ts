import { db } from "@/db/db";
import { userMusicRecommendations } from "@/db/schema";

async function clearMusicCache() {
  console.log("🗑️  Clearing music recommendation cache...\n");

  const result = await db.delete(userMusicRecommendations);

  console.log("✅ Music cache cleared successfully!");
  console.log(`   Deleted all cached music recommendations\n`);

  process.exit(0);
}

clearMusicCache().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
