import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

// Create a test database connection
export function createTestDb() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
  const sql = postgres(connectionString, { max: 1 })
  return drizzle(sql, { schema })
}

// Helper to clean up database after tests
export async function cleanupTestDb(_db: ReturnType<typeof createTestDb>) {
  // Add cleanup logic here if needed
  // For now, we'll rely on transactions or test-specific cleanup
}