import { type Poll, type Statement, type User, type Vote, type UserRole } from '@/db/schema'
import { db } from '@/db/db'
import { polls, statements, users, votes, userRoles } from '@/db/schema'
import { fixtureScenarios, testPolls, testUsers, testStatements, testVotes, testUserRoles } from '../fixtures/db-fixtures'

/**
 * Database testing utilities for integration tests
 * These helpers manage test data seeding and cleanup
 */

export class DatabaseTestHelper {
  /**
   * Clean all test data from the database
   */
  async cleanup(): Promise<void> {
    try {
      // Delete in reverse dependency order to avoid foreign key violations
      await db.delete(votes)
      await db.delete(userRoles)
      await db.delete(statements)
      await db.delete(polls)
      await db.delete(users)
    } catch (error) {
      console.warn('Cleanup warning:', error)
      // Don't throw on cleanup errors in case of missing tables
    }
  }

  /**
   * Seed basic test data (users, polls, statements)
   */
  async seedBasicData(): Promise<{
    users: User[]
    polls: Poll[]
    statements: Statement[]
  }> {
    // Insert users first (no dependencies)
    const insertedUsers = await db
      .insert(users)
      .values(Object.values(testUsers))
      .returning()

    // Insert polls (depend on users)
    const insertedPolls = await db
      .insert(polls)
      .values(Object.values(testPolls))
      .returning()

    // Insert statements (depend on polls and users)
    const insertedStatements = await db
      .insert(statements)
      .values(Object.values(testStatements))
      .returning()

    return {
      users: insertedUsers,
      polls: insertedPolls,
      statements: insertedStatements,
    }
  }

  /**
   * Seed voting data (requires basic data to exist)
   */
  async seedVotingData(): Promise<{ votes: Vote[] }> {
    const allVotes = Object.values(testVotes).flat()

    const insertedVotes = await db
      .insert(votes)
      .values(allVotes)
      .returning()

    return { votes: insertedVotes }
  }

  /**
   * Seed role data for permission testing
   */
  async seedRoleData(): Promise<{ roles: UserRole[] }> {
    const insertedRoles = await db
      .insert(userRoles)
      .values(Object.values(testUserRoles))
      .returning()

    return { roles: insertedRoles }
  }

  /**
   * Seed a complete scenario with all related data
   */
  async seedScenario(scenarioName: keyof typeof fixtureScenarios): Promise<{
    users: User[]
    polls: Poll[]
    statements: Statement[]
    votes: Vote[]
    roles: UserRole[]
  }> {
    const scenario = fixtureScenarios[scenarioName]

    // Extract data arrays from scenario
    const scenarioUsers = 'users' in scenario ? scenario.users : 'user' in scenario ? [scenario.user] : []
    const scenarioPolls = 'polls' in scenario ? scenario.polls : 'poll' in scenario ? [scenario.poll] : []
    const scenarioStatements = 'statements' in scenario ? scenario.statements : 'statement' in scenario ? [scenario.statement] : []
    const scenarioVotes = 'votes' in scenario ? scenario.votes : 'vote' in scenario ? [scenario.vote] : []
    const scenarioRoles = 'roles' in scenario ? scenario.roles : []

    // Insert data in dependency order
    const insertedUsers = scenarioUsers.length > 0
      ? await db.insert(users).values(scenarioUsers).returning()
      : []

    const insertedPolls = scenarioPolls.length > 0
      ? await db.insert(polls).values(scenarioPolls).returning()
      : []

    const insertedStatements = scenarioStatements.length > 0
      ? await db.insert(statements).values(scenarioStatements).returning()
      : []

    const insertedVotes = scenarioVotes.length > 0
      ? await db.insert(votes).values(scenarioVotes).returning()
      : []

    const insertedRoles = scenarioRoles.length > 0
      ? await db.insert(userRoles).values(scenarioRoles).returning()
      : []

    return {
      users: insertedUsers,
      polls: insertedPolls,
      statements: insertedStatements,
      votes: insertedVotes,
      roles: insertedRoles,
    }
  }

  /**
   * Get all data for a specific poll (statements, votes, etc.)
   */
  async getPollData(pollId: string): Promise<{
    poll: Poll | undefined
    statements: Statement[]
    votes: Vote[]
  }> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)

    const pollStatements = await db
      .select()
      .from(statements)
      .where(eq(statements.pollId, pollId))

    const statementIds = pollStatements.map(s => s.id)
    const pollVotes = statementIds.length > 0
      ? await db.select().from(votes).where(inArray(votes.statementId, statementIds))
      : []

    return {
      poll,
      statements: pollStatements,
      votes: pollVotes,
    }
  }

  /**
   * Get all votes by a specific user
   */
  async getUserVotes(userId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.userId, userId))
  }

  /**
   * Get user roles for permission testing
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.userId, userId))
  }

  /**
   * Create a test transaction for isolated testing
   */
  async withTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await db.transaction(async (tx) => {
      try {
        const result = await callback(tx)
        // Rollback transaction to keep test isolation
        throw new TestRollbackError(result)
      } catch (error) {
        if (error instanceof TestRollbackError) {
          return error.result
        }
        throw error
      }
    })
  }

  /**
   * Assert expected data counts in database
   */
  async assertCounts(expected: {
    users?: number
    polls?: number
    statements?: number
    votes?: number
    roles?: number
  }): Promise<void> {
    const checks = []

    if (expected.users !== undefined) {
      const userCount = await db.$count(users)
      checks.push({ table: 'users', expected: expected.users, actual: userCount })
    }

    if (expected.polls !== undefined) {
      const pollCount = await db.$count(polls)
      checks.push({ table: 'polls', expected: expected.polls, actual: pollCount })
    }

    if (expected.statements !== undefined) {
      const statementCount = await db.$count(statements)
      checks.push({ table: 'statements', expected: expected.statements, actual: statementCount })
    }

    if (expected.votes !== undefined) {
      const voteCount = await db.$count(votes)
      checks.push({ table: 'votes', expected: expected.votes, actual: voteCount })
    }

    if (expected.roles !== undefined) {
      const roleCount = await db.$count(userRoles)
      checks.push({ table: 'userRoles', expected: expected.roles, actual: roleCount })
    }

    // Check all counts
    for (const check of checks) {
      if (check.actual !== check.expected) {
        throw new Error(
          `Database count mismatch for ${check.table}: expected ${check.expected}, got ${check.actual}`
        )
      }
    }
  }

  /**
   * Wait for database operations to complete (useful for async operations)
   */
  async waitForConsistency(maxWaitMs: number = 1000): Promise<void> {
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Simple query to test database responsiveness
        await db.select().from(users).limit(1)
        return
      } catch (error) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    throw new Error(`Database did not become consistent within ${maxWaitMs}ms`)
  }
}

/**
 * Custom error for transaction rollback testing
 */
class TestRollbackError extends Error {
  constructor(public result: any) {
    super('Test transaction rollback')
    this.name = 'TestRollbackError'
  }
}

/**
 * Utility functions for common database operations in tests
 */
export const dbTestUtils = {
  /**
   * Create a fresh database helper instance
   */
  createHelper(): DatabaseTestHelper {
    return new DatabaseTestHelper()
  },

  /**
   * Setup function for integration tests
   */
  async setupTest(): Promise<DatabaseTestHelper> {
    const helper = new DatabaseTestHelper()
    await helper.cleanup()
    return helper
  },

  /**
   * Teardown function for integration tests
   */
  async teardownTest(helper: DatabaseTestHelper): Promise<void> {
    await helper.cleanup()
  },

  /**
   * Quick setup with basic data for most tests
   */
  async quickSetup(): Promise<{
    helper: DatabaseTestHelper
    data: {
      users: User[]
      polls: Poll[]
      statements: Statement[]
    }
  }> {
    const helper = await this.setupTest()
    const data = await helper.seedBasicData()
    return { helper, data }
  },

  /**
   * Full setup with voting data for complex tests
   */
  async fullSetup(): Promise<{
    helper: DatabaseTestHelper
    data: {
      users: User[]
      polls: Poll[]
      statements: Statement[]
      votes: Vote[]
      roles: UserRole[]
    }
  }> {
    const helper = await this.setupTest()
    const basicData = await helper.seedBasicData()
    const votingData = await helper.seedVotingData()
    const roleData = await helper.seedRoleData()

    return {
      helper,
      data: {
        ...basicData,
        ...votingData,
        ...roleData,
      },
    }
  },
}

// Import necessary Drizzle operators
import { eq, inArray } from 'drizzle-orm'

// Re-export for convenience
export { eq, inArray } from 'drizzle-orm'
export { fixtureScenarios, testPolls, testUsers, testStatements, testVotes, testUserRoles }