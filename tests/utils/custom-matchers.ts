import { expect } from 'vitest'
import { type VoteValue } from '@/lib/utils/voting'

/**
 * Custom Vitest matchers for domain-specific assertions
 * These matchers provide better error messages and test readability
 */

interface VoteDistribution {
  agree: number
  disagree: number
  neutral: number
  total: number
  percentages?: {
    agree: number
    disagree: number
    neutral: number
  }
}

interface CustomMatchers<R = unknown> {
  toBeValidVote(): R
  toBeValidSlug(): R
  toHaveVoteDistribution(expected: VoteDistribution): R
  toBeValidUUID(): R
  toBeValidEmail(): R
  toBeValidPollStatus(): R
  toBeWithinDateRange(start: Date, end: Date): R
  toHavePermission(permission: string, pollId?: string): R
  toMatchUserRole(expectedRole: string): R
  toBeApprovalState(expectedState: boolean | null): R
  toHaveValidTimestamps(): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

expect.extend({
  /**
   * Check if value is a valid vote (-1, 0, or 1)
   */
  toBeValidVote(received: unknown) {
    const validVotes: VoteValue[] = [-1, 0, 1]
    const pass = typeof received === 'number' && validVotes.includes(received as VoteValue)

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid vote value`
        : `Expected ${received} to be a valid vote value (-1, 0, or 1), but got ${typeof received} ${received}`
    }
  },

  /**
   * Check if string is a valid slug (lowercase, hyphen-separated)
   */
  toBeValidSlug(received: unknown) {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    const pass = typeof received === 'string' &&
                 received.length > 0 &&
                 received.length <= 100 &&
                 slugPattern.test(received)

    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be a valid slug`
        : `Expected "${received}" to be a valid slug (lowercase alphanumeric with hyphens, 1-100 chars)`
    }
  },

  /**
   * Check if vote distribution matches expected values
   */
  toHaveVoteDistribution(received: unknown, expected: VoteDistribution) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () => `Expected vote distribution object, but got ${typeof received}`
      }
    }

    const dist = received as VoteDistribution
    const pass =
      dist.agree === expected.agree &&
      dist.disagree === expected.disagree &&
      dist.neutral === expected.neutral &&
      dist.total === expected.total

    return {
      pass,
      message: () => pass
        ? `Expected vote distribution not to match ${JSON.stringify(expected)}`
        : `Expected vote distribution to match:\n  ${JSON.stringify(expected)}\nBut received:\n  ${JSON.stringify(dist)}`
    }
  },

  /**
   * Check if string is a valid UUID
   */
  toBeValidUUID(received: unknown) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const pass = typeof received === 'string' && uuidPattern.test(received)

    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be a valid UUID`
        : `Expected "${received}" to be a valid UUID format`
    }
  },

  /**
   * Check if string is a valid email address
   */
  toBeValidEmail(received: unknown) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = typeof received === 'string' && emailPattern.test(received)

    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be a valid email`
        : `Expected "${received}" to be a valid email address`
    }
  },

  /**
   * Check if value is a valid poll status
   */
  toBeValidPollStatus(received: unknown) {
    const validStatuses = ['draft', 'published', 'closed']
    const pass = typeof received === 'string' && validStatuses.includes(received)

    return {
      pass,
      message: () => pass
        ? `Expected "${received}" not to be a valid poll status`
        : `Expected "${received}" to be a valid poll status (draft, published, or closed)`
    }
  },

  /**
   * Check if date is within a specific range
   */
  toBeWithinDateRange(received: unknown, start: Date, end: Date) {
    if (!(received instanceof Date)) {
      return {
        pass: false,
        message: () => `Expected a Date object, but got ${typeof received}`
      }
    }

    const pass = received >= start && received <= end

    return {
      pass,
      message: () => pass
        ? `Expected date ${received.toISOString()} not to be between ${start.toISOString()} and ${end.toISOString()}`
        : `Expected date ${received.toISOString()} to be between ${start.toISOString()} and ${end.toISOString()}`
    }
  },

  /**
   * Check if user roles array includes a specific permission for a poll
   */
  toHavePermission(received: unknown, permission: string, pollId?: string) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected an array of user roles, but got ${typeof received}`
      }
    }

    // Mock implementation - in real tests, this would use the actual permission logic
    const roles = received as any[]

    // System admin has all permissions
    const hasSystemAdmin = roles.some(role => role.role === 'system_admin')
    if (hasSystemAdmin) {
      return {
        pass: true,
        message: () => `Expected user not to have ${permission} permission (system admin has all permissions)`
      }
    }

    // Check poll-specific permissions
    if (pollId) {
      const relevantRoles = roles.filter(role => role.pollId === pollId || role.pollId === null)

      // Poll owner has most permissions
      const isPollOwner = relevantRoles.some(role => role.role === 'poll_owner')
      if (isPollOwner && ['poll_owner', 'poll_manager', 'view_analytics', 'approve_statements', 'edit_poll_settings', 'manage_poll_roles'].includes(permission)) {
        return {
          pass: true,
          message: () => `Expected user not to have ${permission} permission for poll ${pollId}`
        }
      }

      // Poll manager has limited permissions
      const isPollManager = relevantRoles.some(role => role.role === 'poll_manager')
      if (isPollManager && ['poll_manager', 'view_analytics', 'approve_statements', 'edit_poll_settings'].includes(permission)) {
        return {
          pass: true,
          message: () => `Expected user not to have ${permission} permission for poll ${pollId}`
        }
      }
    }

    return {
      pass: false,
      message: () => `Expected user to have ${permission} permission${pollId ? ` for poll ${pollId}` : ''}, but permission was denied`
    }
  },

  /**
   * Check if user role matches expected role
   */
  toMatchUserRole(received: unknown, expectedRole: string) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () => `Expected user role object, but got ${typeof received}`
      }
    }

    const role = received as any
    const pass = role.role === expectedRole

    return {
      pass,
      message: () => pass
        ? `Expected user role not to be "${expectedRole}"`
        : `Expected user role to be "${expectedRole}", but got "${role.role}"`
    }
  },

  /**
   * Check if statement approval state matches expected state
   */
  toBeApprovalState(received: unknown, expectedState: boolean | null) {
    const pass = received === expectedState

    return {
      pass,
      message: () => {
        const stateNames = {
          true: 'approved',
          false: 'rejected',
          null: 'pending'
        }

        const expectedName = stateNames[String(expectedState) as keyof typeof stateNames]
        const receivedName = stateNames[String(received) as keyof typeof stateNames] || String(received)

        return pass
          ? `Expected statement not to be ${expectedName}`
          : `Expected statement to be ${expectedName}, but got ${receivedName}`
      }
    }
  },

  /**
   * Check if object has valid createdAt and updatedAt timestamps
   */
  toHaveValidTimestamps(received: unknown) {
    if (typeof received !== 'object' || received === null) {
      return {
        pass: false,
        message: () => `Expected object with timestamps, but got ${typeof received}`
      }
    }

    const obj = received as any
    const hasCreatedAt = obj.createdAt instanceof Date
    const hasUpdatedAt = obj.updatedAt instanceof Date
    const validOrder = hasCreatedAt && hasUpdatedAt ? obj.createdAt <= obj.updatedAt : true

    const pass = hasCreatedAt && hasUpdatedAt && validOrder

    if (!hasCreatedAt) {
      return {
        pass: false,
        message: () => `Expected object to have valid createdAt timestamp, but got ${typeof obj.createdAt}`
      }
    }

    if (!hasUpdatedAt) {
      return {
        pass: false,
        message: () => `Expected object to have valid updatedAt timestamp, but got ${typeof obj.updatedAt}`
      }
    }

    if (!validOrder) {
      return {
        pass: false,
        message: () => `Expected updatedAt (${obj.updatedAt.toISOString()}) to be >= createdAt (${obj.createdAt.toISOString()})`
      }
    }

    return {
      pass: true,
      message: () => `Expected object not to have valid timestamps`
    }
  },
})

/**
 * Additional assertion helpers for common patterns
 */
export const assertHelpers = {
  /**
   * Assert that a poll has valid basic properties
   */
  assertValidPoll(poll: any) {
    expect(poll.id).toBeValidUUID()
    expect(poll.slug).toBeValidSlug()
    expect(poll.status).toBeValidPollStatus()
    expect(poll).toHaveValidTimestamps()
    expect(poll.question).toBeTruthy()
    expect(typeof poll.allowUserStatements).toBe('boolean')
    expect(typeof poll.autoApproveStatements).toBe('boolean')
    expect(typeof poll.minStatementsVotedToEnd).toBe('number')
    expect(poll.minStatementsVotedToEnd).toBeGreaterThanOrEqual(1)
  },

  /**
   * Assert that a statement has valid basic properties
   */
  assertValidStatement(statement: any) {
    expect(statement.id).toBeValidUUID()
    expect(statement.pollId).toBeValidUUID()
    expect(statement.createdBy).toBeValidUUID()
    expect(statement).toHaveValidTimestamps()
    expect(statement.text).toBeTruthy()
    expect(typeof statement.text).toBe('string')
    expect(statement.text.length).toBeGreaterThan(0)
    expect(statement.text.length).toBeLessThanOrEqual(500)
  },

  /**
   * Assert that a vote has valid basic properties
   */
  assertValidVote(vote: any) {
    expect(vote.id).toBeValidUUID()
    expect(vote.userId).toBeValidUUID()
    expect(vote.statementId).toBeValidUUID()
    expect(vote.value).toBeValidVote()
    expect(vote).toHaveValidTimestamps()
  },

  /**
   * Assert that a user has valid basic properties
   */
  assertValidUser(user: any) {
    expect(user.id).toBeValidUUID()
    expect(user).toHaveValidTimestamps()
    expect(typeof user.isAnonymous).toBe('boolean')

    if (user.isAnonymous) {
      expect(user.sessionId).toBeTruthy()
      expect(user.clerkUserId).toBeNull()
    } else {
      expect(user.clerkUserId).toBeTruthy()
      expect(user.sessionId).toBeNull()
    }
  },

  /**
   * Assert that a vote distribution is mathematically consistent
   */
  assertConsistentDistribution(distribution: VoteDistribution) {
    expect(distribution.total).toBe(distribution.agree + distribution.disagree + distribution.neutral)

    if (distribution.percentages) {
      const totalPercentage = distribution.percentages.agree + distribution.percentages.disagree + distribution.percentages.neutral
      expect(totalPercentage).toBeCloseTo(100, 1) // Allow for rounding differences
    }
  },
}

// Re-export the extended expect for convenience
export { expect }