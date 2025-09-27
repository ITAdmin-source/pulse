import { describe, it, expect } from 'vitest'
import {
  VoteValue,
  VOTE_VALUES,
  isValidVoteValue,
  getVoteLabel,
  calculateVoteDistribution,
} from '@/lib/utils/voting'

describe('Voting Utilities', () => {
  describe('VOTE_VALUES constants', () => {
    it('should have correct vote value constants', () => {
      expect(VOTE_VALUES.DISAGREE).toBe(-1)
      expect(VOTE_VALUES.NEUTRAL).toBe(0)
      expect(VOTE_VALUES.AGREE).toBe(1)
    })

    it('should be readonly constants', () => {
      // TypeScript compilation ensures these are readonly,
      // but we can test they exist and have correct values
      expect(typeof VOTE_VALUES.DISAGREE).toBe('number')
      expect(typeof VOTE_VALUES.NEUTRAL).toBe('number')
      expect(typeof VOTE_VALUES.AGREE).toBe('number')
    })
  })

  describe('isValidVoteValue', () => {
    it('should validate correct vote values', () => {
      expect(isValidVoteValue(-1)).toBe(true)
      expect(isValidVoteValue(0)).toBe(true)
      expect(isValidVoteValue(1)).toBe(true)
    })

    it('should reject invalid vote values', () => {
      expect(isValidVoteValue(2)).toBe(false)
      expect(isValidVoteValue(-2)).toBe(false)
      expect(isValidVoteValue(0.5)).toBe(false)
      expect(isValidVoteValue('1')).toBe(false)
      expect(isValidVoteValue('agree')).toBe(false)
      expect(isValidVoteValue(true)).toBe(false)
      expect(isValidVoteValue(false)).toBe(false)
      expect(isValidVoteValue(null)).toBe(false)
      expect(isValidVoteValue(undefined)).toBe(false)
      expect(isValidVoteValue({})).toBe(false)
      expect(isValidVoteValue([])).toBe(false)
    })

    it('should work with VOTE_VALUES constants', () => {
      expect(isValidVoteValue(VOTE_VALUES.AGREE)).toBe(true)
      expect(isValidVoteValue(VOTE_VALUES.NEUTRAL)).toBe(true)
      expect(isValidVoteValue(VOTE_VALUES.DISAGREE)).toBe(true)
    })

    it('should handle edge cases', () => {
      expect(isValidVoteValue(Number.NaN)).toBe(false)
      expect(isValidVoteValue(Number.POSITIVE_INFINITY)).toBe(false)
      expect(isValidVoteValue(Number.NEGATIVE_INFINITY)).toBe(false)
    })
  })

  describe('getVoteLabel', () => {
    it('should return default labels', () => {
      expect(getVoteLabel(VOTE_VALUES.AGREE)).toBe('Agree')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL)).toBe('Neutral')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE)).toBe('Disagree')
    })

    it('should return custom labels when provided', () => {
      const customLabels = {
        support: 'Support',
        oppose: 'Oppose',
        unsure: 'Unsure',
      }

      expect(getVoteLabel(VOTE_VALUES.AGREE, customLabels)).toBe('Support')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL, customLabels)).toBe('Unsure')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE, customLabels)).toBe('Oppose')
    })

    it('should fall back to defaults for partial custom labels', () => {
      const partialLabels = {
        support: 'Yes',
        // oppose and unsure not provided
      }

      expect(getVoteLabel(VOTE_VALUES.AGREE, partialLabels)).toBe('Yes')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL, partialLabels)).toBe('Neutral')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE, partialLabels)).toBe('Disagree')
    })

    it('should handle null custom labels', () => {
      const labelsWithNull = {
        support: null,
        oppose: 'No',
        unsure: null,
      }

      expect(getVoteLabel(VOTE_VALUES.AGREE, labelsWithNull)).toBe('Agree')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL, labelsWithNull)).toBe('Neutral')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE, labelsWithNull)).toBe('No')
    })

    it('should handle empty string custom labels', () => {
      const labelsWithEmpty = {
        support: '',
        oppose: 'Reject',
        unsure: '',
      }

      expect(getVoteLabel(VOTE_VALUES.AGREE, labelsWithEmpty)).toBe('Agree')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL, labelsWithEmpty)).toBe('Neutral')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE, labelsWithEmpty)).toBe('Reject')
    })

    it('should work with numeric vote values directly', () => {
      expect(getVoteLabel(1 as VoteValue)).toBe('Agree')
      expect(getVoteLabel(0 as VoteValue)).toBe('Neutral')
      expect(getVoteLabel(-1 as VoteValue)).toBe('Disagree')
    })

    it('should handle emoji or special character labels', () => {
      const emojiLabels = {
        support: '👍',
        oppose: '👎',
        unsure: '🤷',
      }

      expect(getVoteLabel(VOTE_VALUES.AGREE, emojiLabels)).toBe('👍')
      expect(getVoteLabel(VOTE_VALUES.NEUTRAL, emojiLabels)).toBe('🤷')
      expect(getVoteLabel(VOTE_VALUES.DISAGREE, emojiLabels)).toBe('👎')
    })
  })

  describe('calculateVoteDistribution', () => {
    it('should calculate distribution for mixed votes', () => {
      const votes: VoteValue[] = [1, 1, 1, 0, 0, -1]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(3)
      expect(result.neutral).toBe(2)
      expect(result.disagree).toBe(1)
      expect(result.total).toBe(6)
      expect(result.percentages.agree).toBe(50)
      expect(result.percentages.neutral).toBeCloseTo(33.33, 2)
      expect(result.percentages.disagree).toBeCloseTo(16.67, 2)
    })

    it('should handle empty votes array', () => {
      const votes: VoteValue[] = []
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(0)
      expect(result.neutral).toBe(0)
      expect(result.disagree).toBe(0)
      expect(result.total).toBe(0)
      expect(result.percentages.agree).toBe(0)
      expect(result.percentages.neutral).toBe(0)
      expect(result.percentages.disagree).toBe(0)
    })

    it('should handle all agree votes', () => {
      const votes: VoteValue[] = [1, 1, 1, 1]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(4)
      expect(result.neutral).toBe(0)
      expect(result.disagree).toBe(0)
      expect(result.total).toBe(4)
      expect(result.percentages.agree).toBe(100)
      expect(result.percentages.neutral).toBe(0)
      expect(result.percentages.disagree).toBe(0)
    })

    it('should handle all disagree votes', () => {
      const votes: VoteValue[] = [-1, -1, -1]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(0)
      expect(result.neutral).toBe(0)
      expect(result.disagree).toBe(3)
      expect(result.total).toBe(3)
      expect(result.percentages.agree).toBe(0)
      expect(result.percentages.neutral).toBe(0)
      expect(result.percentages.disagree).toBe(100)
    })

    it('should handle all neutral votes', () => {
      const votes: VoteValue[] = [0, 0, 0, 0, 0]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(0)
      expect(result.neutral).toBe(5)
      expect(result.disagree).toBe(0)
      expect(result.total).toBe(5)
      expect(result.percentages.agree).toBe(0)
      expect(result.percentages.neutral).toBe(100)
      expect(result.percentages.disagree).toBe(0)
    })

    it('should calculate correct percentages for equal distribution', () => {
      const votes: VoteValue[] = [1, 0, -1]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(1)
      expect(result.neutral).toBe(1)
      expect(result.disagree).toBe(1)
      expect(result.total).toBe(3)
      expect(result.percentages.agree).toBeCloseTo(33.33, 2)
      expect(result.percentages.neutral).toBeCloseTo(33.33, 2)
      expect(result.percentages.disagree).toBeCloseTo(33.33, 2)
    })

    it('should handle large number of votes', () => {
      const votes: VoteValue[] = [
        ...Array(1000).fill(1),
        ...Array(500).fill(0),
        ...Array(250).fill(-1),
      ]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(1000)
      expect(result.neutral).toBe(500)
      expect(result.disagree).toBe(250)
      expect(result.total).toBe(1750)
      expect(result.percentages.agree).toBeCloseTo(57.14, 2)
      expect(result.percentages.neutral).toBeCloseTo(28.57, 2)
      expect(result.percentages.disagree).toBeCloseTo(14.29, 2)
    })

    it('should handle single vote', () => {
      const votes: VoteValue[] = [1]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(1)
      expect(result.neutral).toBe(0)
      expect(result.disagree).toBe(0)
      expect(result.total).toBe(1)
      expect(result.percentages.agree).toBe(100)
      expect(result.percentages.neutral).toBe(0)
      expect(result.percentages.disagree).toBe(0)
    })

    it('should ensure percentages add up to 100 (accounting for rounding)', () => {
      const votes: VoteValue[] = [1, 1, 0, -1] // 50%, 25%, 25%
      const result = calculateVoteDistribution(votes)

      const totalPercentage =
        result.percentages.agree +
        result.percentages.neutral +
        result.percentages.disagree

      expect(totalPercentage).toBeCloseTo(100, 2)
    })

    it('should work with VOTE_VALUES constants', () => {
      const votes: VoteValue[] = [
        VOTE_VALUES.AGREE,
        VOTE_VALUES.AGREE,
        VOTE_VALUES.NEUTRAL,
        VOTE_VALUES.DISAGREE,
      ]
      const result = calculateVoteDistribution(votes)

      expect(result.agree).toBe(2)
      expect(result.neutral).toBe(1)
      expect(result.disagree).toBe(1)
      expect(result.total).toBe(4)
    })

    it('should maintain precision for fractional percentages', () => {
      const votes: VoteValue[] = [1, 1, 1, 0, 0, 0, 0] // 3/7 agree, 4/7 neutral
      const result = calculateVoteDistribution(votes)

      expect(result.percentages.agree).toBeCloseTo(42.857, 3)
      expect(result.percentages.neutral).toBeCloseTo(57.143, 3)
      expect(result.percentages.disagree).toBe(0)
    })
  })

  describe('VoteValue type', () => {
    it('should only accept valid vote values', () => {
      // TypeScript compilation ensures type safety
      const validVotes: VoteValue[] = [-1, 0, 1]
      expect(validVotes).toHaveLength(3)

      // Test that each value is properly typed
      expect(isValidVoteValue(validVotes[0])).toBe(true)
      expect(isValidVoteValue(validVotes[1])).toBe(true)
      expect(isValidVoteValue(validVotes[2])).toBe(true)
    })
  })
})