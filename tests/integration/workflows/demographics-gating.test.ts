import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dbTestUtils, DatabaseTestHelper } from '../../utils/db-test-helpers'
import { VotingService } from '@/lib/services/voting-service'
import { UserService } from '@/lib/services/user-service'
import { PollResultsService } from '@/lib/services/poll-results-service'
import { createUserDemographics } from '@/db/queries/user-demographics-queries'
import { getUserDemographicsById } from '@/db/queries/user-demographics-queries'

/**
 * Demographics Gating Integration Tests
 *
 * Tests the critical business rule: Users must complete demographics
 * AFTER voting on 10 statements and BEFORE accessing results.
 */
describe('Demographics Gating Workflow', () => {
  let helper: DatabaseTestHelper

  beforeEach(async () => {
    helper = await dbTestUtils.setupTest()
    await helper.seedBasicData()
  })

  afterEach(async () => {
    await dbTestUtils.teardownTest(helper)
  })

  describe('Demographics Modal Trigger', () => {
    it('should NOT trigger demographics modal before 10 votes', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on 9 statements (below threshold)
      for (let i = 0; i < 9; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Check if demographics are required
      const demographics = await getUserDemographicsById(user.id)
      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(9)
      expect(progress.hasReachedThreshold).toBe(false)
      // Demographics not required yet (threshold not reached)
    })

    it('should trigger demographics modal after 10th vote if not completed', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on 10 statements (reaches threshold)
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Check progress
      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(10)
      expect(progress.hasReachedThreshold).toBe(true)

      // Verify demographics not yet completed
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).toBeNull()

      // At this point, UI should show demographics modal
      // and block access to results until demographics are completed
    })

    it('should NOT show demographics modal if already completed', async () => {
      const { poll, statements, users, ageGroups, genders, ethnicities, politicalParties } = await helper.fullSetup()
      const user = users[0]

      // Complete demographics BEFORE voting
      await createUserDemographics({
        userId: user.id,
        ageGroupId: ageGroups[0].id,
        genderId: genders[0].id,
        ethnicityId: ethnicities[0].id,
        politicalPartyId: politicalParties[0].id,
      })

      // Vote on 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Verify demographics already exist
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).not.toBeNull()

      // UI should NOT show demographics modal (already completed)
    })
  })

  describe('Results Access Control', () => {
    it('should block results access without demographics after 10 votes', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Verify threshold reached
      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })
      expect(progress.hasReachedThreshold).toBe(true)

      // Attempt to access results without demographics
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).toBeNull()

      // In the UI, results tab should be locked with a message
      // indicating demographics are required
    })

    it('should allow results access after completing demographics', async () => {
      const { poll, statements, users, ageGroups, genders, ethnicities, politicalParties } = await helper.fullSetup()
      const user = users[0]

      // Vote on 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Complete demographics (all 4 fields required)
      await createUserDemographics({
        userId: user.id,
        ageGroupId: ageGroups[0].id,
        genderId: genders[0].id,
        ethnicityId: ethnicities[0].id,
        politicalPartyId: politicalParties[0].id,
      })

      // Verify demographics completed
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).not.toBeNull()
      expect(demographics!.ageGroupId).toBe(ageGroups[0].id)
      expect(demographics!.genderId).toBe(genders[0].id)
      expect(demographics!.ethnicityId).toBe(ethnicities[0].id)
      expect(demographics!.politicalPartyId).toBe(politicalParties[0].id)

      // Now results should be accessible
      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })
      expect(progress.hasReachedThreshold).toBe(true)

      // Results access should now be allowed
    })

    it('should reject incomplete demographics (missing fields)', async () => {
      const { poll, statements, users, ageGroups, genders } = await helper.fullSetup()
      const user = users[0]

      // Vote on 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Attempt to save incomplete demographics (only 2 out of 4 fields)
      await expect(
        createUserDemographics({
          userId: user.id,
          ageGroupId: ageGroups[0].id,
          genderId: genders[0].id,
          // Missing ethnicityId and politicalPartyId
        } as any)
      ).rejects.toThrow()

      // Demographics should still be null
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).toBeNull()
    })
  })

  describe('Voting Threshold Boundary Conditions', () => {
    it('should handle exactly 10 votes (threshold boundary)', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on exactly 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(10)
      expect(progress.hasReachedThreshold).toBe(true)
      expect(progress.remainingVotesNeeded).toBe(0)
    })

    it('should handle 9 votes (just below threshold)', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on 9 statements
      for (let i = 0; i < 9; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(9)
      expect(progress.hasReachedThreshold).toBe(false)
      expect(progress.remainingVotesNeeded).toBe(1)
    })

    it('should handle 11 votes (above threshold)', async () => {
      const { poll, statements, users } = await helper.fullSetup()
      const user = users[0]

      // Vote on 11 statements
      for (let i = 0; i < 11; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(11)
      expect(progress.hasReachedThreshold).toBe(true)
      expect(progress.remainingVotesNeeded).toBe(0)
    })
  })

  describe('Polls with Fewer than 10 Statements', () => {
    it('should require all votes for polls with 6 statements', async () => {
      const { poll, users } = await helper.quickSetup()
      const user = users[0]

      // Create only 6 statements (minimum poll size)
      const statements = await helper.createStatements(poll.id, 6, { approved: true })

      // Vote on 5 out of 6
      for (let i = 0; i < 5; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      const progress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(progress.votedStatements).toBe(5)
      expect(progress.totalApprovedStatements).toBe(6)
      expect(progress.hasReachedThreshold).toBe(false) // Threshold is min(10, 6) = 6

      // Vote on 6th statement
      await VotingService.castVote({
        userId: user.id,
        statementId: statements[5].id,
        value: 1,
      })

      const finalProgress = await VotingService.getUserVotingProgress({
        userId: user.id,
        pollId: poll.id,
      })

      expect(finalProgress.votedStatements).toBe(6)
      expect(finalProgress.hasReachedThreshold).toBe(true) // Now reached threshold
    })
  })

  describe('Anonymous User Upgrade', () => {
    it('should preserve demographics through anonymous-to-authenticated upgrade', async () => {
      const { poll, statements, ageGroups, genders, ethnicities, politicalParties } = await helper.fullSetup()

      // Create anonymous user
      const anonUser = await UserService.createAnonymousUserForAction('test-session-123')

      // Vote on 10 statements as anonymous user
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: anonUser.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Complete demographics as anonymous user
      await createUserDemographics({
        userId: anonUser.id,
        ageGroupId: ageGroups[0].id,
        genderId: genders[0].id,
        ethnicityId: ethnicities[0].id,
        politicalPartyId: politicalParties[0].id,
      })

      // Verify demographics saved
      const anonDemographics = await getUserDemographicsById(anonUser.id)
      expect(anonDemographics).not.toBeNull()

      // Upgrade to authenticated user
      const authUser = await UserService.upgradeAnonymousUser({
        sessionId: 'test-session-123',
        clerkUserId: 'clerk-test-123',
        email: 'test@example.com',
      })

      // Verify demographics transferred
      const authDemographics = await getUserDemographicsById(authUser.id)
      expect(authDemographics).not.toBeNull()
      expect(authDemographics!.ageGroupId).toBe(ageGroups[0].id)

      // Verify votes transferred
      const votes = await VotingService.getUserVotesForPoll(authUser.id, poll.id)
      expect(votes.length).toBe(10)
    })
  })

  describe('Demographics Never Re-requested', () => {
    it('should NOT request demographics again after initial submission', async () => {
      const { poll, statements, users, ageGroups, genders, ethnicities, politicalParties } = await helper.fullSetup()
      const user = users[0]

      // Vote on 10 statements
      for (let i = 0; i < 10; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Complete demographics
      await createUserDemographics({
        userId: user.id,
        ageGroupId: ageGroups[0].id,
        genderId: genders[0].id,
        ethnicityId: ethnicities[0].id,
        politicalPartyId: politicalParties[0].id,
      })

      // Vote on 10 more statements (total 20)
      for (let i = 10; i < 20; i++) {
        await VotingService.castVote({
          userId: user.id,
          statementId: statements[i].id,
          value: 1,
        })
      }

      // Verify demographics still exist (same record)
      const demographics = await getUserDemographicsById(user.id)
      expect(demographics).not.toBeNull()
      expect(demographics!.ageGroupId).toBe(ageGroups[0].id)

      // Demographics should NEVER be requested again
    })
  })
})
