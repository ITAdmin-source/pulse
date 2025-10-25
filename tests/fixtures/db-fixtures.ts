import { type Poll, type Statement, type User, type Vote, type UserRole } from '@/db/schema'
import { createMockPoll, createMockStatement, createMockUser, createMockVote } from '../utils/test-helpers'

/**
 * Database fixtures for comprehensive testing scenarios
 */

// Base test users with different configurations (using proper UUIDs)
export const testUsers = {
  anonymousUser: createMockUser({
    id: '00000000-0000-0000-0000-000000000001',
    sessionId: 'session-anon-123',
    clerkUserId: null,
  }),

  authenticatedUser: createMockUser({
    id: '00000000-0000-0000-0000-000000000002',
    sessionId: null,
    clerkUserId: 'clerk-auth-456',
  }),

  systemAdmin: createMockUser({
    id: '00000000-0000-0000-0000-000000000003',
    sessionId: null,
    clerkUserId: 'clerk-admin-789',
    isAnonymous: false,
  }),

  pollOwner: createMockUser({
    id: '00000000-0000-0000-0000-000000000004',
    sessionId: null,
    clerkUserId: 'clerk-owner-101',
    isAnonymous: false,
  }),

  pollManager: createMockUser({
    id: '00000000-0000-0000-0000-000000000005',
    sessionId: null,
    clerkUserId: 'clerk-manager-102',
    isAnonymous: false,
  }),
} as const

// Base test polls with different states (using proper UUIDs)
export const testPolls = {
  draftPoll: createMockPoll({
    id: '10000000-0000-0000-0000-000000000001',
    slug: 'draft-poll-climate',
    question: 'What should we do about climate change?',
    description: 'A draft poll about climate policy',
    status: 'draft',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: false,
    startTime: new Date('2024-03-01T10:00:00Z'),
    endTime: new Date('2024-03-15T10:00:00Z'),
  }),

  publishedPoll: createMockPoll({
    id: '10000000-0000-0000-0000-000000000002',
    slug: 'published-poll-education',
    question: 'How can we improve public education?',
    description: 'An active poll about education reform',
    status: 'published',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: true,
    startTime: new Date('2024-02-01T10:00:00Z'),
    endTime: new Date('2024-04-01T10:00:00Z'),
  }),

  closedPoll: createMockPoll({
    id: '10000000-0000-0000-0000-000000000003',
    slug: 'closed-poll-transport',
    question: 'How should we improve public transportation?',
    description: 'A completed poll about transportation',
    status: 'closed',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: false,
    autoApproveStatements: false,
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-31T10:00:00Z'),
  }),

  autoApprovePoll: createMockPoll({
    id: '10000000-0000-0000-0000-000000000004',
    slug: 'auto-approve-poll-health',
    question: 'What healthcare policies should we prioritize?',
    description: 'Poll with auto-approve enabled',
    status: 'published',
    createdBy: testUsers.pollOwner.id,
    allowUserStatements: true,
    autoApproveStatements: true,
    startTime: new Date('2024-02-15T10:00:00Z'),
    endTime: new Date('2024-03-15T10:00:00Z'),
  }),
} as const

// Test statements covering different approval states (using proper UUIDs)
export const testStatements = {
  // Approved statements for published poll
  approvedStatement1: createMockStatement({
    id: '20000000-0000-0000-0000-000000000001',
    text: 'We should increase funding for public schools',
    pollId: testPolls.publishedPoll.id,
    submittedBy: testUsers.authenticatedUser.id,
    approved: true,
    approvedBy: testUsers.pollOwner.id,
    createdAt: new Date('2024-02-05T10:00:00Z'),
  }),

  approvedStatement2: createMockStatement({
    id: '20000000-0000-0000-0000-000000000002',
    text: 'Teacher salaries should be increased significantly',
    pollId: testPolls.publishedPoll.id,
    submittedBy: testUsers.anonymousUser.id,
    approved: true,
    approvedBy: testUsers.pollOwner.id,
    createdAt: new Date('2024-02-06T10:00:00Z'),
  }),

  approvedStatement3: createMockStatement({
    id: '20000000-0000-0000-0000-000000000003',
    text: 'We need more vocational training programs',
    pollId: testPolls.publishedPoll.id,
    submittedBy: testUsers.authenticatedUser.id,
    approved: true,
    approvedBy: testUsers.pollOwner.id,
    createdAt: new Date('2024-02-07T10:00:00Z'),
  }),

  // Pending statements (awaiting approval)
  pendingStatement1: createMockStatement({
    id: '20000000-0000-0000-0000-000000000004',
    text: 'Private school vouchers should be expanded',
    pollId: testPolls.publishedPoll.id,
    submittedBy: testUsers.authenticatedUser.id,
    approved: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2024-02-10T10:00:00Z'),
  }),

  pendingStatement2: createMockStatement({
    id: '20000000-0000-0000-0000-000000000005',
    text: 'Standardized testing should be eliminated',
    pollId: testPolls.publishedPoll.id,
    submittedBy: testUsers.anonymousUser.id,
    approved: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date('2024-02-11T10:00:00Z'),
  }),

  // Statements for auto-approve poll (automatically approved)
  autoApprovedStatement: createMockStatement({
    id: '20000000-0000-0000-0000-000000000006',
    text: 'Universal healthcare should be implemented',
    pollId: testPolls.autoApprovePoll.id,
    submittedBy: testUsers.authenticatedUser.id,
    approved: true,
    approvedBy: testUsers.pollOwner.id,
    createdAt: new Date('2024-02-16T10:00:00Z'),
  }),

  // Statements for closed poll
  closedPollStatement: createMockStatement({
    id: '20000000-0000-0000-0000-000000000007',
    text: 'Bus rapid transit should be prioritized',
    pollId: testPolls.closedPoll.id,
    submittedBy: testUsers.authenticatedUser.id,
    approved: true,
    approvedBy: testUsers.pollOwner.id,
    createdAt: new Date('2024-01-05T10:00:00Z'),
  }),
} as const

// Test votes creating various distribution patterns (using proper UUIDs)
export const testVotes = {
  // Votes creating polarized distribution on statement 1
  polarizedVotes: [
    createMockVote({
      id: '30000000-0000-0000-0000-000000000001',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
      createdAt: new Date('2024-02-08T10:00:00Z'),
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000002',
      userId: testUsers.anonymousUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
      createdAt: new Date('2024-02-08T11:00:00Z'),
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000003',
      userId: testUsers.pollManager.id,
      statementId: testStatements.approvedStatement1.id,
      value: -1,
      createdAt: new Date('2024-02-08T12:00:00Z'),
    }),
  ],

  // Votes creating consensus distribution on statement 2
  consensusVotes: [
    createMockVote({
      id: '30000000-0000-0000-0000-000000000004',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T10:00:00Z'),
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000005',
      userId: testUsers.anonymousUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T11:00:00Z'),
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000006',
      userId: testUsers.pollManager.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
      createdAt: new Date('2024-02-09T12:00:00Z'),
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000007',
      userId: testUsers.pollOwner.id,
      statementId: testStatements.approvedStatement2.id,
      value: 0,
      createdAt: new Date('2024-02-09T13:00:00Z'),
    }),
  ],

  // Votes showing user meeting voting threshold
  thresholdVotes: [
    createMockVote({
      id: '30000000-0000-0000-0000-000000000008',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement1.id,
      value: 1,
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-000000000009',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement2.id,
      value: 1,
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-00000000000a',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.approvedStatement3.id,
      value: 0,
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-00000000000b',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.autoApprovedStatement.id,
      value: -1,
    }),
    createMockVote({
      id: '30000000-0000-0000-0000-00000000000c',
      userId: testUsers.authenticatedUser.id,
      statementId: testStatements.closedPollStatement.id,
      value: 1,
    }),
  ],
} as const

// Test user roles for permission testing (using proper UUIDs)
export const testUserRoles = {
  systemAdminRole: {
    id: '40000000-0000-0000-0000-000000000001',
    userId: testUsers.systemAdmin.id,
    role: 'system_admin' as const,
    pollId: null,
    assignedAt: new Date('2024-01-01T10:00:00Z'),
    assignedBy: 'system',
  },

  pollOwnerRole: {
    id: '40000000-0000-0000-0000-000000000002',
    userId: testUsers.pollOwner.id,
    role: 'poll_owner' as const,
    pollId: testPolls.publishedPoll.id,
    assignedAt: new Date('2024-02-01T10:00:00Z'),
    assignedBy: testUsers.systemAdmin.id,
  },

  pollManagerRole: {
    id: '40000000-0000-0000-0000-000000000003',
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
   * Threshold is first batch (10 statements) or all statements if fewer than 10
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

    const threshold = Math.min(10, statements.length)
    return pollVotes.length >= threshold
  },
}