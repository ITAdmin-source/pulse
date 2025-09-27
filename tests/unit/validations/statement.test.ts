import { describe, it, expect } from 'vitest'
import {
  createStatementSchema,
  updateStatementSchema,
  approveStatementSchema,
  statementQuerySchema,
} from '@/lib/validations/statement'

describe('Statement Validation Schemas', () => {
  describe('createStatementSchema', () => {
    it('should validate valid statement creation data', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'This is a valid statement text',
        submittedBy: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = createStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pollId).toBe(validData.pollId)
        expect(result.data.text).toBe(validData.text)
        expect(result.data.submittedBy).toBe(validData.submittedBy)
      }
    })

    it('should validate statement without submittedBy (optional field)', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'This is a valid statement text',
      }

      const result = createStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid poll ID', () => {
      const invalidData = {
        pollId: 'not-a-uuid',
        text: 'Valid statement text',
      }

      const result = createStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid poll ID')
      }
    })

    it('should reject empty statement text', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: '',
      }

      const result = createStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Statement text is required')
      }
    })

    it('should reject statement text that is too long', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'a'.repeat(281), // Exceeds 280 character limit
      }

      const result = createStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Statement too long (max 280 characters)')
      }
    })

    it('should accept statement text at character limit', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'a'.repeat(280), // Exactly at limit
      }

      const result = createStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid submittedBy UUID', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Valid statement text',
        submittedBy: 'not-a-uuid',
      }

      const result = createStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID')
      }
    })
  })

  describe('updateStatementSchema', () => {
    it('should validate statement update with all fields', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Updated statement text',
        approved: true,
        approvedBy: '123e4567-e89b-12d3-a456-426614174001',
        approvedAt: new Date(),
      }

      const result = updateStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(validData.id)
        expect(result.data.text).toBe(validData.text)
        expect(result.data.approved).toBe(true)
      }
    })

    it('should validate partial statement update', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Updated statement text',
      }

      const result = updateStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require statement ID', () => {
      const invalidData = {
        text: 'Updated statement text',
      }

      const result = updateStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid statement ID', () => {
      const invalidData = {
        id: 'not-a-uuid',
        text: 'Updated statement text',
      }

      const result = updateStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid statement ID')
      }
    })

    it('should reject invalid approver ID', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        approved: true,
        approvedBy: 'not-a-uuid',
      }

      const result = updateStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid approver ID')
      }
    })
  })

  describe('approveStatementSchema', () => {
    it('should validate statement approval', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        approved: true,
        approvedBy: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = approveStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(true)
        expect(result.data.approvedBy).toBe(validData.approvedBy)
      }
    })

    it('should validate statement rejection', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        approved: false,
        approvedBy: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = approveStatementSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(false)
      }
    })

    it('should require all fields', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        approved: true,
        // Missing approvedBy
      }

      const result = approveStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid approver ID', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        approved: true,
        approvedBy: 'not-a-uuid',
      }

      const result = approveStatementSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid approver ID')
      }
    })
  })

  describe('statementQuerySchema', () => {
    it('should validate basic query parameters', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = statementQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pollId).toBe(validData.pollId)
        expect(result.data.limit).toBe(50) // Default value
        expect(result.data.offset).toBe(0) // Default value
      }
    })

    it('should validate query with all parameters', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        approved: true,
        submittedBy: '123e4567-e89b-12d3-a456-426614174001',
        limit: 25,
        offset: 10,
      }

      const result = statementQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBe(true)
        expect(result.data.submittedBy).toBe(validData.submittedBy)
        expect(result.data.limit).toBe(25)
        expect(result.data.offset).toBe(10)
      }
    })

    it('should accept null for approved filter', () => {
      const validData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        approved: null,
      }

      const result = statementQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.approved).toBeNull()
      }
    })

    it('should reject invalid poll ID', () => {
      const invalidData = {
        pollId: 'not-a-uuid',
      }

      const result = statementQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid poll ID')
      }
    })

    it('should reject limit exceeding maximum', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        limit: 101,
      }

      const result = statementQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        offset: -1,
      }

      const result = statementQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject zero or negative limit', () => {
      const invalidData = {
        pollId: '123e4567-e89b-12d3-a456-426614174000',
        limit: 0,
      }

      const result = statementQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})