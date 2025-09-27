import { describe, it, expect, beforeEach, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import {
  createStatementAction,
  updateStatementAction,
  deleteStatementAction,
  getStatementsAction,
  getStatementsByPollIdAction,
  getApprovedStatementsByPollIdAction,
  getStatementByIdAction,
  rejectStatementAction,
  approveStatementAction,
} from '@/actions/statements-actions'
import * as statementsQueries from '@/db/queries/statements-queries'
import { createMockStatement } from '../../utils/test-helpers'

// Mock Next.js revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock all statements queries
vi.mock('@/db/queries/statements-queries', () => ({
  createStatement: vi.fn(),
  updateStatement: vi.fn(),
  deleteStatement: vi.fn(),
  getAllStatements: vi.fn(),
  getStatementById: vi.fn(),
  getStatementsByPollId: vi.fn(),
  getApprovedStatementsByPollId: vi.fn(),
}))

describe('Statements Actions Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createStatementAction', () => {
    it('should create statement and revalidate polls', async () => {
      const statementData = {
        text: 'Test statement',
        pollId: 'poll-123',
        createdBy: 'user-456',
        approved: null,
      }
      const mockStatement = createMockStatement(statementData)
      vi.mocked(statementsQueries.createStatement).mockResolvedValue(mockStatement)

      const result = await createStatementAction(statementData)

      expect(statementsQueries.createStatement).toHaveBeenCalledWith(statementData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockStatement })
    })

    it('should handle database errors', async () => {
      const statementData = {
        text: 'Test statement',
        pollId: 'poll-123',
        createdBy: 'user-456',
        approved: null,
      }
      vi.mocked(statementsQueries.createStatement).mockRejectedValue(new Error('Database error'))

      const result = await createStatementAction(statementData)

      expect(result).toEqual({ success: false, error: 'Failed to create statement' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('updateStatementAction', () => {
    it('should update statement successfully', async () => {
      const updateData = { text: 'Updated statement' }
      const mockStatement = createMockStatement(updateData)
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(mockStatement)

      const result = await updateStatementAction('statement-123', updateData)

      expect(statementsQueries.updateStatement).toHaveBeenCalledWith('statement-123', updateData)
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockStatement })
    })

    it('should handle statement not found', async () => {
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(undefined)

      const result = await updateStatementAction('nonexistent-id', { text: 'Test' })

      expect(result).toEqual({ success: false, error: 'Statement not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.updateStatement).mockRejectedValue(new Error('Database error'))

      const result = await updateStatementAction('statement-123', { text: 'Test' })

      expect(result).toEqual({ success: false, error: 'Failed to update statement' })
    })
  })

  describe('deleteStatementAction', () => {
    it('should delete statement successfully', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(true)

      const result = await deleteStatementAction('statement-123')

      expect(statementsQueries.deleteStatement).toHaveBeenCalledWith('statement-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true })
    })

    it('should handle statement not found', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(false)

      const result = await deleteStatementAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Statement not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockRejectedValue(new Error('Database error'))

      const result = await deleteStatementAction('statement-123')

      expect(result).toEqual({ success: false, error: 'Failed to delete statement' })
    })
  })

  describe('getStatementsAction', () => {
    it('should fetch all statements successfully', async () => {
      const mockStatements = [createMockStatement(), createMockStatement({ id: 'statement-2' })]
      vi.mocked(statementsQueries.getAllStatements).mockResolvedValue(mockStatements)

      const result = await getStatementsAction()

      expect(statementsQueries.getAllStatements).toHaveBeenCalled()
      expect(result).toEqual({ success: true, data: mockStatements })
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.getAllStatements).mockRejectedValue(new Error('Database error'))

      const result = await getStatementsAction()

      expect(result).toEqual({ success: false, error: 'Failed to fetch statements' })
    })
  })

  describe('getStatementsByPollIdAction', () => {
    it('should fetch statements for poll successfully', async () => {
      const mockStatements = [createMockStatement({ pollId: 'poll-123' })]
      vi.mocked(statementsQueries.getStatementsByPollId).mockResolvedValue(mockStatements)

      const result = await getStatementsByPollIdAction('poll-123')

      expect(statementsQueries.getStatementsByPollId).toHaveBeenCalledWith('poll-123')
      expect(result).toEqual({ success: true, data: mockStatements })
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.getStatementsByPollId).mockRejectedValue(new Error('Database error'))

      const result = await getStatementsByPollIdAction('poll-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch statements for poll' })
    })
  })

  describe('getApprovedStatementsByPollIdAction', () => {
    it('should fetch approved statements for poll successfully', async () => {
      const mockStatements = [createMockStatement({ pollId: 'poll-123', approved: true })]
      vi.mocked(statementsQueries.getApprovedStatementsByPollId).mockResolvedValue(mockStatements)

      const result = await getApprovedStatementsByPollIdAction('poll-123')

      expect(statementsQueries.getApprovedStatementsByPollId).toHaveBeenCalledWith('poll-123')
      expect(result).toEqual({ success: true, data: mockStatements })
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.getApprovedStatementsByPollId).mockRejectedValue(new Error('Database error'))

      const result = await getApprovedStatementsByPollIdAction('poll-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch approved statements for poll' })
    })
  })

  describe('getStatementByIdAction', () => {
    it('should fetch statement by ID successfully', async () => {
      const mockStatement = createMockStatement()
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(mockStatement)

      const result = await getStatementByIdAction('statement-123')

      expect(statementsQueries.getStatementById).toHaveBeenCalledWith('statement-123')
      expect(result).toEqual({ success: true, data: mockStatement })
    })

    it('should handle statement not found', async () => {
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(undefined)

      const result = await getStatementByIdAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Statement not found' })
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.getStatementById).mockRejectedValue(new Error('Database error'))

      const result = await getStatementByIdAction('statement-123')

      expect(result).toEqual({ success: false, error: 'Failed to fetch statement' })
    })
  })

  describe('rejectStatementAction', () => {
    it('should reject statement by deleting it', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(true)

      const result = await rejectStatementAction('statement-123')

      expect(statementsQueries.deleteStatement).toHaveBeenCalledWith('statement-123')
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true })
    })

    it('should handle statement not found', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(false)

      const result = await rejectStatementAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Statement not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.deleteStatement).mockRejectedValue(new Error('Database error'))

      const result = await rejectStatementAction('statement-123')

      expect(result).toEqual({ success: false, error: 'Failed to reject statement' })
    })
  })

  describe('approveStatementAction', () => {
    it('should approve statement by setting approved to true', async () => {
      const mockStatement = createMockStatement({ approved: true })
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(mockStatement)

      const result = await approveStatementAction('statement-123')

      expect(statementsQueries.updateStatement).toHaveBeenCalledWith('statement-123', { approved: true })
      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(result).toEqual({ success: true, data: mockStatement })
    })

    it('should handle statement not found', async () => {
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(undefined)

      const result = await approveStatementAction('nonexistent-id')

      expect(result).toEqual({ success: false, error: 'Statement not found' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      vi.mocked(statementsQueries.updateStatement).mockRejectedValue(new Error('Database error'))

      const result = await approveStatementAction('statement-123')

      expect(result).toEqual({ success: false, error: 'Failed to approve statement' })
    })
  })

  describe('statement approval workflow', () => {
    it('should handle full approval workflow', async () => {
      const pendingStatement = createMockStatement({ approved: null })
      const approvedStatement = createMockStatement({ approved: true })

      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(pendingStatement)
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(approvedStatement)

      // First, get the pending statement
      const fetchResult = await getStatementByIdAction('statement-123')
      expect(fetchResult.success).toBe(true)
      expect(fetchResult.data?.approved).toBeNull()

      // Then approve it
      const approveResult = await approveStatementAction('statement-123')
      expect(approveResult.success).toBe(true)
      expect(approveResult.data?.approved).toBe(true)
    })

    it('should handle rejection workflow', async () => {
      const pendingStatement = createMockStatement({ approved: null })

      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(pendingStatement)
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(true)

      // First, get the pending statement
      const fetchResult = await getStatementByIdAction('statement-123')
      expect(fetchResult.success).toBe(true)

      // Then reject it (delete it)
      const rejectResult = await rejectStatementAction('statement-123')
      expect(rejectResult.success).toBe(true)
    })
  })

  describe('error logging patterns', () => {
    it('should log specific error messages', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(statementsQueries.createStatement).mockRejectedValue(new Error('Test error'))

      await createStatementAction({
        text: 'Test statement',
        pollId: 'poll-123',
        createdBy: 'user-456',
        approved: null,
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error creating statement:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should log different errors for different actions', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(statementsQueries.updateStatement).mockRejectedValue(new Error('Update error'))
      vi.mocked(statementsQueries.deleteStatement).mockRejectedValue(new Error('Delete error'))

      await updateStatementAction('statement-123', { text: 'Test' })
      await deleteStatementAction('statement-123')

      expect(consoleSpy).toHaveBeenCalledWith('Error updating statement:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting statement:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('revalidation patterns', () => {
    it('should revalidate polls for all modification operations', async () => {
      const mockStatement = createMockStatement()
      vi.mocked(statementsQueries.createStatement).mockResolvedValue(mockStatement)
      vi.mocked(statementsQueries.updateStatement).mockResolvedValue(mockStatement)
      vi.mocked(statementsQueries.deleteStatement).mockResolvedValue(true)

      // Create, update, delete, reject, approve should all revalidate
      await createStatementAction({
        text: 'Test statement',
        pollId: 'poll-123',
        createdBy: 'user-456',
        approved: null,
      })
      await updateStatementAction('statement-123', { text: 'Updated' })
      await deleteStatementAction('statement-123')
      await rejectStatementAction('statement-456')
      await approveStatementAction('statement-789')

      expect(revalidatePath).toHaveBeenCalledWith('/polls')
      expect(revalidatePath).toHaveBeenCalledTimes(5)
    })

    it('should not revalidate for read operations', async () => {
      const mockStatements = [createMockStatement()]
      vi.mocked(statementsQueries.getAllStatements).mockResolvedValue(mockStatements)
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(mockStatements[0])

      await getStatementsAction()
      await getStatementByIdAction('statement-123')

      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('statement approval state handling', () => {
    it('should handle statements with null approval state', async () => {
      const pendingStatement = createMockStatement({ approved: null })
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(pendingStatement)

      const result = await getStatementByIdAction('statement-123')

      expect(result.success).toBe(true)
      expect(result.data?.approved).toBeNull()
    })

    it('should handle approved statements', async () => {
      const approvedStatement = createMockStatement({ approved: true })
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(approvedStatement)

      const result = await getStatementByIdAction('statement-123')

      expect(result.success).toBe(true)
      expect(result.data?.approved).toBe(true)
    })

    it('should handle rejected statements (deleted)', async () => {
      // Rejected statements are deleted, so they return undefined
      vi.mocked(statementsQueries.getStatementById).mockResolvedValue(undefined)

      const result = await getStatementByIdAction('rejected-statement')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Statement not found')
    })
  })
})