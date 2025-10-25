import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

async function checkDatabaseData() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL not found");
      process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, {
      prepare: false,
    });

    console.log("\n════════════════════════════════════");
    console.log("  DATABASE DATA CHECK");
    console.log("════════════════════════════════════\n");

    const [pollCount] = await sql`SELECT COUNT(*) FROM polls`;
    const [userCount] = await sql`SELECT COUNT(*) FROM users`;
    const [voteCount] = await sql`SELECT COUNT(*) FROM votes`;
    const [statementCount] = await sql`SELECT COUNT(*) FROM statements`;

    console.log("Polls:", pollCount.count);
    console.log("Users:", userCount.count);
    console.log("Votes:", voteCount.count);
    console.log("Statements:", statementCount.count);
    console.log("\n════════════════════════════════════\n");

    // Get sample poll data
    const samplePolls = await sql`SELECT question, slug FROM polls LIMIT 5`;
    console.log("Sample Polls:");
    if (samplePolls.length === 0) {
      console.log("  (No polls found)");
    } else {
      samplePolls.forEach((poll: any) => {
        console.log(`  - ${poll.question} (slug: ${poll.slug})`);
      });
    }

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("Error checking database:", error);
    process.exit(1);
  }
}

checkDatabaseData();
