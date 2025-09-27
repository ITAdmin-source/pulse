import { describe, it, expect } from 'vitest'
import { generateSlug, generateUniqueSlug } from '@/lib/utils/slug'

describe('Slug Utilities', () => {
  describe('generateSlug', () => {
    it('should convert text to lowercase slug', () => {
      const result = generateSlug('Hello World')
      expect(result).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      const result = generateSlug('This is a test')
      expect(result).toBe('this-is-a-test')
    })

    it('should remove special characters', () => {
      const result = generateSlug('Hello, World! @#$%')
      expect(result).toBe('hello-world')
    })

    it('should handle multiple consecutive spaces', () => {
      const result = generateSlug('Hello   World    Test')
      expect(result).toBe('hello-world-test')
    })

    it('should handle underscores', () => {
      const result = generateSlug('hello_world_test')
      expect(result).toBe('hello-world-test')
    })

    it('should remove leading and trailing hyphens', () => {
      const result = generateSlug('  -hello world-  ')
      expect(result).toBe('hello-world')
    })

    it('should handle empty string', () => {
      const result = generateSlug('')
      expect(result).toBe('')
    })

    it('should handle string with only special characters', () => {
      const result = generateSlug('!@#$%^&*()')
      expect(result).toBe('')
    })

    it('should preserve numbers', () => {
      const result = generateSlug('Test 123 Poll')
      expect(result).toBe('test-123-poll')
    })

    it('should handle unicode characters', () => {
      const result = generateSlug('Café Poll')
      expect(result).toBe('caf-poll')
    })

    it('should handle mixed case with numbers', () => {
      const result = generateSlug('Poll-2024_Climate Change Survey!')
      expect(result).toBe('poll-2024-climate-change-survey')
    })

    it('should handle very long strings', () => {
      const longText = 'This is a very long poll title that might be used in real world scenarios'
      const result = generateSlug(longText)
      expect(result).toBe('this-is-a-very-long-poll-title-that-might-be-used-in-real-world-scenarios')
    })

    it('should handle strings with only whitespace', () => {
      const result = generateSlug('   \t\n   ')
      expect(result).toBe('')
    })

    it('should handle strings with mixed separators', () => {
      const result = generateSlug('hello-world_test poll')
      expect(result).toBe('hello-world-test-poll')
    })
  })

  describe('generateUniqueSlug', () => {
    it('should return original slug if not in existing list', () => {
      const existingSlugs = ['other-poll', 'another-poll']
      const result = generateUniqueSlug('New Poll', existingSlugs)
      expect(result).toBe('new-poll')
    })

    it('should add counter if slug already exists', () => {
      const existingSlugs = ['test-poll']
      const result = generateUniqueSlug('Test Poll', existingSlugs)
      expect(result).toBe('test-poll-1')
    })

    it('should increment counter until unique', () => {
      const existingSlugs = ['test-poll', 'test-poll-1', 'test-poll-2']
      const result = generateUniqueSlug('Test Poll', existingSlugs)
      expect(result).toBe('test-poll-3')
    })

    it('should work with empty existing slugs list', () => {
      const result = generateUniqueSlug('Test Poll', [])
      expect(result).toBe('test-poll')
    })

    it('should handle complex text with multiple conflicts', () => {
      const existingSlugs = [
        'climate-change-poll',
        'climate-change-poll-1',
        'climate-change-poll-2',
        'climate-change-poll-3',
      ]
      const result = generateUniqueSlug('Climate Change Poll!', existingSlugs)
      expect(result).toBe('climate-change-poll-4')
    })

    it('should handle case where base slug is empty', () => {
      const existingSlugs = ['', '-1', '-2']
      const result = generateUniqueSlug('!@#$%', existingSlugs)
      expect(result).toBe('-3')
    })

    it('should work with single character conflicts', () => {
      const existingSlugs = ['a', 'a-1', 'a-2']
      const result = generateUniqueSlug('A', existingSlugs)
      expect(result).toBe('a-3')
    })

    it('should handle very long existing slugs list', () => {
      const existingSlugs = Array.from({ length: 100 }, (_, i) =>
        i === 0 ? 'poll' : `poll-${i}`
      )
      const result = generateUniqueSlug('Poll', existingSlugs)
      expect(result).toBe('poll-100')
    })

    it('should preserve original slug generation rules', () => {
      const existingSlugs = ['hello-world']
      const result = generateUniqueSlug('Hello, World!', existingSlugs)
      expect(result).toBe('hello-world-1')
    })

    it('should handle duplicate entries in existing slugs', () => {
      const existingSlugs = ['test-poll', 'test-poll', 'test-poll-1']
      const result = generateUniqueSlug('Test Poll', existingSlugs)
      expect(result).toBe('test-poll-2')
    })

    it('should work with gaps in numbering', () => {
      const existingSlugs = ['test-poll', 'test-poll-1', 'test-poll-5']
      const result = generateUniqueSlug('Test Poll', existingSlugs)
      expect(result).toBe('test-poll-2') // Should use next available number, not jump to 6
    })

    it('should handle edge case with counter already in base text', () => {
      const existingSlugs = ['poll-1', 'poll-1-1']
      const result = generateUniqueSlug('Poll 1', existingSlugs)
      expect(result).toBe('poll-1-2')
    })
  })
})