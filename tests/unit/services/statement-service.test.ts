import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StatementService } from '@/lib/services/statement-service'
import { PollService } from '@/lib/services/poll-service'
import { db } from '@/db/db'
import { statements, polls } from '@/db/schema'
import { createMockStatement, createMockPoll, TEST_USER_ID, TEST_POLL_ID } from '../../utils/test-helpers'

// Mock the database
vi.mock('@/db/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock PollService
vi.mock('@/lib/services/poll-service', () => ({
  PollService: {
    isVotingActive: vi.fn(),
  },
}))

describe('StatementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createStatement', () => {
    it('should create statement when poll allows user statements', async () => {
      const mockPoll = createMockPoll({
        allowUserStatements: true,
        autoApproveStatements: false
      })
      const mockStatement = createMockStatement({ approved: null })
      const statementData = {
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
      }

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectPoll as any)

      // Mock voting active check
      vi.mocked(PollService.isVotingActive).mockResolvedValue(true)

      // Mock statement insertion
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await StatementService.createStatement(statementData)

      expect(db.select).toHaveBeenCalled()
      expect(PollService.isVotingActive).toHaveBeenCalledWith(mockPoll)
      expect(db.insert).toHaveBeenCalledWith(statements)
      expect(mockInsert.values).toHaveBeenCalledWith({
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
        approved: null,
        approvedAt: null,
      })
      expect(result).toEqual(mockStatement)
    })

    it('should auto-approve when poll has auto-approval enabled', async () => {
      const mockPoll = createMockPoll({
        allowUserStatements: true,
        autoApproveStatements: true
      })
      const mockStatement = createMockStatement({ approved: true })
      const statementData = {
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
      }

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectPoll as any)

      // Mock voting active check
      vi.mocked(PollService.isVotingActive).mockResolvedValue(true)

      // Mock statement insertion
      const mockInsert = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.insert).mockReturnValue(mockInsert as any)

      const result = await StatementService.createStatement(statementData)

      expect(mockInsert.values).toHaveBeenCalledWith({
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
        approved: true,
        approvedAt: expect.any(Date),
      })
      expect(result).toEqual(mockStatement)
    })

    it('should throw error if poll not found', async () => {
      const statementData = {
        pollId: 'nonexistent-poll',
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
      }

      // Mock poll lookup returning empty
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectPoll as any)

      await expect(
        StatementService.createStatement(statementData)
      ).rejects.toThrow('Poll not found')
    })

    it('should throw error if poll does not allow user statements', async () => {
      const mockPoll = createMockPoll({ allowUserStatements: false })
      const statementData = {
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
      }

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectPoll as any)

      await expect(
        StatementService.createStatement(statementData)
      ).rejects.toThrow('This poll does not allow user-submitted statements')
    })

    it('should throw error if voting is not active', async () => {
      const mockPoll = createMockPoll({ allowUserStatements: true })
      const statementData = {
        pollId: TEST_POLL_ID,
        text: 'Test statement text',
        submittedBy: TEST_USER_ID,
      }

      // Mock poll lookup
      const mockSelectPoll = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPoll]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelectPoll as any)

      // Mock voting inactive
      vi.mocked(PollService.isVotingActive).mockResolvedValue(false)

      await expect(
        StatementService.createStatement(statementData)
      ).rejects.toThrow('Cannot submit statements - voting is not active')
    })
  })

  describe('approveStatement', () => {
    it('should approve pending statement', async () => {
      const mockStatement = createMockStatement({ approved: true })
      const approvalData = {
        statementId: 'test-statement-id',
        approved: true,
        approvedBy: TEST_USER_ID,
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const result = await StatementService.approveStatement(approvalData)

      expect(db.update).toHaveBeenCalledWith(statements)
      expect(mockUpdate.set).toHaveBeenCalledWith({
        approved: true,
        approvedBy: TEST_USER_ID,
        approvedAt: expect.any(Date),
      })
      expect(result).toEqual(mockStatement)
    })

    it('should reject statement and delete it', async () => {
      const approvalData = {
        statementId: 'test-statement-id',
        approved: false,
        approvedBy: TEST_USER_ID,
      }

      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createMockStatement()]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await StatementService.approveStatement(approvalData)

      expect(db.delete).toHaveBeenCalledWith(statements)
      expect(result).toBeNull()
    })
  })

  describe('getApprovedStatements', () => {
    it('should return only approved statements for poll', async () => {
      const mockStatements = [
        createMockStatement({ approved: true }),
        createMockStatement({ id: 'stmt-2', approved: true }),
      ]

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockStatements),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await StatementService.getApprovedStatements(TEST_POLL_ID)

      expect(db.select).toHaveBeenCalled()
      expect(result).toEqual(mockStatements)
    })
  })

  describe('getPendingStatements', () => {
    it('should return statements awaiting approval', async () => {
      const mockStatements = [
        createMockStatement({ approved: null }),
        createMockStatement({ id: 'stmt-2', approved: null }),
      ]

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockStatements),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await StatementService.getPendingStatements(TEST_POLL_ID)

      expect(result).toEqual(mockStatements)
    })
  })

  describe('updateStatement', () => {
    it('should update statement text', async () => {
      const mockStatement = createMockStatement({ text: 'Updated text' })
      const updateData = {
        id: 'test-statement-id',
        text: 'Updated text',
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockStatement]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      const result = await StatementService.updateStatement(updateData)

      expect(db.update).toHaveBeenCalledWith(statements)
      expect(mockUpdate.set).toHaveBeenCalledWith({ text: 'Updated text' })
      expect(result).toEqual(mockStatement)
    })

    it('should throw error if statement not found', async () => {
      const updateData = {
        id: 'nonexistent-statement',
        text: 'Updated text',
      }

      const mockUpdate = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.update).mockReturnValue(mockUpdate as any)

      await expect(
        StatementService.updateStatement(updateData)
      ).rejects.toThrow('Statement not found')
    })
  })

  describe('deleteStatement', () => {
    it('should delete statement by ID', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createMockStatement()]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await StatementService.deleteStatement('test-statement-id')

      expect(db.delete).toHaveBeenCalledWith(statements)
      expect(result).toBe(true)
    })

    it('should return false if statement not found', async () => {
      const mockDelete = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      }
      vi.mocked(db.delete).mockReturnValue(mockDelete as any)

      const result = await StatementService.deleteStatement('nonexistent-statement')

      expect(result).toBe(false)
    })
  })

  describe('getStatementWithVoteCount', () => {
    it('should return statement with vote statistics', async () => {
      const mockStatementWithStats = {
        id: 'test-statement-id',
        text: 'Test statement',
        totalVotes: 10,
        agreeVotes: 6,
        disagreeVotes: 2,
        neutralVotes: 2,
      }

      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([mockStatementWithStats]),
      }
      vi.mocked(db.select).mockReturnValue(mockSelect as any)

      const result = await StatementService.getStatementWithVoteCount('test-statement-id')

      expect(result).toEqual(mockStatementWithStats)
    })
  })
})