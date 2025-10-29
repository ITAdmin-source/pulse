# Statement Ordering System

**Purpose:** Intelligently routes users to the most valuable statements to vote on, improving opinion clustering quality by maximizing information gain.

**Last Updated:** 2025-10-29

---

## Overview

Pulse implements a **hybrid adaptive weighted ordering algorithm** that balances democratic participation (ensuring new statements get visibility) with clustering optimization (prioritizing statements that differentiate opinion groups).

### Three Ordering Modes

1. **Sequential Mode** (`statementOrderMode = "sequential"`)
   - Chronological order by `created_at`
   - Predictable, simple behavior
   - Use case: Specific poll types where order matters

2. **Random Mode** (`statementOrderMode = "random"`)
   - Deterministic seeded shuffle (same user = same order on refresh)
   - Balanced data collection across all statements
   - Use case: Default mode when weighted ordering not desired

3. **Weighted Mode** (`statementOrderMode = "weighted"`) **← NEW**
   - Adaptive algorithm with two sub-modes
   - Optimizes for clustering quality + democratic participation
   - Use case: Maximize insight quality from opinion clustering

---

## Weighted Algorithm Details

### Two Sub-Modes

#### 🎯 Clustering Mode (20+ users)

**When:** Poll has 20+ voters and clustering has been computed

**Four Weight Factors:**

1. **Predictiveness** (0.0 - 1.0)
   - Measures variance in group agreements
   - High variance = high value for clustering
   - Formula: `variance(group_agreements) / 0.25` (normalized)
   - Example: Groups at [90%, 10%, 85%, 5%] → predictiveness ≈ 0.72

2. **Consensus Potential** (0.0 - 1.0)
   - Likelihood of broad agreement/disagreement
   - Based on classification type:
     - Consensus statements → 1.0
     - Bridge statements → 0.7
     - Others → ratio of groups with strong opinions (>60% or <40%)

3. **Recency Boost** (0.1 - 2.0)
   - Time-based priority for new statements
   - First 24 hours → 2.0x multiplier
   - Exponential decay: half-life = 7 days
   - Minimum: 0.1x (never goes to zero)

4. **Pass Rate Penalty** (0.1 - 1.0)
   - Downweights confusing statements
   - 0% pass rate → 1.0 (no penalty)
   - 100% pass rate → 0.1 (heavy penalty)
   - **No votes yet → 1.0 (no penalty)** - Gives equal opportunity to gather initial data
   - Formula: `max(1.0 - passRate * 0.9, 0.1)`

**Combined Weight Formula:**
```
weight = predictiveness × consensus_potential × recency × pass_rate_penalty
```

#### 🌱 Cold Start Mode (<20 users)

**When:** Poll has <20 voters (clustering not yet available)

**Three Weight Factors:**

1. **Vote Count Boost** (0.5 - 1.5)
   - Prioritizes less-voted statements
   - Ensures balanced data collection
   - Formula: `clamp(2.0 - voteCount/avgVotes, 0.5, 1.5)`

2. **Recency Boost** (0.1 - 2.0)
   - Same as clustering mode
   - Ensures new statements get visibility

3. **Pass Rate Penalty** (0.1 - 1.0)
   - Same as clustering mode
   - Downweights confusing statements
   - **No votes yet → 1.0 (no penalty)** - Gives equal opportunity to gather initial data

**Combined Weight Formula:**
```
weight = vote_count_boost × recency × pass_rate_penalty
```

---

## Weighted Random Selection

Higher-weighted statements are **more likely** to appear first, but not guaranteed:

### Algorithm

1. Calculate cumulative weights for all unvoted statements
2. **Apply statement-specific perturbations** (±5% of base weight) using unique seeds
3. Generate seeded random number ∈ [0, total_weight]
4. Select statement where random falls in cumulative distribution
5. Remove selected statement and repeat

### Deterministic Seeding

```typescript
// User-specific seed for overall order
seed = hash(userId + pollId + batchNumber)

// Statement-specific perturbation (ensures different users see different orders)
stmtSeed = hash(seed + statementId)
perturbation = (seededRandom(stmtSeed) - 0.5) * 0.1 * baseWeight  // ±5%
finalWeight = baseWeight + perturbation
```

**Benefits:**
- Same user refreshing page → same order (consistency)
- **Different users → different orders** (better data collection, no identical sequences)
- Different batches → different orders (variety)
- Statement-specific perturbations prevent all users from seeing identical orders

---

## Caching Strategy

### Smart Invalidation with Eager Recalculation

**Weights cached in `statement_weights` table until:**
- **Batch completion** - Cache invalidated + immediate recalculation for ALL statements
- Clustering is recomputed (after batch completion or milestones)
- New statement is approved (affects recency distribution)

**No time-based TTL** - weights stay valid until data changes.

**Eager Recalculation (New):**
When a voting batch is completed, the system now:
1. Invalidates the old weight cache
2. **Immediately recalculates** weights for all approved statements
3. Caches the fresh weights in the database

This ensures statement weights always reflect the current vote distribution, eliminating the stale cache problem where users saw outdated ordering.

### Performance

| Scenario | Latency | Description |
|----------|---------|-------------|
| Cached weights | <10ms | Database lookup only |
| Uncached weights | 50-100ms | Calculate + save to cache |
| First poll load | 100-150ms | Cold start calculation |

### Cache Hit Rate

- After warmup (10+ votes): **>90%** expected
- Most requests use cached weights
- Recalculation only on data changes

---

## Recent Improvements (2025-10-29)

### 1. Statement-Specific Perturbations

**Problem:** All users were seeing identical statement orders because perturbations used a shared RNG sequence.

**Solution:** Each statement now gets a unique perturbation based on `hash(userSeed + statementId)`, ensuring:
- Different users see different orders (better data collection)
- Same user sees consistent order on refresh (UX consistency)
- Weight-based priority preserved (±5% perturbation range)

**Impact:** Average overlap between users reduced from 100% to ~35% (3.5/10 statements in common).

### 2. Eager Weight Recalculation

**Problem:** After batch completion, cache was invalidated but not recalculated, leading to lazy loading with stale data snapshots.

**Solution:** Automatically recalculate weights for ALL approved statements immediately after batch completion.

**Impact:**
- Weights always reflect current vote distribution
- Eliminates stale cache problem
- Performance: ~1.8s for 38 statements (acceptable for background operation)

### 3. Removed 0-Vote Penalty

**Problem:** Statements with 0 votes had a 0.5 pass rate penalty, reducing their exposure by 50% compared to 1-vote statements. This created a chicken-and-egg problem where new statements struggled to get initial votes.

**Solution:** Changed pass rate penalty from 0.5 → 1.0 for statements with no votes.

**Impact:**
- 0-vote statements now get equal priority to 1-vote statements
- Expected exposure increased by 66% (1.99 → 3.31 per batch of 10)
- More balanced distribution: ~3 zero-vote + ~5 one-vote statements per batch
- Eliminates unfair advantage for statements that got lucky early
- Pass rate penalty still activates after gathering actual voting data

---

## Architecture

### Database Schema

**Table:** `statement_weights`

| Column | Type | Description |
|--------|------|-------------|
| `poll_id` | UUID | Poll identifier (FK) |
| `statement_id` | UUID | Statement identifier (FK) |
| `predictiveness` | REAL | 0.0 - 1.0 (clustering mode) |
| `consensus_potential` | REAL | 0.0 - 1.0 (clustering mode) |
| `recency_boost` | REAL | 0.1 - 2.0 (both modes) |
| `pass_rate_penalty` | REAL | 0.1 - 1.0 (both modes) |
| `vote_count_boost` | REAL | 0.5 - 1.5 (cold start only) |
| `combined_weight` | REAL | Product of all factors |
| `mode` | TEXT | "clustering" or "cold_start" |
| `calculated_at` | TIMESTAMP | When weight was calculated |

**Indexes:**
- Unique on `(statement_id, poll_id)`
- Index on `poll_id` for efficient lookups

### Service Layer

**File:** `lib/services/statement-weighting-service.ts`

**Key Methods:**
- `getStatementWeights(pollId, statementIds)` - Main entry point (checks cache → calculates → saves)
- `calculateClusteringWeights()` - Uses group agreements + classifications
- `calculateColdStartWeights()` - Uses vote counts + basic stats
- `invalidateWeights(pollId)` - Clear cache for poll

### Integration Points

#### 1. With Clustering Service

`lib/services/clustering-service.ts:373-385`

```typescript
// After successful clustering computation
await StatementWeightingService.invalidateWeights(pollId);
```

#### 2. With Statement Approval

`actions/statements-actions.ts:316-323`

```typescript
// After statement approved
await StatementWeightingService.invalidateWeights(statement.pollId);
```

#### 3. With Voting Flow - Batch Completion

`lib/services/voting-service.ts:227-270`

```typescript
// After batch completion: Invalidate + Eager Recalculation
await StatementWeightingService.invalidateWeights(pollId);

// Fetch all approved statements
const approvedStatements = await db
  .select({ id: statementsSchema.id })
  .from(statementsSchema)
  .where(
    and(
      eq(statementsSchema.pollId, pollId),
      eq(statementsSchema.approved, true)
    )
  );

// Immediately recalculate weights for ALL statements
await StatementWeightingService.getStatementWeights(
  pollId,
  approvedStatements.map(s => s.id)
);
```

#### 4. With Statement Ordering

`lib/services/statement-ordering-service.ts:112-198`

```typescript
// Weighted strategy with statement-specific perturbations
const statementWeights = await StatementWeightingService.getStatementWeights(
  pollId,
  statementIds
);

// Apply unique perturbations per statement
const items = statements.map(s => {
  const baseWeight = weights.get(s.id) ?? 0.5;
  const stmtSeedInput = `${seed}-${s.id}`;
  const stmtSeed = stringToSeed(stmtSeedInput);
  const stmtRng = new SeededRandom(stmtSeed);
  const perturbation = (stmtRng.next() - 0.5) * 0.1 * baseWeight;
  return { stmt: s, weight: baseWeight + perturbation };
});
```

---

## Usage

### For Poll Creators

Set ordering mode in poll configuration:

```typescript
poll.statementOrderMode = "weighted"; // Enable adaptive routing
poll.statementOrderMode = "random";   // Deterministic shuffle
poll.statementOrderMode = "sequential"; // Chronological order
```

### For Developers

The system works automatically - no manual intervention needed:

1. **VotingService** calls `StatementOrderingService.orderStatements()`
2. **StatementOrderingService** selects strategy based on `poll.statementOrderMode`
3. **WeightedStrategy** calls `StatementWeightingService.getStatementWeights()`
4. **StatementWeightingService** checks cache → calculates if needed → returns weights
5. **WeightedStrategy** performs weighted random selection
6. Returns ordered statements to voting flow

---

## Testing

### Unit Tests

**File:** `lib/utils/__tests__/statement-weights.test.ts`

Tests each weight factor calculation:
- Predictiveness with high/low variance
- Consensus potential for different classification types
- Recency boost with different ages
- Pass rate penalty with different pass rates
- Vote count boost for cold start

### Integration Tests

**File:** `lib/services/__tests__/statement-weighting-service.test.ts`

Tests service behavior:
- Cold start mode (<20 users)
- Clustering mode (20+ users)
- Cache hits and misses
- Cache invalidation
- Mode switching

### Manual Testing

```bash
# Test weighted ordering on a poll
npm run dev

# Navigate to poll in weighted mode
# Check browser console for weight logs
# Verify deterministic ordering (refresh → same order)
```

---

## Debugging

### Enable Detailed Logging

Add console logs in weighting service:

```typescript
console.log("[Weights]", {
  mode: components.mode,
  statementId,
  weight: components.combinedWeight,
  predictiveness: components.predictiveness,
  consensus: components.consensusPotential,
  recency: components.recencyBoost,
  passRatePenalty: components.passRatePenalty,
});
```

### Inspect Cached Weights

```sql
SELECT
  statement_id,
  combined_weight,
  predictiveness,
  consensus_potential,
  recency_boost,
  pass_rate_penalty,
  vote_count_boost,
  mode,
  calculated_at
FROM statement_weights
WHERE poll_id = '<poll_id>'
ORDER BY combined_weight DESC;
```

### Test Different Modes

```typescript
// Force clustering mode
poll.statementOrderMode = "weighted";
// Ensure poll has 20+ users

// Force cold start
// Create poll with <20 users, use weighted mode

// Force random mode (fallback)
poll.statementOrderMode = "random";
```

---

## Performance Optimization

### Current Optimizations

✅ **Batch calculation** - Calculate all statement weights in one query
✅ **Smart invalidation** - Only recalculate when data changes
✅ **Database caching** - Persistent cache survives server restarts
✅ **Graceful fallback** - Falls back to random mode on errors

### Future Enhancements

1. **In-memory cache** - Add Node.js LRU cache layer (optional)
2. **Pre-computation** - Calculate weights immediately after clustering (background job)
3. **Per-user personalization** - Use user's cluster position to prioritize statements
4. **Diversity injection** - Occasionally show random statements to prevent echo chambers
5. **Machine learning** - Learn optimal weight combinations from clustering quality metrics

---

## Comparison with Pol.is

| Feature | Pulse (Implemented) | Pol.is (Reference) |
|---------|---------------------|--------------------|
| **Algorithm** | Weighted random selection | Semi-random routing |
| **Weight Factors** | 4 factors (predictiveness, consensus, recency, pass rate) | Not publicly documented |
| **Cold Start** | Vote count boost mode | Unknown |
| **Caching** | Smart event-driven invalidation | Unknown (likely time-based) |
| **Determinism** | Same user = same order | Unknown |
| **Implementation** | Server-side service | Likely edge functions |

---

## Configuration

### Poll-Level Configuration

```typescript
{
  statementOrderMode: "sequential" | "random" | "weighted",
  randomSeed: string | null  // Override for testing
}
```

### System-Wide Settings (Future)

```typescript
{
  weightedOrderingEnabled: boolean,  // Master switch
  clusteringMinUsers: number,        // Min users for clustering mode (default: 20)
  recencyColdStartHours: number,     // Cold start boost duration (default: 24)
  recencyHalfLifeDays: number,       // Recency decay rate (default: 7)
}
```

---

## FAQ

**Q: Does weighted ordering affect what users can vote on?**
A: No. All users can vote on all approved statements. Weighted ordering only affects the *order* in which statements are presented.

**Q: What happens if clustering fails?**
A: The system automatically falls back to cold start mode (vote count + recency + pass rate) or random mode on errors.

**Q: Can I test weighted ordering without 20 users?**
A: Yes! Cold start mode works with any number of users. You'll see vote count boost instead of predictiveness/consensus factors.

**Q: How do I know if weights are being cached?**
A: Check database for `statement_weights` records. Also monitor response times (<10ms = cached, 50-100ms = uncached).

**Q: Does this work with anonymous users?**
A: Yes! Anonymous users are treated the same as authenticated users. Their `session_id` is used for deterministic seeding.

---

## Files Reference

| File | Purpose |
|------|---------|
| `db/schema/statement-weights.ts` | Database schema |
| `lib/utils/statement-weights.ts` | Weight calculation algorithms |
| `lib/services/statement-weighting-service.ts` | Main service (caching + calculation) |
| `lib/services/statement-ordering-service.ts` | Strategy pattern (sequential/random/weighted) |
| `db/queries/statement-weight-queries.ts` | Database queries |
| `actions/statements-actions.ts` | Statement approval integration |
| `lib/services/clustering-service.ts` | Clustering integration |

---

## Rollout Recommendations

### Gradual Rollout

1. **Week 1:** Enable on 1-2 test polls (manual override)
2. **Week 2:** Enable on 10% of new polls
3. **Week 3:** Enable on 50% of new polls
4. **Week 4:** Enable on 100% of new polls (default)

### Monitoring Metrics

Track these metrics to validate effectiveness:

- **Clustering quality:** Compare silhouette scores (weighted vs random)
- **Vote distribution:** Ensure all statements get votes (no starvation)
- **Cache hit rate:** Should be >80% after warmup
- **Performance:** Weight calculation times (<100ms)
- **User feedback:** Qualitative feedback on statement relevance

### A/B Testing (Optional)

Randomly assign polls to weighted vs random ordering:
- Measure: variance explained, silhouette score, consensus detection rate
- Compare after 100+ votes
- Validate that weighted ordering improves clustering quality

---

## Summary

The weighted statement ordering system provides:

✅ **Adaptive routing** - Automatically switches between clustering and cold start modes
✅ **Democratic participation** - Recency boost ensures new statements get visibility
✅ **Quality optimization** - Predictiveness factor improves clustering results
✅ **Performance** - <100ms response time with smart caching
✅ **Reliability** - Graceful fallback to random mode on errors
✅ **Consistency** - Deterministic ordering for same user (no confusion)

**Estimated Impact:**
- **Clustering quality:** +10-20% improvement in silhouette scores
- **Data collection efficiency:** 15-25% reduction in votes needed for quality clustering
- **User engagement:** Better statement relevance → higher completion rates
