import { describe, it, expect } from 'vitest'
import {
  createUserPollInsightSchema,
  updateUserPollInsightSchema,
  getUserPollInsightSchema,
} from '@/lib/validations/insight'

describe('Insight Validation Schemas', () => {
  describe('createUserPollInsightSchema', () => {
    it('should validate valid insight creation data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'This user tends to agree with environmental statements but disagrees with economic policy statements.',
      }

      const result = createUserPollInsightSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.userId).toBe(validData.userId)
        expect(result.data.pollId).toBe(validData.pollId)
        expect(result.data.insight).toBe(validData.insight)
      }
    })

    it('should validate insight with metadata', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'User voting pattern analysis.',
        metadata: {
          aiModel: 'gpt-4',
          confidence: 0.85,
          categories: ['environment', 'economy'],
          votingPatterns: {
            mostAgreedTopics: ['climate change', 'renewable energy'],
            mostDisagreedTopics: ['tax increases', 'regulation'],
          },
        },
      }

      const result = createUserPollInsightSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.metadata).toEqual(validData.metadata)
      }
    })

    it('should accept insight without metadata', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'Basic insight without metadata.',
      }

      const result = createUserPollInsightSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'Valid insight content.',
      }

      const result = createUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid user ID')
      }
    })

    it('should reject invalid poll ID', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: 'not-a-uuid',
        insight: 'Valid insight content.',
      }

      const result = createUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid poll ID')
      }
    })

    it('should reject empty insight content', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: '',
      }

      const result = createUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Insight content is required')
      }
    })

    it('should require all mandatory fields', () => {
      const incompleteData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing pollId and insight
      }

      const result = createUserPollInsightSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })

    it('should accept complex metadata structures', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'Complex insight analysis.',
        metadata: {
          analysis: {
            sentimentScore: 0.75,
            topicClusters: [
              { name: 'Environment', statements: 5, avgScore: 0.8 },
              { name: 'Economy', statements: 3, avgScore: -0.2 },
            ],
          },
          timestamp: '2024-01-15T10:30:00Z',
          version: '1.2.0',
        },
      }

      const result = createUserPollInsightSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateUserPollInsightSchema', () => {
    it('should validate insight update data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: 'Updated insight with new analysis.',
        metadata: {
          updatedAt: new Date().toISOString(),
          version: '1.1.0',
        },
      }

      const result = updateUserPollInsightSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.insight).toBe(validData.insight)
        expect(result.data.metadata).toEqual(validData.metadata)
      }
    })

    it('should have same validation rules as create schema', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: '',
      }

      const result = updateUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty insight in update', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
        insight: '',
      }

      const result = updateUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Insight content is required')
      }
    })
  })

  describe('getUserPollInsightSchema', () => {
    it('should validate insight retrieval parameters', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = getUserPollInsightSchema.safeParse(validData)
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

      const result = getUserPollInsightSchema.safeParse(incompleteData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        pollId: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = getUserPollInsightSchema.safeParse(invalidData)
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

      const result = getUserPollInsightSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid poll ID')
      }
    })
  })
})