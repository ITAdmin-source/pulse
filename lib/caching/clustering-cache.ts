/**
 * Multi-Tier Clustering Cache
 *
 * Architecture:
 * - Layer 1: Optimistic UI (client-side, <5ms) - not implemented in this file
 * - Layer 2: In-memory cache (Node.js Map, <10ms) - implemented here
 * - Layer 3: Database cache (PostgreSQL JSONB, 50-100ms) - via ClusteringService
 *
 * This file implements Layer 2: In-memory caching with LRU eviction
 */

import type { ClusteringResult } from "@/lib/services/clustering-service";

interface CacheEntry {
  data: ClusteringResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * In-Memory Clustering Cache Manager
 * Singleton pattern with LRU eviction
 */
export class ClusteringCacheManager {
  private static instance: ClusteringCacheManager | null = null;

  /** In-memory cache: pollId -> CacheEntry */
  private cache = new Map<string, CacheEntry>();

  /** Maximum cache size (LRU eviction) */
  private maxSize = 100;

  /** Cache TTL in milliseconds (5 minutes) */
  private cacheTTL = 5 * 60 * 1000;

  /** Private constructor (Singleton) */
  private constructor() {
    // Start background cleanup task
    this.startCleanupTask();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ClusteringCacheManager {
    if (!this.instance) {
      this.instance = new ClusteringCacheManager();
    }
    return this.instance;
  }

  /**
   * Get clustering data from cache
   *
   * @param pollId - Poll ID
   * @returns Cached data or null if not found/expired
   */
  get(pollId: string): ClusteringResult | null {
    const entry = this.cache.get(pollId);

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > this.cacheTTL) {
      // Expired, remove from cache
      this.cache.delete(pollId);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.data;
  }

  /**
   * Set clustering data in cache
   *
   * @param pollId - Poll ID
   * @param data - Clustering result
   */
  set(pollId: string, data: ClusteringResult): void {
    // Check if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(pollId)) {
      // Evict least recently used entry
      this.evictLRU();
    }

    this.cache.set(pollId, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Invalidate cache for a specific poll
   *
   * @param pollId - Poll ID
   */
  invalidate(pollId: string): void {
    this.cache.delete(pollId);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
    entries: Array<{
      pollId: string;
      age: number;
      accessCount: number;
    }>;
  } {
    const entries = Array.from(this.cache.entries()).map(
      ([pollId, entry]) => ({
        pollId,
        age: Date.now() - entry.timestamp,
        accessCount: entry.accessCount,
      })
    );

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries,
    };
  }

  /**
   * Evict least recently used entry (LRU)
   */
  private evictLRU(): void {
    let lruPollId: string | null = null;
    let oldestAccess = Infinity;

    for (const [pollId, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        lruPollId = pollId;
      }
    }

    if (lruPollId) {
      this.cache.delete(lruPollId);
      console.log(`[ClusteringCache] Evicted LRU entry: ${lruPollId}`);
    }
  }

  /**
   * Start background cleanup task to remove expired entries
   * Runs every minute
   */
  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Every 1 minute
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [pollId, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.cacheTTL) {
        expiredKeys.push(pollId);
      }
    }

    if (expiredKeys.length > 0) {
      for (const key of expiredKeys) {
        this.cache.delete(key);
      }
      console.log(
        `[ClusteringCache] Cleaned up ${expiredKeys.length} expired entries`
      );
    }
  }

  /**
   * Configure cache settings
   */
  configure(options: { maxSize?: number; cacheTTL?: number }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
    }

    if (options.cacheTTL !== undefined) {
      this.cacheTTL = options.cacheTTL;
    }
  }
}

/**
 * Helper function to get clustering data with automatic caching
 * Checks Layer 2 (memory) → Layer 3 (database)
 *
 * @param pollId - Poll ID
 * @param fetchFromDB - Function to fetch from database
 * @returns Clustering result or null
 */
export async function getCachedClusteringData(
  pollId: string,
  fetchFromDB: () => Promise<ClusteringResult | null>
): Promise<ClusteringResult | null> {
  const cache = ClusteringCacheManager.getInstance();

  // Layer 2: Check in-memory cache
  const cached = cache.get(pollId);
  if (cached) {
    console.log(`[ClusteringCache] HIT (memory): ${pollId}`);
    return cached;
  }

  // Layer 3: Fetch from database
  console.log(`[ClusteringCache] MISS (memory): ${pollId}, fetching from DB`);
  const data = await fetchFromDB();

  if (data) {
    // Store in memory cache for next time
    cache.set(pollId, data);
  }

  return data;
}

/**
 * Helper function to invalidate all cache layers for a poll
 *
 * @param pollId - Poll ID
 */
export function invalidateAllCaches(pollId: string): void {
  const cache = ClusteringCacheManager.getInstance();
  cache.invalidate(pollId);
  console.log(`[ClusteringCache] Invalidated all caches for poll: ${pollId}`);
}
