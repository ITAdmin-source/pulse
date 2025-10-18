/**
 * Simple in-memory rate limiter utility
 *
 * Usage:
 * ```ts
 * const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
 * const { success } = await limiter.check(identifier, 20); // 20 requests per minute
 * if (!success) {
 *   return Response with 429 status
 * }
 * ```
 */

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval?: number; // Max number of unique tokens to track
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the limit resets
}

class TokenBucket {
  private requests: Map<string, number[]> = new Map();
  private interval: number;
  private maxTokens: number;

  constructor(interval: number, maxTokens: number = 500) {
    this.interval = interval;
    this.maxTokens = maxTokens;

    // Clean up old entries every 60 seconds
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  check(identifier: string, limit: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.interval;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    const success = validRequests.length < limit;

    // Add current request if within limit
    if (success) {
      validRequests.push(now);
      this.requests.set(identifier, validRequests);

      // Enforce max unique tokens
      if (this.requests.size > this.maxTokens) {
        // Remove oldest entry
        const firstKey = this.requests.keys().next().value;
        if (firstKey) {
          this.requests.delete(firstKey);
        }
      }
    }

    return {
      success,
      limit,
      remaining: Math.max(0, limit - validRequests.length),
      reset: now + this.interval,
    };
  }

  private cleanup() {
    const now = Date.now();
    const cutoff = now - this.interval;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > cutoff);

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export function rateLimit(options: RateLimitOptions) {
  const bucket = new TokenBucket(
    options.interval,
    options.uniqueTokenPerInterval
  );

  return {
    check: (identifier: string, limit: number): Promise<RateLimitResult> => {
      return Promise.resolve(bucket.check(identifier, limit));
    },
  };
}

// Pre-configured limiters for common use cases
export const voteLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
});

export const statementLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 2000,
});
