import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, ageGroups, genders, ethnicities, politicalParties, userDemographics, userProfiles, userRoles, roleEnum, polls, pollStatusEnum, statements, votes, userPollInsights } from "./schema";

config({ path: ".env.local" });

const schema = {
  users: users,
  ageGroups: ageGroups,
  genders: genders,
  ethnicities: ethnicities,
  politicalParties: politicalParties,
  userDemographics: userDemographics,
  userProfiles: userProfiles,
  userRoles: userRoles,
  roleEnum: roleEnum,
  polls: polls,
  pollStatusEnum: pollStatusEnum,
  statements: statements,
  votes: votes,
  userPollInsights: userPollInsights,
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

let client: ReturnType<typeof postgres>;

try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log(`Attempting to connect to database at: ${dbUrl.hostname}`);

  client = postgres(process.env.DATABASE_URL, {
    max: 1, // Limit connections for serverless
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {}, // Suppress notices
  });

  // Test connection on startup in development
  if (process.env.NODE_ENV === "development") {
    client`SELECT 1`.catch((err) => {
      console.error("Database connection test failed:", err.message);
      console.error("Please check:");
      console.error("1. Your Supabase project is active (not paused)");
      console.error("2. The DATABASE_URL in .env.local is correct");
      console.error("3. Your network can reach Supabase (check firewall/VPN)");
    });
  }
} catch (error) {
  console.error("Failed to initialize database client:", error);
  throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
}

export const db = drizzle(client, { schema });