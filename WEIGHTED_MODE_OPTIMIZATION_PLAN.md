# Weighted Mode Optimization Plan

**Date:** 2025-10-28
**Context:** Weighted mode will be most common, need to optimize for production
**Goal:** Reduce page load from 2-5 seconds to <1 second

---

## Current Performance Analysis

### Weighted Mode Current Timeline (Uncached)

```
getStatementBatch() [1500-2500ms total]
  ├─ Query voted statement IDs [100-200ms]
  ├─ Query poll config [50-100ms]
  ├─ Query ALL unvoted statements [100-300ms]
  └─ StatementOrderingService.orderStatements() [1000-1800ms]
      ├─ StatementWeightingService.getStatementWeights() [800-1500ms]
      │   ├─ getCachedWeightsForStatements() [50-100ms]
      │   ├─ ClusteringService.isEligibleForClustering() [50-100ms]
      │   ├─ calculateWeights() [400-1000ms]
      │   │   ├─ Query statements data [50-100ms]
      │   │   ├─ Query statement_classifications [100-200ms]
      │   │   ├─ Query vote counts [100-200ms]
      │   │   └─ Calculate weight formulas [50-100ms]
      │   └─ upsertStatementWeights() [100-200ms]
      └─ weightedRandomOrder() [50-100ms]
```

### Weighted Mode Current Timeline (Cached)

```
getStatementBatch() [300-500ms total]
  ├─ Query voted statement IDs [100-200ms]
  ├─ Query poll config [50-100ms]
  ├─ Query ALL unvoted statements [100-300ms]
  └─ StatementOrderingService.orderStatements() [100-200ms]
      ├─ StatementWeightingService.getStatementWeights() [50-100ms]
      │   └─ getCachedWeightsForStatements() [50-100ms] ✅ CACHE HIT
      └─ weightedRandomOrder() [50-100ms]
```

---

## Critical Bottlenecks

### Bottleneck #1: Fetching ALL Unvoted Statements

**Location:** `lib/services/voting-service.ts:555-572`

**Problem:**
```typescript
// Fetches EVERY unvoted statement (50-200+ statements)
const allUnvotedStatements = await db
  .select({...})
  .from(statements)
  .where(and(
    eq(statements.pollId, pollId),
    eq(statements.approved, true),
    votedIds.length > 0 ? notInArray(statements.id, votedIds) : undefined
  ))
  .orderBy(statements.createdAt); // NO LIMIT!
```

**Why it's slow:**
- Must transfer 50-200 statement objects from database
- Each statement: ~500 bytes
- Total: 25-100KB of data transfer
- Processing: Must parse all JSON

**Impact:** 100-300ms

---

### Bottleneck #2: Sequential Weight Calculation Queries

**Location:** `lib/services/statement-weighting-service.ts:186-268`

**Problem:** 3 sequential queries in clustering mode:
```typescript
// Query 1: Get statements [50-100ms]
const stmts = await db.select().from(statements)...

// Query 2: Get classifications [100-200ms]
const classifications = await db.select().from(statementClassifications)...

// Query 3: Get vote counts [100-200ms]
const voteCounts = await getStatementVoteCounts(pollId, statementIds);
```

**Impact:** 250-500ms (could be 100ms if parallel)

---

### Bottleneck #3: Weighted Random Selection Algorithm

**Location:** `lib/services/statement-ordering-service.ts:156-204`

**Problem:** O(n²) algorithm selecting statements one by one:
```typescript
while (remaining.size > 0) {  // Loops n times
  // Build cumulative weights for remaining statements
  for (const stmt of remainingStmts) {  // Loop 1: O(n)
    cumulative += weight;
  }

  // Find selected index
  for (let i = 0; i < cumulativeWeights.length; i++) {  // Loop 2: O(n)
    if (rand <= cumulativeWeights[i]) break;
  }
  // Remove selected and repeat
}
```

**Complexity:** O(n²) where n = number of statements
**Impact:** 50-100ms for 50 statements, 200ms+ for 200 statements

---

### Bottleneck #4: No Parallelization in Page Load

**Location:** `app/polls/[slug]/page.tsx:569-606`

**Problem:** Sequential loading:
```typescript
// Sequential (current)
const [votes, progress, demographics] = await Promise.all([...]);  // 600ms
const batch = await getStatementBatchAction(...);  // +1500ms = 2100ms total

// Could be parallel if we remove batchNumber dependency
```

**Impact:** 300-600ms wasted waiting

---

## Optimization Strategy

### Phase 1: Quick Wins (Today) - 50-60% Faster

#### Fix 1A: Remove `batchNumber` from Seed (Random Mode)

**For random mode only** - Since you don't care about deterministic ordering:

**File:** `lib/services/voting-service.ts:521-524`
```typescript
// BEFORE:
const seedString = randomSeed
  ? `${userId}-${randomSeed}-${batchNumber}`
  : `${userId}-${pollId}-${batchNumber}`;

// AFTER: Remove batchNumber entirely for random mode
const seedString = randomSeed
  ? `${userId}-${randomSeed}`
  : `${userId}-${pollId}`;
```

**Impact:** Enables parallelization for random mode
**Effort:** 2 minutes
**Risk:** None (you don't care about consistency)

---

#### Fix 1B: Make `batchNumber` Optional for Weighted Mode

**For weighted mode** - We still need weights, but we can parallelize:

**File:** `lib/services/voting-service.ts:481-485`
```typescript
// BEFORE:
static async getStatementBatch(
  pollId: string,
  userId: string,
  batchNumber: number
): Promise<typeof statements.$inferSelect[]>

// AFTER: Make batchNumber optional with default
static async getStatementBatch(
  pollId: string,
  userId: string,
  batchNumber: number = 1  // ← DEFAULT VALUE
): Promise<typeof statements.$inferSelect[]>
```

Then in `page.tsx`, call with default:
```typescript
// Can now call WITHOUT knowing batchNumber!
const batchResult = await getStatementBatchAction(fetchedPoll.id, dbUser.id);
```

**Impact:** Enables parallelization
**Effort:** 5 minutes
**Risk:** Low (batchNumber only affects random seed, weights are same)

---

#### Fix 1C: Parallelize Data Loading (Page Load)

**File:** `app/polls/[slug]/page.tsx:569-606`
```typescript
// BEFORE: Sequential
const [votesResult, progressResult, demographicsResult] = await Promise.all([...]);
// ... calculate batchNumber ...
const batchResult = await getStatementBatchAction(..., batchNumber);

// AFTER: Fully parallel (use default batchNumber = 1)
const [votesResult, progressResult, demographicsResult, batchResult] = await Promise.all([
  getUserVotesForPollAction(dbUser.id, fetchedPoll.id),
  getVotingProgressAction(fetchedPoll.id, dbUser.id),
  getUserDemographicsByIdAction(dbUser.id),
  getStatementBatchAction(fetchedPoll.id, dbUser.id) // ← No batchNumber needed!
]);
```

**Impact:** 300-600ms saved (37-50% faster)
**Effort:** 10 minutes
**Risk:** Low

**Expected Result After Phase 1:**
- Random mode: 800ms → 400ms (50% faster)
- Weighted mode (cached): 900ms → 500ms (44% faster)
- Weighted mode (uncached): 2100ms → 1500ms (29% faster)

---

### Phase 2: Database Optimizations (This Week) - Additional 30-40%

#### Fix 2A: Parallelize Weight Calculation Queries

**File:** `lib/services/statement-weighting-service.ts:186-215`
```typescript
// BEFORE: Sequential
const stmts = await db.select().from(statements)...;
const classifications = await db.select().from(statementClassifications)...;
const voteCounts = await getStatementVoteCounts(pollId, statementIds);

// AFTER: Parallel
const [stmts, classifications, voteCounts] = await Promise.all([
  db.select().from(statements).where(...),
  db.select().from(statementClassifications).where(...),
  getStatementVoteCounts(pollId, statementIds)
]);
```

**Impact:** 250-500ms → 100-200ms (60% faster weight calculation)
**Effort:** 10 minutes
**Risk:** None

---

#### Fix 2B: Optimize Weighted Random Selection (O(n²) → O(n log n))

**File:** `lib/services/statement-ordering-service.ts:156-204`

**Current:** O(n²) - rebuild cumulative array for each selection
**Optimized:** O(n log n) - use binary search and update cumulative array efficiently

```typescript
// AFTER: Optimized algorithm
private weightedRandomOrder(
  statements: Statement[],
  weights: Map<string, number>,
  context: OrderingContext
): Statement[] {
  const seed = this.generateSeed(context);
  const rng = new SeededRandom(seed);

  // Build initial cumulative weights array - O(n)
  const stmtWeights = statements.map(s => ({
    stmt: s,
    weight: weights.get(s.id) ?? 0.5
  }));

  const result: Statement[] = [];
  let cumulativeWeights = this.buildCumulativeWeights(stmtWeights);
  let totalWeight = cumulativeWeights[cumulativeWeights.length - 1];

  // Select statements - O(n log n) with binary search
  while (stmtWeights.length > 0) {
    const rand = rng.next() * totalWeight;

    // Binary search - O(log n)
    const idx = this.binarySearchCumulative(cumulativeWeights, rand);

    result.push(stmtWeights[idx].stmt);

    // Remove selected and update cumulative weights - O(n)
    totalWeight -= stmtWeights[idx].weight;
    stmtWeights.splice(idx, 1);

    // Rebuild cumulative for remaining (could optimize with segment tree)
    cumulativeWeights = this.buildCumulativeWeights(stmtWeights);
  }

  return result;
}

private binarySearchCumulative(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}

private buildCumulativeWeights(stmtWeights: Array<{weight: number}>): number[] {
  const cumulative: number[] = [];
  let sum = 0;
  for (const sw of stmtWeights) {
    sum += sw.weight;
    cumulative.push(sum);
  }
  return cumulative;
}
```

**Impact:** 50-100ms → 10-20ms (80% faster sorting)
**Effort:** 30 minutes
**Risk:** Medium (needs testing)

---

#### Fix 2C: Add Database Indexes

**File:** New migration

```sql
-- Index for voted statement IDs lookup
CREATE INDEX IF NOT EXISTS idx_votes_user_statement_poll
ON votes(user_id, statement_id)
WHERE statement_id IN (
  SELECT id FROM statements WHERE poll_id = ?
);

-- Index for statement classifications lookup
CREATE INDEX IF NOT EXISTS idx_classifications_poll_statement
ON statement_classifications(poll_id, statement_id);

-- Index for statement weights cache lookup
CREATE INDEX IF NOT EXISTS idx_weights_poll_statements
ON statement_weights(poll_id, statement_id);

-- Composite index for vote count aggregation
CREATE INDEX IF NOT EXISTS idx_votes_statement_count
ON votes(statement_id, value);
```

**Impact:** 50-100ms per query (20-30% faster)
**Effort:** 15 minutes
**Risk:** Low

**Expected Result After Phase 2:**
- Weighted mode (cached): 500ms → 300ms (40% faster)
- Weighted mode (uncached): 1500ms → 800ms (47% faster)

---

### Phase 3: Aggressive Caching (Next Week) - Additional 20-30%

#### Fix 3A: Pre-compute Weights on Clustering

**Trigger:** After clustering completes, immediately calculate ALL statement weights

**File:** `lib/services/clustering-service.ts` (add after clustering)
```typescript
// After clustering computation succeeds
await StatementWeightingService.invalidateWeights(pollId);

// NEW: Pre-compute weights for all statements (background job)
const allStatementIds = await db
  .select({ id: statements.id })
  .from(statements)
  .where(eq(statements.pollId, pollId));

// Fire and forget (don't await)
StatementWeightingService.getStatementWeights(
  pollId,
  allStatementIds.map(s => s.id)
).catch(err => console.error('[Clustering] Pre-compute failed:', err));
```

**Impact:** Next user gets cached weights immediately
**Effort:** 10 minutes
**Risk:** None (background job)

---

#### Fix 3B: In-Memory LRU Cache Layer

**Add Node.js LRU cache on top of database cache**

**File:** New `lib/cache/statement-weights-cache.ts`
```typescript
import LRU from 'lru-cache';

const weightCache = new LRU<string, Map<string, StatementWeight>>({
  max: 100, // 100 polls
  ttl: 5 * 60 * 1000, // 5 minutes
  updateAgeOnGet: true,
});

export function getCachedWeights(pollId: string): Map<string, StatementWeight> | undefined {
  return weightCache.get(pollId);
}

export function setCachedWeights(pollId: string, weights: Map<string, StatementWeight>): void {
  weightCache.set(pollId, weights);
}

export function invalidatePollCache(pollId: string): void {
  weightCache.delete(pollId);
}
```

**Usage in `statement-weighting-service.ts`:**
```typescript
// Check memory cache first (10ms)
const memCached = getCachedWeights(pollId);
if (memCached) return filterByStatementIds(memCached, statementIds);

// Check database cache (50-100ms)
const dbCached = await getCachedWeightsForStatements(pollId, statementIds);

// Update memory cache
setCachedWeights(pollId, dbCached);
```

**Impact:** 50-100ms → 10ms (80% faster cache hits)
**Effort:** 30 minutes
**Risk:** Low (adds memory usage ~5-10MB)

---

#### Fix 3C: Statement-Level Caching (Granular)

**Current:** Cache invalidated for ENTIRE poll when clustering updates
**Optimized:** Only invalidate changed statements

**File:** `lib/services/statement-weighting-service.ts`
```typescript
// BEFORE: Nuclear invalidation
static async invalidateWeights(pollId: string): Promise<void> {
  await invalidateWeightsQuery(pollId); // Deletes ALL weights
}

// AFTER: Selective invalidation
static async invalidateWeights(
  pollId: string,
  changedStatementIds?: string[]  // ← NEW: Optional specific statements
): Promise<void> {
  if (changedStatementIds) {
    // Only invalidate specific statements
    await invalidateWeightsQuery(pollId, changedStatementIds);
  } else {
    // Full invalidation (rare)
    await invalidateWeightsQuery(pollId);
  }
}
```

**Impact:** 80% of cache persists across clustering updates
**Effort:** 20 minutes
**Risk:** Low

**Expected Result After Phase 3:**
- Weighted mode (cached): 300ms → 200ms (33% faster)
- Weighted mode (uncached): 800ms → 600ms (25% faster)
- Cache hit rate: 60% → 90% (better persistence)

---

### Phase 4: Architectural Optimizations (Later) - Additional 10-20%

#### Fix 4A: Limit Statement Fetching in Weighted Mode

**Currently:** Fetches ALL unvoted statements (50-200+)
**Optimized:** Fetch larger batch (30-50) and select from those

**File:** `lib/services/voting-service.ts:555-586`
```typescript
// BEFORE: Fetch ALL
const allUnvotedStatements = await db.select()...;  // NO LIMIT

// AFTER: Fetch reasonable subset
const WEIGHTED_BATCH_SIZE = 30; // 3x the return size (10)

const statementBatch = await db
  .select()
  .from(statements)
  .where(and(...))
  .orderBy(statements.createdAt)
  .limit(WEIGHTED_BATCH_SIZE); // ← LIMIT!

// Apply weighted ordering to this subset
const orderedStatements = await StatementOrderingService.orderStatements(
  statementBatch, // Only 30 instead of 200!
  context
);

return orderedStatements.slice(0, 10);
```

**Tradeoff:**
- ✅ Faster: Process 30 instead of 200 statements
- ⚠️ Less optimal: May miss high-weight statements outside top 30
- ⚠️ Solution: Use recency + weight heuristic for initial fetch

**Impact:** 100-300ms → 50-100ms (67% faster)
**Effort:** 1 hour (needs careful testing)
**Risk:** Medium (may affect clustering quality)

---

#### Fix 4B: Hybrid Ordering Strategy

**Combine SQL-side ranking with weighted selection**

**File:** `lib/services/voting-service.ts:555-586`
```typescript
// BEFORE: Fetch ALL, weight in Node.js
const allUnvoted = await db.select()...;
const weighted = await orderStatements(allUnvoted);

// AFTER: SQL-side pre-filter + Node.js final selection
const candidates = await db
  .select({
    ...statements,
    // SQL-side weight estimation (simplified)
    estimatedWeight: sql<number>`
      CASE
        WHEN created_at > NOW() - INTERVAL '24 hours' THEN 2.0
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 1.5
        ELSE 1.0
      END
    `
  })
  .from(statements)
  .leftJoin(statement_weights, eq(statements.id, statement_weights.statementId))
  .where(and(...))
  .orderBy(sql`estimated_weight DESC`)
  .limit(30);  // Top 30 by rough weight

// Then apply precise weighted selection on these 30
const preciseWeighted = await orderStatements(candidates);
return preciseWeighted.slice(0, 10);
```

**Impact:** Best of both worlds (fast + optimal)
**Effort:** 2 hours
**Risk:** High (complex query, needs extensive testing)

---

## Summary: Performance Gains

### Implementation Phases

| Phase | Effort | Risk | Improvement | Cumulative Total |
|-------|--------|------|-------------|------------------|
| **Phase 1: Quick Wins** | 30 min | Low | 50-60% | **50-60% faster** |
| **Phase 2: DB Optimizations** | 1.5 hours | Low-Medium | 30-40% | **70-80% faster** |
| **Phase 3: Aggressive Caching** | 1 hour | Low | 20-30% | **80-90% faster** |
| **Phase 4: Architectural** | 3+ hours | Medium-High | 10-20% | **85-95% faster** |

### Expected Performance: Weighted Mode

| Scenario | Current | After Phase 1 | After Phase 2 | After Phase 3 | After Phase 4 |
|----------|---------|---------------|---------------|---------------|---------------|
| **Uncached (20+ users)** | 2100ms | 1500ms | 800ms | 600ms | 400ms |
| **Uncached (<20 users)** | 1500ms | 1000ms | 600ms | 400ms | 300ms |
| **Cached** | 500ms | 300ms | 200ms | 150ms | 100ms |

### Expected Performance: Random Mode

| Scenario | Current | After Phase 1 | Improvement |
|----------|---------|---------------|-------------|
| **Page Load** | 800ms | 400ms | **50% faster** |

---

## Recommended Implementation Order

### Today (30 minutes)
1. ✅ Fix 1A: Remove batchNumber from random mode seed
2. ✅ Fix 1B: Make batchNumber optional with default
3. ✅ Fix 1C: Parallelize page load data fetching

**Result:** 50-60% faster page loads

### This Week (2.5 hours)
4. Fix 2A: Parallelize weight calculation queries
5. Fix 2B: Optimize weighted random selection algorithm
6. Fix 2C: Add database indexes

**Result:** 70-80% faster page loads

### Next Week (1 hour)
7. Fix 3A: Pre-compute weights after clustering
8. Fix 3B: Add in-memory LRU cache layer
9. Fix 3C: Selective cache invalidation

**Result:** 80-90% faster page loads

### Later (Optional - 3+ hours)
10. Fix 4A: Limit statement fetching
11. Fix 4B: Hybrid ordering strategy

**Result:** 85-95% faster page loads

---

## Risk Mitigation

### For Each Change:
1. **Write tests FIRST** - Verify behavior unchanged
2. **Test with real data** - Use production poll data
3. **Monitor performance** - Add timing logs
4. **Gradual rollout** - Enable for 10% → 50% → 100%
5. **Easy rollback** - Feature flags for new code paths

### Monitoring Points:
```typescript
// Add throughout optimization
console.log('[Perf] Statement batch:', {
  mode: orderMode,
  statementCount,
  duration: `${Date.now() - startTime}ms`,
  cached: cacheHit,
});
```

---

## Questions Before Implementation

1. **Cache hit rate:** What % of requests should hit cache?
   - Suggested: 80-90% after warmup

2. **Memory budget:** How much RAM for in-memory cache?
   - Suggested: 10-20MB (100 polls × 100KB each)

3. **Clustering frequency:** How often does clustering recompute?
   - Affects cache invalidation frequency

4. **Statement count:** Typical poll size?
   - 10-50 statements: Phase 1-2 sufficient
   - 100-200 statements: Need Phase 3-4

5. **User concurrency:** Peak users on same poll?
   - High (100+): In-memory cache critical
   - Low (10-20): Database cache sufficient

---

## Next Steps

Ready to implement? Which phase should we start with?

**Recommendation:** Start with Phase 1 (Quick Wins) today:
1. Remove batchNumber dependency (2 min)
2. Enable parallel loading (10 min)
3. Test and measure (10 min)
4. Deploy and monitor (5 min)

**Total:** 30 minutes for 50-60% improvement

Should I proceed with implementing Phase 1?
