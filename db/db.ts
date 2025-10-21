import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, ageGroups, genders, ethnicities, politicalParties, userDemographics, userProfiles, userRoles, roleEnum, polls, pollStatusEnum, statements, votes, userPollInsights, pollResultsSummaries } from "./schema";

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
  pollResultsSummaries: pollResultsSummaries,
};

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Parse and validate connection string
const dbUrl = new URL(process.env.DATABASE_URL);
const isSessionMode = dbUrl.port === '5432';
const isTransactionMode = dbUrl.port === '6543';
const hasPgBouncer = dbUrl.searchParams.has('pgbouncer');

// Validate configuration and warn about mismatches
if (process.env.NODE_ENV === "development") {
  console.log(`[DB] Connecting to: ${dbUrl.hostname}:${dbUrl.port}`);
  console.log(`[DB] Mode: ${isSessionMode ? 'Session' : isTransactionMode ? 'Transaction' : 'Unknown'}`);

  if (isSessionMode && hasPgBouncer) {
    console.warn('⚠️  WARNING: Port 5432 (Session Mode) should NOT use ?pgbouncer=true');
    console.warn('   Recommendation: Remove ?pgbouncer=true OR switch to port 6543 (Transaction Mode)');
  } else if (isTransactionMode && !hasPgBouncer) {
    console.warn('⚠️  WARNING: Port 6543 (Transaction Mode) should use ?pgbouncer=true');
    console.warn('   Recommendation: Add ?pgbouncer=true to your connection string');
  }
}

/**
 * Singleton pattern for database client
 * Prevents connection exhaustion during Next.js development hot reloads
 *
 * In development, Next.js Hot Module Replacement (HMR) causes modules to reload,
 * which would create new database connections without closing old ones.
 * This pattern stores the client in globalThis to persist across reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __db_client: ReturnType<typeof postgres> | undefined;
}

let client: ReturnType<typeof postgres>;

if (process.env.NODE_ENV === "production") {
  // Production: Create new client (serverless functions are stateless)
  // OPTIMIZATION: Increased pool size for better production throughput
  client = postgres(process.env.DATABASE_URL, {
    // CRITICAL: Increased from 2 to 20 for production traffic
    // Each Vercel serverless function instance has its own pool
    // Higher pool size = more concurrent queries per function instance
    max: isTransactionMode ? 20 : 10,

    // OPTIMIZATION: Reduced timeouts for faster failure detection
    idle_timeout: 20, // Close idle connections after 20s
    connect_timeout: 10, // Fail fast if can't connect within 10s (down from 30s)
    max_lifetime: 60 * 30, // 30 minutes

    // OPTIMIZATION: Suppress notices in production (reduce log noise)
    onnotice: () => {},

    // CRITICAL: prepare: false required for Transaction Mode (port 6543)
    // Session Mode (port 5432) supports prepared statements
    prepare: isTransactionMode ? false : false, // Set to false for both modes for consistency
  });
} else {
  // Development: Use singleton pattern to persist client across hot reloads
  if (!global.__db_client) {
    console.log('[DB] Creating new database client (singleton)');
    global.__db_client = postgres(process.env.DATABASE_URL, {
      // Development can use larger pool for better performance
      max: 10,
      idle_timeout: 20,
      connect_timeout: 30,
      max_lifetime: 60 * 30,
      onnotice: () => {},
      prepare: isTransactionMode ? false : false,
      // Enable debug mode in development for troubleshooting
      debug: false, // Set to true for detailed query logging
    });

    // Test connection on first initialization
    global.__db_client`SELECT 1`
      .then(() => console.log('[DB] ✅ Connection test successful'))
      .catch((err) => {
        console.error("[DB] ❌ Connection test failed:", err.message);
        console.error("Please check:");
        console.error("1. Your Supabase project is active (not paused)");
        console.error("2. The DATABASE_URL in .env.local is correct");
        console.error("3. Your network can reach Supabase (check firewall/VPN)");
        console.error("4. Port and mode configuration are correct:");
        console.error(`   Current: Port ${dbUrl.port}, pgbouncer=${hasPgBouncer}`);
        console.error("   Session Mode: Port 5432 WITHOUT ?pgbouncer=true");
        console.error("   Transaction Mode: Port 6543 WITH ?pgbouncer=true");
      });
  } else {
    console.log('[DB] Reusing existing database client (singleton)');
  }

  client = global.__db_client;
}

export const db = drizzle(client, { schema });

/**
 * Graceful shutdown handler
 * Call this when your application is shutting down to close database connections
 */
export async function closeDatabase() {
  try {
    await client.end({ timeout: 5 });
    console.log('[DB] Connection closed successfully');
  } catch (error) {
    console.error('[DB] Error closing connection:', error);
  }
}

// Clean up on process termination
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', closeDatabase);
  process.on('SIGINT', closeDatabase);
}
