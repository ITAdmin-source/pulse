import { type VoteValue } from '@/lib/utils/voting'
import { createMockPoll, createMockStatement, createMockUser, createMockVote } from '../utils/test-helpers'

/**
 * Scenario fixtures for specific testing workflows and edge cases
 */

export const votingScenarios = {
  /**
   * Polarized voting: Strong disagreement between groups
   */
  polarizedVoting: {
    name: 'Polarized Voting Scenario',
    description: 'Users strongly disagree on controversial statements',
    poll: createMockPoll({
      id: 'poll-polarized',
      slug: 'polarized-debate',
      question: 'Should we implement controversial policy X?',
    }),
    statements: [
      createMockStatement({
        id: 'stmt-controversial-1',
        text: 'Policy X will benefit everyone',
        pollId: 'poll-polarized',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-controversial-2',
        text: 'Policy X will harm the economy',
        pollId: 'poll-polarized',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-controversial-3',
        text: 'We need more research before deciding',
        pollId: 'poll-polarized',
        approved: true,
      }),
    ],
    votes: [
      // Pro-policy group (users 1-3) strongly agree with statement 1, disagree with 2
      { userId: 'user-pro-1', statementId: 'stmt-controversial-1', value: 1 as VoteValue },
      { userId: 'user-pro-2', statementId: 'stmt-controversial-1', value: 1 as VoteValue },
      { userId: 'user-pro-3', statementId: 'stmt-controversial-1', value: 1 as VoteValue },
      { userId: 'user-pro-1', statementId: 'stmt-controversial-2', value: -1 as VoteValue },
      { userId: 'user-pro-2', statementId: 'stmt-controversial-2', value: -1 as VoteValue },
      { userId: 'user-pro-3', statementId: 'stmt-controversial-2', value: -1 as VoteValue },

      // Anti-policy group (users 4-6) disagree with 1, agree with 2
      { userId: 'user-anti-1', statementId: 'stmt-controversial-1', value: -1 as VoteValue },
      { userId: 'user-anti-2', statementId: 'stmt-controversial-1', value: -1 as VoteValue },
      { userId: 'user-anti-3', statementId: 'stmt-controversial-1', value: -1 as VoteValue },
      { userId: 'user-anti-1', statementId: 'stmt-controversial-2', value: 1 as VoteValue },
      { userId: 'user-anti-2', statementId: 'stmt-controversial-2', value: 1 as VoteValue },
      { userId: 'user-anti-3', statementId: 'stmt-controversial-2', value: 1 as VoteValue },

      // Neutral/research group (users 7-8) neutral on 1&2, agree with 3
      { userId: 'user-neutral-1', statementId: 'stmt-controversial-1', value: 0 as VoteValue },
      { userId: 'user-neutral-2', statementId: 'stmt-controversial-1', value: 0 as VoteValue },
      { userId: 'user-neutral-1', statementId: 'stmt-controversial-2', value: 0 as VoteValue },
      { userId: 'user-neutral-2', statementId: 'stmt-controversial-2', value: 0 as VoteValue },
      { userId: 'user-neutral-1', statementId: 'stmt-controversial-3', value: 1 as VoteValue },
      { userId: 'user-neutral-2', statementId: 'stmt-controversial-3', value: 1 as VoteValue },
    ],
    expectedDistributions: {
      'stmt-controversial-1': { agree: 3, disagree: 3, neutral: 2, total: 8 },
      'stmt-controversial-2': { agree: 3, disagree: 3, neutral: 2, total: 8 },
      'stmt-controversial-3': { agree: 2, disagree: 0, neutral: 0, total: 2 },
    },
  },

  /**
   * Consensus building: Most users agree after discussion
   */
  consensusBuilding: {
    name: 'Consensus Building Scenario',
    description: 'Community reaches agreement on popular proposals',
    poll: createMockPoll({
      id: 'poll-consensus',
      slug: 'community-consensus',
      question: 'What community improvements should we prioritize?',
    }),
    statements: [
      createMockStatement({
        id: 'stmt-popular-1',
        text: 'Improve local parks and playgrounds',
        pollId: 'poll-consensus',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-popular-2',
        text: 'Add more bike lanes and paths',
        pollId: 'poll-consensus',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-mixed-1',
        text: 'Increase parking fees downtown',
        pollId: 'poll-consensus',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-unpopular-1',
        text: 'Reduce public library hours',
        pollId: 'poll-consensus',
        approved: true,
      }),
    ],
    votes: [
      // Strong consensus for parks (7 agree, 1 neutral)
      { userId: 'user-1', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-2', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-3', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-4', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-5', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-6', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-7', statementId: 'stmt-popular-1', value: 1 as VoteValue },
      { userId: 'user-8', statementId: 'stmt-popular-1', value: 0 as VoteValue },

      // Good consensus for bike lanes (6 agree, 2 neutral)
      { userId: 'user-1', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-2', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-3', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-4', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-5', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-6', statementId: 'stmt-popular-2', value: 1 as VoteValue },
      { userId: 'user-7', statementId: 'stmt-popular-2', value: 0 as VoteValue },
      { userId: 'user-8', statementId: 'stmt-popular-2', value: 0 as VoteValue },

      // Mixed reaction to parking fees (3 agree, 3 disagree, 2 neutral)
      { userId: 'user-1', statementId: 'stmt-mixed-1', value: 1 as VoteValue },
      { userId: 'user-2', statementId: 'stmt-mixed-1', value: 1 as VoteValue },
      { userId: 'user-3', statementId: 'stmt-mixed-1', value: 1 as VoteValue },
      { userId: 'user-4', statementId: 'stmt-mixed-1', value: -1 as VoteValue },
      { userId: 'user-5', statementId: 'stmt-mixed-1', value: -1 as VoteValue },
      { userId: 'user-6', statementId: 'stmt-mixed-1', value: -1 as VoteValue },
      { userId: 'user-7', statementId: 'stmt-mixed-1', value: 0 as VoteValue },
      { userId: 'user-8', statementId: 'stmt-mixed-1', value: 0 as VoteValue },

      // Strong disagreement with library cuts (1 agree, 6 disagree, 1 neutral)
      { userId: 'user-1', statementId: 'stmt-unpopular-1', value: 1 as VoteValue },
      { userId: 'user-2', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-3', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-4', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-5', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-6', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-7', statementId: 'stmt-unpopular-1', value: -1 as VoteValue },
      { userId: 'user-8', statementId: 'stmt-unpopular-1', value: 0 as VoteValue },
    ],
    expectedDistributions: {
      'stmt-popular-1': { agree: 7, disagree: 0, neutral: 1, total: 8 },
      'stmt-popular-2': { agree: 6, disagree: 0, neutral: 2, total: 8 },
      'stmt-mixed-1': { agree: 3, disagree: 3, neutral: 2, total: 8 },
      'stmt-unpopular-1': { agree: 1, disagree: 6, neutral: 1, total: 8 },
    },
  },

  /**
   * Low participation: Users don't meet voting threshold
   */
  lowParticipation: {
    name: 'Low Participation Scenario',
    description: 'Most users do not meet the minimum voting threshold',
    poll: createMockPoll({
      id: 'poll-low-participation',
      slug: 'low-engagement',
      question: 'How should we address community issue Y?',
    }),
    statements: [
      createMockStatement({
        id: 'stmt-option-1',
        text: 'Option A for addressing the issue',
        pollId: 'poll-low-participation',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-option-2',
        text: 'Option B for addressing the issue',
        pollId: 'poll-low-participation',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-option-3',
        text: 'Option C for addressing the issue',
        pollId: 'poll-low-participation',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-option-4',
        text: 'Option D for addressing the issue',
        pollId: 'poll-low-participation',
        approved: true,
      }),
      createMockStatement({
        id: 'stmt-option-5',
        text: 'Option E for addressing the issue',
        pollId: 'poll-low-participation',
        approved: true,
      }),
    ],
    votes: [
      // User 1: votes on 5 statements (meets threshold)
      { userId: 'user-engaged-1', statementId: 'stmt-option-1', value: 1 as VoteValue },
      { userId: 'user-engaged-1', statementId: 'stmt-option-2', value: 0 as VoteValue },
      { userId: 'user-engaged-1', statementId: 'stmt-option-3', value: -1 as VoteValue },
      { userId: 'user-engaged-1', statementId: 'stmt-option-4', value: 1 as VoteValue },
      { userId: 'user-engaged-1', statementId: 'stmt-option-5', value: 0 as VoteValue },

      // User 2: votes on 3 statements (doesn't meet threshold)
      { userId: 'user-casual-1', statementId: 'stmt-option-1', value: 1 as VoteValue },
      { userId: 'user-casual-1', statementId: 'stmt-option-2', value: 1 as VoteValue },
      { userId: 'user-casual-1', statementId: 'stmt-option-3', value: 0 as VoteValue },

      // User 3: votes on 2 statements (doesn't meet threshold)
      { userId: 'user-casual-2', statementId: 'stmt-option-1', value: -1 as VoteValue },
      { userId: 'user-casual-2', statementId: 'stmt-option-4', value: 1 as VoteValue },

      // User 4: votes on 1 statement (doesn't meet threshold)
      { userId: 'user-casual-3', statementId: 'stmt-option-2', value: 0 as VoteValue },
    ],
    usersWhoMetThreshold: ['user-engaged-1'],
    usersWhoDidNotMeetThreshold: ['user-casual-1', 'user-casual-2', 'user-casual-3'],
  },
} as const

export const approvalWorkflowScenarios = {
  /**
   * Manual approval workflow: Statements await moderation
   */
  manualApproval: {
    name: 'Manual Approval Workflow',
    description: 'Poll owner/manager must approve all user-submitted statements',
    poll: createMockPoll({
      id: 'poll-manual-approval',
      slug: 'manual-moderation',
      question: 'What features should our app prioritize?',
      allowUserStatements: true,
      autoApproveStatements: false, // Manual approval required
    }),
    statements: {
      pending: [
        createMockStatement({
          id: 'stmt-pending-1',
          text: 'Add dark mode support',
          pollId: 'poll-manual-approval',
          approved: null, // Awaiting approval
          createdBy: 'user-contributor-1',
        }),
        createMockStatement({
          id: 'stmt-pending-2',
          text: 'Implement push notifications',
          pollId: 'poll-manual-approval',
          approved: null,
          createdBy: 'user-contributor-2',
        }),
        createMockStatement({
          id: 'stmt-pending-spam',
          text: 'Buy cryptocurrency here!!!',
          pollId: 'poll-manual-approval',
          approved: null,
          createdBy: 'user-spammer',
        }),
      ],
      approved: [
        createMockStatement({
          id: 'stmt-approved-1',
          text: 'Improve user interface design',
          pollId: 'poll-manual-approval',
          approved: true,
          createdBy: 'user-contributor-3',
        }),
      ],
    },
    moderationActions: [
      { statementId: 'stmt-pending-1', action: 'approve', reason: 'Valid feature request' },
      { statementId: 'stmt-pending-2', action: 'approve', reason: 'Good suggestion' },
      { statementId: 'stmt-pending-spam', action: 'reject', reason: 'Spam content' },
    ],
  },

  /**
   * Auto approval workflow: Statements are automatically approved
   */
  autoApproval: {
    name: 'Auto Approval Workflow',
    description: 'User statements are automatically approved and visible',
    poll: createMockPoll({
      id: 'poll-auto-approval',
      slug: 'auto-moderation',
      question: 'How can we improve our community events?',
      allowUserStatements: true,
      autoApproveStatements: true, // Auto approval enabled
    }),
    statements: [
      createMockStatement({
        id: 'stmt-auto-1',
        text: 'Have more outdoor activities',
        pollId: 'poll-auto-approval',
        approved: true, // Auto-approved
        createdBy: 'user-participant-1',
      }),
      createMockStatement({
        id: 'stmt-auto-2',
        text: 'Provide better refreshments',
        pollId: 'poll-auto-approval',
        approved: true, // Auto-approved
        createdBy: 'user-participant-2',
      }),
    ],
  },

  /**
   * No user statements: Only admin-created statements
   */
  adminOnly: {
    name: 'Admin-Only Statements',
    description: 'Poll does not allow user-submitted statements',
    poll: createMockPoll({
      id: 'poll-admin-only',
      slug: 'admin-controlled',
      question: 'Which official policy proposal do you support?',
      allowUserStatements: false, // No user statements allowed
      autoApproveStatements: false,
    }),
    statements: [
      createMockStatement({
        id: 'stmt-official-1',
        text: 'Policy Proposal A: Increase education funding',
        pollId: 'poll-admin-only',
        approved: true,
        createdBy: 'admin-user',
      }),
      createMockStatement({
        id: 'stmt-official-2',
        text: 'Policy Proposal B: Expand healthcare coverage',
        pollId: 'poll-admin-only',
        approved: true,
        createdBy: 'admin-user',
      }),
    ],
  },
} as const

export const permissionScenarios = {
  /**
   * System admin can do everything
   */
  systemAdmin: {
    name: 'System Administrator Permissions',
    user: createMockUser({
      id: 'user-system-admin',
      clerkUserId: 'clerk-admin',
      isAnonymous: false,
    }),
    roles: [
      {
        id: 'role-system-admin',
        userId: 'user-system-admin',
        role: 'system_admin' as const,
        pollId: null,
      },
    ],
    permissions: {
      canAccessAnyPoll: true,
      canManageAnyPoll: true,
      canApproveStatements: true,
      canViewAnalytics: true,
      canManageUsers: true,
    },
  },

  /**
   * Poll owner has full control of their poll
   */
  pollOwner: {
    name: 'Poll Owner Permissions',
    user: createMockUser({
      id: 'user-poll-owner',
      clerkUserId: 'clerk-owner',
      isAnonymous: false,
    }),
    poll: createMockPoll({
      id: 'poll-owned',
      createdBy: 'user-poll-owner',
    }),
    roles: [
      {
        id: 'role-poll-owner',
        userId: 'user-poll-owner',
        role: 'poll_owner' as const,
        pollId: 'poll-owned',
      },
    ],
    permissions: {
      canAccessOwnPoll: true,
      canManageOwnPoll: true,
      canApproveStatements: true,
      canViewAnalytics: true,
      canTransferOwnership: true,
      cannotAccessOtherPolls: true,
    },
  },

  /**
   * Poll manager has limited management permissions
   */
  pollManager: {
    name: 'Poll Manager Permissions',
    user: createMockUser({
      id: 'user-poll-manager',
      clerkUserId: 'clerk-manager',
      isAnonymous: false,
    }),
    poll: createMockPoll({
      id: 'poll-managed',
      createdBy: 'user-poll-owner',
    }),
    roles: [
      {
        id: 'role-poll-manager',
        userId: 'user-poll-manager',
        role: 'poll_manager' as const,
        pollId: 'poll-managed',
      },
    ],
    permissions: {
      canAccessManagedPoll: true,
      canApproveStatements: true,
      canViewAnalytics: true,
      canEditPollSettings: true,
      cannotTransferOwnership: true,
      cannotDeletePoll: true,
      cannotAccessOtherPolls: true,
    },
  },

  /**
   * Regular user has basic participation permissions
   */
  regularUser: {
    name: 'Regular User Permissions',
    user: createMockUser({
      id: 'user-regular',
      clerkUserId: 'clerk-regular',
      isAnonymous: false,
    }),
    roles: [], // No special roles
    permissions: {
      canVoteOnPublishedPolls: true,
      canSubmitStatements: true,
      canViewOwnVotes: true,
      canViewPublicResults: true,
      cannotAccessDraftPolls: true,
      cannotAccessAdminFeatures: true,
      cannotApproveStatements: true,
    },
  },

  /**
   * Anonymous user has minimal permissions
   */
  anonymousUser: {
    name: 'Anonymous User Permissions',
    user: createMockUser({
      id: 'user-anonymous',
      sessionId: 'session-anon-123',
      clerkUserId: null,
      isAnonymous: true,
    }),
    roles: [], // No roles
    permissions: {
      canVoteOnPublishedPolls: true,
      canSubmitStatements: true,
      canViewPublicResults: true,
      cannotAccessDraftPolls: true,
      cannotAccessAnalytics: true,
      cannotViewOtherUsersVotes: true,
    },
  },
} as const

// Helper functions for working with scenario fixtures
export const scenarioHelpers = {
  /**
   * Get all votes for a specific statement in a scenario
   */
  getVotesForStatement(scenario: any, statementId: string) {
    if (!scenario.votes) return []
    return scenario.votes.filter((vote: any) => vote.statementId === statementId)
  },

  /**
   * Get vote distribution for a statement in a scenario
   */
  getVoteDistribution(scenario: any, statementId: string) {
    const votes = this.getVotesForStatement(scenario, statementId)
    const agree = votes.filter((vote: any) => vote.value === 1).length
    const disagree = votes.filter((vote: any) => vote.value === -1).length
    const neutral = votes.filter((vote: any) => vote.value === 0).length
    const total = votes.length

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
   * Check if user meets voting threshold in a scenario
   */
  userMeetsThreshold(scenario: any, userId: string): boolean {
    if (!scenario.votes || !scenario.poll) return false

    const userVotes = scenario.votes.filter((vote: any) => vote.userId === userId)
    const approvedStatements = scenario.statements.filter((stmt: any) => stmt.approved === true)
    const threshold = Math.min(10, approvedStatements.length)

    return userVotes.length >= threshold
  },

  /**
   * Get users who have specific permissions
   */
  getUsersWithPermission(scenarios: any, permission: string) {
    return Object.entries(scenarios)
      .filter(([_, scenario]: [string, any]) => scenario.permissions?.[permission])
      .map(([name, scenario]: [string, any]) => ({ name, user: scenario.user }))
  },
}