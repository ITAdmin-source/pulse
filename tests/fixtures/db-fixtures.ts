import { type Poll, type Statement, type User, type Vote, type UserRole } from '@/db/schema'
import { createMockPoll, createMockStatement, createMockUser, createMockVote } from '../utils/test-helpers'

/**
 * Database fixtures for comprehensive testing scenarios
 */

// Base test users with different configurations
export const testUsers = {
  anonymousUser: createMockUser({
    id: 'user-anonymous-1',
    sessionId: 'session-anon-123',
    clerkUserId: null,
  }),

  authenticatedUser: createMockUser({
    id: 'user-auth-1',
    sessionId: null,
    clerkUserId: 'clerk-auth-456',
  }),

  systemAdmin: createMockUser({
    id: 'user-admin-1',
    sessionId: null,
    clerkUserId: 'clerk-admin-789',
    isAnonymous: false,
  }),

  pollOwner: createMockUser({
    id: 'user-owner-1',
    sessionId: null,
    clerkUserId: 'clerk-owner-101',
    isAnonymous: false,
  }),

  pollManager: createMockUser({
    id: 'user-manager-1',
    sessionId: null,
    clerkUserId: 'clerk-manager-102',
    isAnonymous: false,
  }),
} as const

// Base test polls with different states
export const testPolls = {
  draftPoll: createMockPoll({
    id: 'poll-draft-1',
    slug: 'draft-poll-climate',
    question: 'What should we do about climate change?',
    description: 'A draft poll about climate policy',
    status: 'draft',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: false,
    minStatementsVotedToEnd: 3,
    startTime: new Date('2024-03-01T10:00:00Z'),
    endTime: new Date('2024-03-15T10:00:00Z'),
  }),

  publishedPoll: createMockPoll({
    id: 'poll-published-1',
    slug: 'published-poll-education',
    question: 'How can we improve public education?',
    description: 'An active poll about education reform',
    status: 'published',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: true,
    minStatementsVotedToEnd: 5,
    startTime: new Date('2024-02-01T10:00:00Z'),
    endTime: new Date('2024-04-01T10:00:00Z'),
  }),

  closedPoll: createMockPoll({
    id: 'poll-closed-1',
    slug: 'closed-poll-transport',
    question: 'How should we improve public transportation?',
    description: 'A completed poll about transportation',
    status: 'closed',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: false,
    autoApproveStatements: false,
    minStatementsVotedToEnd: 4,
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-31T10:00:00Z'),
  }),

  autoApprovePoll: createMockPoll({
    id: 'poll-auto-approve-1',
    slug: 'auto-approve-poll-health',
    question: 'What healthcare policies should we prioritize?',
    description: 'Poll with auto-approve enabled',
    status: 'published',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: true,
    minStatementsVotedToEnd: 2,
    startTime: new Date('2024-02-15T10:00:00Z'),
    endTime: new Date('2024-03-15T10:00:00Z'),
  }),
} as const

// Test statements covering different approval states
export const testStatements = {
  // Approved statements for published poll
  approvedStatement1: createMockStatement({
    id: 'statement-approved-1',
    text: 'We should increase funding for public schools',
    pollId: testPolls.publishedPoll.id,
    createdBy: testUsers.authenticatedUser.id,
    approved: true,
    createdAt: new Date('2024-02-05T10:00:00Z'),
  }),

  approvedStatement2: createMockStatement({
    id: 'statement-approved-2',
    text: 'Teacher salaries should be increased significantly',
    pollId: testPolls.publishedPoll.id,
    createdBy: testUsers.anonymousUser.id,
    approved: true,
    createdAt: new Date('2024-02-06T10:00:00Z'),
  }),

  approvedStatement3: createMockStatement({
    id: 'statement-approved-3',
    text: 'We need more vocational training programs',
    pollId: testPolls.publishedPoll.id,
    createdBy: testUsers.authenticatedUser.id,
    approved: true,
    createdAt: new Date('2024-02-07T10:00:00Z'),
  }),

  // Pending statements (awaiting approval)
  pendingStatement1: createMockStatement({
    id: 'statement-pending-1',
    text: 'Private school vouchers should be expanded',
    pollId: testPolls.publishedPoll.id,
    createdBy: testUsers.authenticatedUser.id,
    approved: null,
    createdAt: new Date('2024-02-10T10:00:00Z'),
  }),

  pendingStatement2: createMockStatement({
    id: 'statement-pending-2',
    text: 'Standardized testing should be eliminated',
    pollId: testPolls.publishedPoll.id,
    createdBy: testUsers.anonymousUser.id,
    approved: null,
    createdAt: new Date('2024-02-11T10:00:00Z'),
  }),

  // Statements for auto-approve poll (automatically approved)
  autoApprovedStatement: createMockStatement({
    id: 'statement-auto-approved-1',
    text: 'Universal healthcare should be implemented',
    pollId: testPolls.autoApprovePoll.id,
    createdBy: testUsers.authenticatedUser.id,
    approved: true,
    createdAt: new Date('2024-02-16T10:00:00Z'),
  }),

  // Statements for closed poll
  closedPollStatement: createMockStatement({
    id: 'statement-closed-1',
    text: 'Bus rapid transit should be prioritized',
    pollId: testPolls.closedPoll.id,
    createdBy: testUsers.authenticatedUser.id,
    approved: true,
    createdAt: new Date('2024-01-05T10:00:00Z'),
  }),
} as const

// Test votes creating various distribution patterns
export const testVotes = {
  // Votes creating polarized distribution on statement 1
  polarizedVotes: [
    createMockVote({
      id: 'vote-polarized-1',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
      createdAt: new Date('2024-02-08T10:00:00Z'),
    }),
    createMockVote({
      id: 'vote-polarized-2',
      userId: testUsers.anonymousUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
      createdAt: new Date('2024-02-08T11:00:00Z'),
    }),
    createMockVote({
      id: 'vote-polarized-3',
      userId: testUsers.pollManager.id,
      statementId: testStatements.approvedStatement1.id,
      value: -1,
      createdAt: new Date('2024-02-08T12:00:00Z'),
    }),
  ],

  // Votes creating consensus distribution on statement 2
  consensusVotes: [
    createMockVote({
      id: 'vote-consensus-1',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T10:00:00Z'),
    }),
    createMockVote({
      id: 'vote-consensus-2',
      userId: testUsers.anonymousUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T11:00:00Z'),
    }),
    createMockVote({
      id: 'vote-consensus-3',
      userId: testUsers.pollManager.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T12:00:00Z'),
    }),
    createMockVote({
      id: 'vote-consensus-4',
      userId: testUsers.pollOwner.id,
      statementId: testStatements.approvedStatement2.id,
      value: 0,
      createdAt: new Date('2024-02-09T13:00:00Z'),
    }),
  ],

  // Votes showing user meeting voting threshold
  thresholdVotes: [
    createMockVote({
      id: 'vote-threshold-1',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
    }),
    createMockVote({
      id: 'vote-threshold-2',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
    }),
    createMockVote({
      id: 'vote-threshold-3',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement3.id,
      value: 0,
    }),
    createMockVote({
      id: 'vote-threshold-4',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.autoApprovedStatement.id,
      value: -1,
    }),
    createMockVote({
      id: 'vote-threshold-5',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.closedPollStatement.id,
      value: 1,
    }),
  ],
} as const

// Test user roles for permission testing
export const testUserRoles = {
  systemAdminRole: {
    id: 'role-system-admin-1',
    userId: testUsers.systemAdmin.id,
    role: 'system_admin' as const,
    pollId: null,
    assignedAt: new Date('2024-01-01T10:00:00Z'),
    assignedBy: 'system',
  },

  pollOwnerRole: {
    id: 'role-poll-owner-1',
    userId: testUsers.pollOwner.id,
    role: 'poll_owner' as const,
    pollId: testPolls.publishedPoll.id,
    assignedAt: new Date('2024-02-01T10:00:00Z'),
    assignedBy: testUsers.systemAdmin.id,
  },

  pollManagerRole: {
    id: 'role-poll-manager-1',
    userId: testUsers.pollManager.id,
    role: 'poll_manager' as const,
    pollId: testPolls.publishedPoll.id,
    assignedAt: new Date('2024-02-02T10:00:00Z'),
    assignedBy: testUsers.pollOwner.id,
  },
} as const

// Complete fixture sets for complex scenarios
export const fixtureScenarios = {
  /**
   * Complete polling scenario with multiple users, statements, and votes
   */
  educationPollScenario: {
    poll: testPolls.publishedPoll,
    statements: [
      testStatements.approvedStatement1,
      testStatements.approvedStatement2,
      testStatements.approvedStatement3,
      testStatements.pendingStatement1,
      testStatements.pendingStatement2,
    ],
    votes: [
      ...testVotes.polarizedVotes,
      ...testVotes.consensusVotes,
      ...testVotes.thresholdVotes.slice(0, 3), // First 3 votes for this poll
    ],
    users: [
      testUsers.authenticatedUser,
      testUsers.anonymousUser,
      testUsers.pollOwner,
      testUsers.pollManager,
    ],
    roles: [
      testUserRoles.pollOwnerRole,
      testUserRoles.pollManagerRole,
    ],
  },

  /**
   * Auto-approval scenario for testing statement workflows
   */
  autoApprovalScenario: {
    poll: testPolls.autoApprovePoll,
    statements: [testStatements.autoApprovedStatement],
    votes: [testVotes.thresholdVotes[3]], // One vote on auto-approved statement
    users: [testUsers.authenticatedUser, testUsers.pollOwner],
    roles: [testUserRoles.pollOwnerRole],
  },

  /**
   * Administrative scenario with system admin permissions
   */
  adminScenario: {
    polls: [testPolls.draftPoll, testPolls.publishedPoll, testPolls.closedPoll],
    users: [testUsers.systemAdmin, testUsers.pollOwner],
    roles: [testUserRoles.systemAdminRole],
  },

  /**
   * Minimal scenario for simple testing
   */
  minimalScenario: {
    poll: testPolls.publishedPoll,
    statement: testStatements.approvedStatement1,
    user: testUsers.authenticatedUser,
    vote: testVotes.polarizedVotes[0],
  },
} as const

// Helper functions for working with fixtures
export const fixtureHelpers = {
  /**
   * Get all users from a scenario
   */
  getUsersFromScenario(scenario: keyof typeof fixtureScenarios): User[] {
    const scenarioData = fixtureScenarios[scenario]
    if ('users' in scenarioData) {
      return scenarioData.users
    }
    if ('user' in scenarioData) {
      return [scenarioData.user]
    }
    return []
  },

  /**
   * Get all polls from a scenario
   */
  getPollsFromScenario(scenario: keyof typeof fixtureScenarios): Poll[] {
    const scenarioData = fixtureScenarios[scenario]
    if ('polls' in scenarioData) {
      return scenarioData.polls
    }
    if ('poll' in scenarioData) {
      return [scenarioData.poll]
    }
    return []
  },

  /**
   * Get all statements from a scenario
   */
  getStatementsFromScenario(scenario: keyof typeof fixtureScenarios): Statement[] {
    const scenarioData = fixtureScenarios[scenario]
    if ('statements' in scenarioData) {
      return scenarioData.statements
    }
    if ('statement' in scenarioData) {
      return [scenarioData.statement]
    }
    return []
  },

  /**
   * Get all votes from a scenario
   */
  getVotesFromScenario(scenario: keyof typeof fixtureScenarios): Vote[] {
    const scenarioData = fixtureScenarios[scenario]
    if ('votes' in scenarioData) {
      return scenarioData.votes
    }
    if ('vote' in scenarioData) {
      return [scenarioData.vote]
    }
    return []
  },

  /**
   * Get expected vote distribution for a statement
   */
  getExpectedDistribution(statementId: string) {
    const allVotes = Object.values(testVotes).flat()
    const statementVotes = allVotes.filter(vote => vote.statementId === statementId)

    const agree = statementVotes.filter(vote => vote.value === 1).length
    const disagree = statementVotes.filter(vote => vote.value === -1).length
    const neutral = statementVotes.filter(vote => vote.value === 0).length
    const total = statementVotes.length

    return {
      agree,
      disagree,
      neutral,
      total,
      percentages: {
        agree: total > 0 ? Math.round((agree / total) * 100 * 100) / 100 : 0,
        disagree: total > 0 ? Math.round((disagree / total) * 100 * 100) / 100 : 0,
        neutral: total > 0 ? Math.round((neutral / total) * 100 * 100) / 100 : 0,
      },
    }
  },

  /**
   * Check if user has met voting threshold for a poll
   */
  hasUserMetThreshold(userId: string, pollId: string): boolean {
    const poll = Object.values(testPolls).find(p => p.id === pollId)
    if (!poll) return false

    const allVotes = Object.values(testVotes).flat()
    const userVotes = allVotes.filter(vote => vote.userId === userId)
    const statements = Object.values(testStatements).filter(s => s.pollId === pollId && s.approved === true)
    const pollVotes = userVotes.filter(vote =>
      statements.some(statement => statement.id === vote.statementId)
    )

    return pollVotes.length >= poll.minStatementsVotedToEnd
  },
}