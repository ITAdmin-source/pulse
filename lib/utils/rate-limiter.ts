/**
 * Rate Limiter for AI Insight Generation
 *
 * In-memory rate limiting to prevent abuse and control costs
 * Limits: 10 insights per user per day
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// In-memory storage (resets on server restart)
// For production, consider Redis or database-backed storage
const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT = 10; // insights per day
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class RateLimiter {
  /**
   * Check if user is within rate limit
   * @param userId - User ID (database user ID)
   * @returns Object with allowed status and remaining count
   */
  static check(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    // No entry exists - allow and create new entry
    if (!entry) {
      rateLimitMap.set(userId, {
        count: 0,
        resetAt: now + WINDOW_MS,
      });
      return {
        allowed: true,
        remaining: RATE_LIMIT,
        resetAt: now + WINDOW_MS,
      };
    }

    // Entry exists but window has expired - reset
    if (now >= entry.resetAt) {
      rateLimitMap.set(userId, {
        count: 0,
        resetAt: now + WINDOW_MS,
      });
      return {
        allowed: true,
        remaining: RATE_LIMIT,
        resetAt: now + WINDOW_MS,
      };
    }

    // Within window - check count
    const remaining = RATE_LIMIT - entry.count;

    if (entry.count >= RATE_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    return {
      allowed: true,
      remaining: remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Increment rate limit counter for user
   * @param userId - User ID
   */
  static increment(userId: string): void {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry) {
      rateLimitMap.set(userId, {
        count: 1,
        resetAt: now + WINDOW_MS,
      });
      return;
    }

    // Reset if window expired
    if (now >= entry.resetAt) {
      rateLimitMap.set(userId, {
        count: 1,
        resetAt: now + WINDOW_MS,
      });
      return;
    }

    // Increment within window
    entry.count += 1;
  }

  /**
   * Get current rate limit status for user
   * @param userId - User ID
   */
  static getStatus(userId: string): { count: number; limit: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now >= entry.resetAt) {
      return {
        count: 0,
        limit: RATE_LIMIT,
        resetAt: now + WINDOW_MS,
      };
    }

    return {
      count: entry.count,
      limit: RATE_LIMIT,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clear rate limit for user (admin function)
   * @param userId - User ID
   */
  static clear(userId: string): void {
    rateLimitMap.delete(userId);
  }

  /**
   * Clear all rate limits (admin function, testing)
   */
  static clearAll(): void {
    rateLimitMap.clear();
  }

  /**
   * Get total number of tracked users
   */
  static getTrackedUserCount(): number {
    return rateLimitMap.size;
  }
}
