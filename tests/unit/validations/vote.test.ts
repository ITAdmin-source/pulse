import { describe, it, expect } from 'vitest'
import {
  voteValueSchema,
  createVoteSchema,
  updateVoteSchema,
  voteQuerySchema,
  userVotingProgressSchema,
} from '@/lib/validations/vote'

describe('Vote Validation Schemas', () => {
  describe('voteValueSchema', () => {
    it('should accept valid vote values', () => {
      expect(voteValueSchema.safeParse(-1).success).toBe(true) // Disagree
      expect(voteValueSchema.safeParse(0).success).toBe(true)  // Neutral
      expect(voteValueSchema.safeParse(1).success).toBe(true)  // Agree
    })

    it('should reject invalid vote values', () => {
      const invalidValues = [2, -2, 0.5, 1.1, 'yes', 'no', true, false, null, undefined]

      invalidValues.forEach(value => {
        const result = voteValueSchema.safeParse(value)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Vote value must be -1 (disagree), 0 (neutral), or 1 (agree)'
          )
        }
      })
    })
  })

  describe('createVoteSchema', () => {
    it('should validate valid vote creation data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        value: 1,
      }

      const result = createVoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId)
        expect(result.data.statementId).toBe(validData.statementId)
        expect(result.data.value).toBe(1)
      }
    })

    it('should validate all vote values', () => {
      const baseData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
      }

      // Test all valid vote values
      const voteValues = [-1, 0, 1]
      voteValues.forEach(value => {
        const result = createVoteSchema.safeParse({ ...baseData, value })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.value).toBe(value)
        }
      })
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        value: 1,
      }

      const result = createVoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID')
      }
    })

    it('should reject invalid statement ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: 'not-a-uuid',
        value: 1,
      }

      const result = createVoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid statement ID')
      }
    })

    it('should reject invalid vote value', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        value: 5,
      }

      const result = createVoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Vote value must be -1 (disagree), 0 (neutral), or 1 (agree)'
        )
      }
    })

    it('should require all fields', () => {
      const incompleteData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing statementId and value
      }

      const result = createVoteSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })
  })

  describe('updateVoteSchema', () => {
    it('should validate vote update data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        value: -1, // Changed from agree to disagree
      }

      const result = updateVoteSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBe(-1)
      }
    })

    it('should have same validation rules as createVoteSchema', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        value: 2, // Invalid value
      }

      const result = updateVoteSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('voteQuerySchema', () => {
    it('should validate query with default values', () => {
      const validData = {}

      const result = voteQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100) // Default value
        expect(result.data.offset).toBe(0)  // Default value
      }
    })

    it('should validate query with all parameters', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        statementId: '123e4567-e89b-12d3-a456-426614174001',
        pollId: '123e4567-e89b-12d3-a456-426614174002',
        value: 1,
        limit: 50,
        offset: 20,
      }

      const result = voteQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId)
        expect(result.data.statementId).toBe(validData.statementId)
        expect(result.data.pollId).toBe(validData.pollId)
        expect(result.data.value).toBe(1)
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(20)
      }
    })

    it('should validate partial query parameters', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        value: 0,
        limit: 25,
      }

      const result = voteQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId)
        expect(result.data.value).toBe(0)
        expect(result.data.limit).toBe(25)
        expect(result.data.offset).toBe(0) // Default
      }
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
      }

      const result = voteQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID')
      }
    })

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        limit: 1001, // Exceeds maximum of 1000
      }

      const result = voteQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const invalidData = {
        offset: -1,
      }

      const result = voteQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative limit', () => {
      const invalidData = {
        limit: 0,
      }

      const result = voteQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept all valid vote values in query', () => {
      const voteValues = [-1, 0, 1]
      voteValues.forEach(value => {
        const validData = { value }
        const result = voteQuerySchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.value).toBe(value)
        }
      })
    })
  })

  describe('userVotingProgressSchema', () => {
    it('should validate voting progress query', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userVotingProgressSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId)
        expect(result.data.pollId).toBe(validData.pollId)
      }
    })

    it('should require both user ID and poll ID', () => {
      const incompleteData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing pollId
      }

      const result = userVotingProgressSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = userVotingProgressSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID')
      }
    })

    it('should reject invalid poll ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: 'not-a-uuid',
      }

      const result = userVotingProgressSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid poll ID')
      }
    })
  })
})