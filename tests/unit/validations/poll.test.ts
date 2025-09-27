import { describe, it, expect } from 'vitest'
import {
  createPollSchema,
  updatePollSchema,
  publishPollSchema,
  pollStatusSchema,
  pollQuerySchema,
} from '@/lib/validations/poll'

describe('Poll Validation Schemas', () => {
  describe('createPollSchema', () => {
    it('should validate a valid poll creation input', () => {
      const validInput = {
        question: 'Should we implement a new feature?',
        description: 'This poll is about deciding on a new feature',
        allowUserStatements: true,
        autoApproveStatements: false,
        minStatementsVotedToEnd: 5,
      }

      const result = createPollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.question).toBe(validInput.question)
        expect(result.data.allowUserStatements).toBe(true)
      }
    })

    it('should reject empty question', () => {
      const invalidInput = {
        question: '',
        description: 'Description without question',
      }

      const result = createPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Question is required')
      }
    })

    it('should reject question that is too long', () => {
      const invalidInput = {
        question: 'a'.repeat(501),
      }

      const result = createPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Question too long')
      }
    })

    it('should validate date constraints', () => {
      const now = new Date()
      const later = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow

      const validInput = {
        question: 'Test poll',
        startTime: now,
        endTime: later,
      }

      const result = createPollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject end time before start time', () => {
      const now = new Date()
      const earlier = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Yesterday

      const invalidInput = {
        question: 'Test poll',
        startTime: now,
        endTime: earlier,
      }

      const result = createPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('End time must be after start time')
      }
    })

    it('should validate button labels length', () => {
      const validInput = {
        question: 'Test poll',
        supportButtonLabel: 'Yes',
        opposeButtonLabel: 'No',
        unsureButtonLabel: 'Maybe',
      }

      const result = createPollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject button labels that are too long', () => {
      const invalidInput = {
        question: 'Test poll',
        supportButtonLabel: 'ThisIsTooLong',
      }

      const result = createPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Label too long')
      }
    })

    it('should validate minimum statements voted constraint', () => {
      const validInput = {
        question: 'Test poll',
        minStatementsVotedToEnd: 3,
      }

      const result = createPollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      expect(result.data?.minStatementsVotedToEnd).toBe(3)
    })

    it('should reject invalid minimum statements voted', () => {
      const invalidInput = {
        question: 'Test poll',
        minStatementsVotedToEnd: 0,
      }

      const result = createPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should apply default values', () => {
      const minimalInput = {
        question: 'Test poll',
      }

      const result = createPollSchema.safeParse(minimalInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allowUserStatements).toBe(false)
        expect(result.data.autoApproveStatements).toBe(false)
        expect(result.data.minStatementsVotedToEnd).toBe(5)
      }
    })
  })

  describe('updatePollSchema', () => {
    it('should validate partial updates with ID', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        question: 'Updated question',
        status: 'published' as const,
      }

      const result = updatePollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(validInput.id)
        expect(result.data.question).toBe('Updated question')
        expect(result.data.status).toBe('published')
      }
    })

    it('should reject invalid UUID', () => {
      const invalidInput = {
        id: 'not-a-uuid',
        question: 'Updated question',
      }

      const result = updatePollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'invalid' as unknown as 'draft' | 'published',
      }

      const result = updatePollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('publishPollSchema', () => {
    it('should validate poll publication', () => {
      const validInput = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const result = publishPollSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should require valid UUID', () => {
      const invalidInput = {
        id: 'invalid',
      }

      const result = publishPollSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('pollStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(pollStatusSchema.safeParse('draft').success).toBe(true)
      expect(pollStatusSchema.safeParse('published').success).toBe(true)
    })

    it('should reject invalid statuses', () => {
      expect(pollStatusSchema.safeParse('closed').success).toBe(false)
      expect(pollStatusSchema.safeParse('pending').success).toBe(false)
    })
  })

  describe('pollQuerySchema', () => {
    it('should validate query parameters with defaults', () => {
      const validInput = {
        search: 'test',
      }

      const result = pollQuerySchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.search).toBe('test')
        expect(result.data.limit).toBe(20)
        expect(result.data.offset).toBe(0)
      }
    })

    it('should validate complete query parameters', () => {
      const validInput = {
        status: 'published' as const,
        createdBy: '123e4567-e89b-12d3-a456-426614174000',
        limit: 50,
        offset: 10,
        search: 'climate',
      }

      const result = pollQuerySchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('published')
        expect(result.data.createdBy).toBe(validInput.createdBy)
        expect(result.data.limit).toBe(50)
        expect(result.data.offset).toBe(10)
      }
    })

    it('should reject invalid limit', () => {
      const invalidInput = {
        limit: 101,
      }

      const result = pollQuerySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject negative offset', () => {
      const invalidInput = {
        offset: -1,
      }

      const result = pollQuerySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject search that is too long', () => {
      const invalidInput = {
        search: 'a'.repeat(101),
      }

      const result = pollQuerySchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })
})