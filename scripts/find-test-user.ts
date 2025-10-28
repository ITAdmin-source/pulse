import { db } from "@/db/db";
import { sql } from "drizzle-orm";

async function findTestUser() {
  console.log("🔍 Finding users with 10+ votes on a poll...\n");

  const results = await db.execute<{
    user_id: string;
    poll_id: string;
    poll_question: string;
    poll_slug: string;
    vote_count: number;
  }>(sql`
    SELECT
      v.user_id,
      s.poll_id,
      p.question as poll_question,
      p.slug as poll_slug,
      COUNT(*)::int as vote_count
    FROM votes v
    JOIN statements s ON v.statement_id = s.id
    JOIN polls p ON s.poll_id = p.id
    GROUP BY v.user_id, s.poll_id, p.question, p.slug
    HAVING COUNT(*) >= 10
    ORDER BY vote_count DESC
    LIMIT 5
  `);

  console.log("📊 Found users with 10+ votes:\n");
  results.forEach((r, i) => {
    console.log(`${i + 1}. User: ${r.user_id}`);
    console.log(`   Poll: ${r.poll_question} (slug: ${r.poll_slug})`);
    console.log(`   Poll ID: ${r.poll_id}`);
    console.log(`   Votes: ${r.vote_count}\n`);
  });

  if (results.length > 0) {
    const first = results[0];
    console.log("✅ Use this for testing:");
    console.log(`   userId: "${first.user_id}"`);
    console.log(`   pollId: "${first.poll_id}"`);
    console.log(`   Test URL: http://localhost:3000/polls/${first.poll_slug}`);
  }

  process.exit(0);
}

findTestUser().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
