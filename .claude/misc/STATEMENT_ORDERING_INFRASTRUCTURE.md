# Statement Ordering Infrastructure Design

**Created:** 2025-10-17
**Status:** Proposed Architecture
**Purpose:** Support multiple statement ordering algorithms (random, weighted routing, sequential)

---

## 🎯 Goals

1. **Immediate:** Implement random statement ordering (different for each user)
2. **Future:** Support sophisticated weighted routing inspired by Pol.is
3. **Maintain:** Batch consistency (users see same order on page refresh)
4. **Preserve:** No breaking changes to existing voting flow

---

## 🏗️ Architecture Overview

### Strategy Pattern with Three Modes

```
┌─────────────────────────────────────────────────────────────────┐
│                  StatementOrderingService                       │
│  (Selects strategy based on poll configuration)                │
└──────────────────────────────┬──────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────┐
        │ Sequential   │ │  Random    │ │   Weighted     │
        │  Strategy    │ │  Strategy  │ │   Strategy     │
        │  (Fallback)  │ │  (Phase 1) │ │  (Phase 2)     │
        └──────────────┘ └────────────┘ └────────────────┘
             │                  │               │
             │                  │               │
             ▼                  ▼               ▼
        createdAt         Deterministic     Edge Function
        ordering          Random Seed       with Weights
                      (userId + pollId)      (4 factors)
```

---

## 📋 Phase 1: Random Ordering (Now)

### 1. Database Schema Changes

Add to `polls` table:
```typescript
statementOrderMode: text("statement_order_mode").notNull().default("sequential")
  // Values: "sequential" | "random" | "weighted"

randomSeed: text("random_seed")
  // Optional: Override default seed for testing
```

### 2. New Service: StatementOrderingService

**Location:** `lib/services/statement-ordering-service.ts`

**Responsibilities:**
- Select ordering strategy based on poll configuration
- Provide consistent interface for all strategies
- Handle graceful fallbacks on errors

**Core Interface:**
```typescript
interface OrderingStrategy {
  /**
   * Apply ordering to a set of statements for a specific user
   * @param statements - Unvoted statements to order
   * @param context - User, poll, and batch context
   * @returns Ordered statements
   */
  orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]>;
}

interface OrderingContext {
  userId: string;
  pollId: string;
  batchNumber: number;
  pollConfig?: {
    orderMode: "sequential" | "random" | "weighted";
    randomSeed?: string;
  };
}
```

### 3. Random Strategy Implementation

**Algorithm:** Deterministic seeded shuffle
```typescript
class RandomStrategy implements OrderingStrategy {
  async orderStatements(statements: Statement[], context: OrderingContext): Promise<Statement[]> {
    // Create deterministic seed from userId + pollId + batchNumber
    const seed = this.generateSeed(context.userId, context.pollId, context.batchNumber);

    // Shuffle using seeded random
    return this.seededShuffle(statements, seed);
  }

  private generateSeed(userId: string, pollId: string, batchNumber: number): number {
    // Hash-based seed generation for consistency
    const input = `${userId}-${pollId}-${batchNumber}`;
    return simpleHash(input); // Simple hash function
  }

  private seededShuffle<T>(array: T[], seed: number): T[] {
    // Fisher-Yates shuffle with seeded PRNG
    const rng = new SeededRandom(seed);
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}
```

**Key Benefits:**
- ✅ **Deterministic:** Same user + poll + batch = same order every time
- ✅ **Different per user:** Each user sees different random order
- ✅ **Different per batch:** Same poll, different batches have different orders
- ✅ **No database writes:** Pure computation, no caching needed
- ✅ **Fast:** O(n) shuffle, no external calls

### 4. Sequential Strategy (Fallback)

**Algorithm:** Current behavior (ordered by `createdAt`)
```typescript
class SequentialStrategy implements OrderingStrategy {
  async orderStatements(statements: Statement[]): Promise<Statement[]> {
    // Already ordered by createdAt in query
    return statements;
  }
}
```

### 5. Integration with VotingService

**Modified `getStatementBatch` method:**
```typescript
static async getStatementBatch(
  pollId: string,
  userId: string,
  batchNumber: number
): Promise<typeof statements.$inferSelect[]> {
  // ... existing code to get unvoted statements ...

  // NEW: Get poll configuration
  const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  const orderMode = poll[0]?.statementOrderMode || "sequential";

  // NEW: Apply ordering strategy
  const orderedStatements = await StatementOrderingService.orderStatements(
    unvotedStatements,
    {
      userId,
      pollId,
      batchNumber,
      pollConfig: {
        orderMode,
        randomSeed: poll[0]?.randomSeed
      }
    }
  );

  return orderedStatements;
}
```

---

## 📋 Phase 2: Weighted Routing (Future)

### 1. Database Schema for Weights

**New table:** `statement_weights`
```typescript
export const statementWeights = pgTable("statement_weights", {
  id: uuid("id").defaultRandom().primaryKey(),
  statementId: uuid("statement_id").references(() => statements.id, { onDelete: "cascade" }).notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),

  // Four weight factors (from Pol.is)
  predictiveness: doublePrecision("predictiveness").notNull(), // 0.0-1.0: How well it differentiates groups
  consensusPotential: doublePrecision("consensus_potential").notNull(), // 0.0-1.0: Likelihood of consensus
  recency: doublePrecision("recency").notNull(), // 0.1-2.0+: Time-based boost for new statements
  passRatePenalty: doublePrecision("pass_rate_penalty").notNull(), // 0.1-1.0: Penalty for high "unsure" rates

  combinedWeight: doublePrecision("combined_weight").notNull(), // Final weight = product of 4 factors

  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Cache TTL (default: 5 minutes)
});
```

**New table:** `statement_vote_statistics`
```typescript
export const statementVoteStatistics = pgTable("statement_vote_statistics", {
  id: uuid("id").defaultRandom().primaryKey(),
  statementId: uuid("statement_id").references(() => statements.id, { onDelete: "cascade" }).notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),

  agreeCount: integer("agree_count").notNull().default(0),
  disagreeCount: integer("disagree_count").notNull().default(0),
  unsureCount: integer("unsure_count").notNull().default(0),
  totalVotes: integer("total_votes").notNull().default(0),

  // Per-group statistics (for predictiveness calculation)
  groupStatistics: jsonb("group_statistics"), // { "group1": { agree: 10, disagree: 5, ... }, ... }

  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});
```

**Add to system settings:**
```typescript
statementRoutingEnabled: boolean("statement_routing_enabled").notNull().default(true),
routingCacheTtlMinutes: integer("routing_cache_ttl_minutes").notNull().default(5),
routingColdStartBoost: doublePrecision("routing_cold_start_boost").notNull().default(2.0),
```

### 2. Weighted Strategy Implementation

**Algorithm:** Weighted random selection based on 4 factors
```typescript
class WeightedStrategy implements OrderingStrategy {
  async orderStatements(statements: Statement[], context: OrderingContext): Promise<Statement[]> {
    try {
      // Get or calculate weights for statements
      const weights = await this.getStatementWeights(statements, context.pollId);

      // Perform weighted random selection
      return this.weightedRandomOrder(statements, weights, context);
    } catch (error) {
      console.error("Weighted routing failed, falling back to random:", error);
      // Graceful fallback to random strategy
      return new RandomStrategy().orderStatements(statements, context);
    }
  }

  private async getStatementWeights(statements: Statement[], pollId: string): Promise<Map<string, number>> {
    const weights = new Map<string, number>();
    const now = new Date();

    // Check cache for existing weights
    const cachedWeights = await db
      .select()
      .from(statementWeights)
      .where(and(
        eq(statementWeights.pollId, pollId),
        inArray(statementWeights.statementId, statements.map(s => s.id)),
        gt(statementWeights.expiresAt, now)
      ));

    // Use cached weights
    for (const cached of cachedWeights) {
      weights.set(cached.statementId, cached.combinedWeight);
    }

    // Calculate weights for uncached statements
    const uncachedStatements = statements.filter(s => !weights.has(s.id));
    if (uncachedStatements.length > 0) {
      const calculatedWeights = await this.calculateWeights(uncachedStatements, pollId);

      // Save to cache
      await this.cacheWeights(calculatedWeights, pollId);

      // Add to map
      for (const [statementId, weight] of calculatedWeights.entries()) {
        weights.set(statementId, weight);
      }
    }

    return weights;
  }

  private async calculateWeights(statements: Statement[], pollId: string): Promise<Map<string, CombinedWeight>> {
    // This is where the 4-factor calculation happens (future implementation)
    // For now, return equal weights
    const weights = new Map<string, CombinedWeight>();

    for (const statement of statements) {
      // Future: Call edge function or calculate locally
      // const predictiveness = await this.calculatePredictiveness(statement, pollId);
      // const consensus = await this.calculateConsensusPotential(statement, pollId);
      // const recency = this.calculateRecency(statement);
      // const passRatePenalty = await this.calculatePassRatePenalty(statement, pollId);

      // Placeholder: Equal weights
      weights.set(statement.id, {
        predictiveness: 1.0,
        consensusPotential: 1.0,
        recency: 1.0,
        passRatePenalty: 1.0,
        combinedWeight: 1.0
      });
    }

    return weights;
  }

  private weightedRandomOrder(
    statements: Statement[],
    weights: Map<string, number>,
    context: OrderingContext
  ): Statement[] {
    // Weighted random selection (higher weight = more likely to appear first)
    const ordered: Statement[] = [];
    const remaining = [...statements];
    const seed = this.generateSeed(context.userId, context.pollId, context.batchNumber);
    const rng = new SeededRandom(seed);

    while (remaining.length > 0) {
      const totalWeight = remaining.reduce((sum, s) => sum + (weights.get(s.id) || 1), 0);
      let random = rng.next() * totalWeight;

      let selectedIndex = 0;
      for (let i = 0; i < remaining.length; i++) {
        random -= weights.get(remaining[i].id) || 1;
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      ordered.push(remaining[selectedIndex]);
      remaining.splice(selectedIndex, 1);
    }

    return ordered;
  }
}
```

### 3. Edge Function for Weight Calculation (Optional)

**Location:** `supabase/functions/statement-routing/index.ts`

**Responsibilities:**
- Calculate predictiveness (variance across opinion groups)
- Calculate consensus potential (groups meeting consensus criteria)
- Calculate recency boost (time-based for new statements)
- Calculate pass rate penalty (penalty for high "unsure" rates)
- Cache weights in database
- Return ordered statement or fallback signal

**Benefits of Edge Function:**
- Offloads heavy computation from main server
- Can be called asynchronously
- Easy to update algorithm without deploying main app
- Graceful fallback if function fails

---

## 🔄 Migration Path

### Step 1: Add Database Columns (Non-breaking)
```bash
npm run db:generate  # Add polls.statementOrderMode and polls.randomSeed
npm run db:migrate
```

### Step 2: Create Ordering Service (New code, no changes to existing)
- Build `StatementOrderingService`
- Implement `SequentialStrategy`
- Implement `RandomStrategy`
- Write unit tests

### Step 3: Update VotingService (Minimal changes)
- Add ordering strategy selection in `getStatementBatch`
- Keep existing query logic unchanged
- Add fallback to sequential on errors

### Step 4: Admin UI (Optional)
- Add poll configuration option for ordering mode
- Default to "sequential" for existing polls
- Allow testing different modes

### Step 5: Testing
- Test random ordering consistency (same user, same batch = same order)
- Test random ordering variety (different users = different order)
- Test fallback behavior (errors return sequential)
- Load testing (ensure no performance degradation)

### Step 6: Phase 2 (Future)
- Add `statement_weights` and `statement_vote_statistics` tables
- Implement `WeightedStrategy` with 4-factor calculation
- Create Edge Function for weight computation
- Add system settings for routing configuration
- Gradual rollout with A/B testing

---

## 🎛️ Configuration & Control

### Per-Poll Configuration (polls table)
```typescript
{
  statementOrderMode: "sequential" | "random" | "weighted",
  randomSeed: string | null  // Override for testing
}
```

### System-Wide Configuration (future)
```typescript
{
  statementRoutingEnabled: boolean,  // Master switch
  routingCacheTtlMinutes: number,    // Weight cache duration
  routingColdStartBoost: number      // Recency multiplier for new statements
}
```

---

## 🔍 Key Design Decisions

### Why Deterministic Random?
- ✅ **Consistency:** Users see same order on refresh
- ✅ **No storage:** No need to save batch order in database
- ✅ **Fast:** Pure computation, no I/O
- ✅ **Different per user:** Each user gets unique randomization

### Why Not Store Batch Order?
- ❌ **Storage overhead:** Every batch for every user would need storage
- ❌ **Complexity:** Cleanup, expiration, cache invalidation
- ❌ **Performance:** Extra database reads/writes
- ✅ **Deterministic random solves all these problems**

### Why Strategy Pattern?
- ✅ **Flexibility:** Easy to add new ordering algorithms
- ✅ **Testing:** Each strategy independently testable
- ✅ **Fallback:** Graceful degradation on errors
- ✅ **Future-proof:** Weighted routing slots in easily

### Why Weighted Random Instead of Pure Ranking?
- ✅ **Exploration:** Lower-weighted statements still get shown occasionally
- ✅ **Diversity:** Different users see different orders (better data collection)
- ✅ **Avoids stagnation:** New statements don't get permanently buried
- ✅ **Based on Pol.is research:** Proven approach for clustering

---

## 📊 Performance Considerations

### Random Strategy (Phase 1)
- **Time complexity:** O(n) shuffle
- **Space complexity:** O(n) array copy
- **No database queries:** Pure computation
- **Expected latency:** <1ms for 100 statements

### Weighted Strategy (Phase 2)
- **Cache hits:** ~1ms (read from database)
- **Cache misses:** 50-200ms (calculate + write)
- **Cache TTL:** 5 minutes (configurable)
- **Fallback:** Falls back to random on errors

### Impact on Existing Flow
- ✅ **No additional queries** for sequential/random modes
- ✅ **Same batch loading** mechanism
- ✅ **No changes to StatementManager**
- ✅ **Backward compatible** (default to sequential)

---

## 🧪 Testing Strategy

### Unit Tests
- ✅ Deterministic random produces consistent results
- ✅ Different users get different orders
- ✅ Different batches get different orders
- ✅ Sequential strategy maintains createdAt order
- ✅ Weighted strategy respects weight distribution

### Integration Tests
- ✅ VotingService correctly applies strategies
- ✅ Poll configuration is respected
- ✅ Fallback to sequential on errors
- ✅ Batch consistency on page refresh

### E2E Tests
- ✅ User sees consistent order within batch
- ✅ User sees different order in next batch
- ✅ Different users see different orders
- ✅ Admin can configure ordering mode

---

## 📝 Implementation Checklist

### Phase 1: Random Ordering ✅ Ready to Build
- [ ] Add `statementOrderMode` and `randomSeed` columns to polls table
- [ ] Generate and apply migration
- [ ] Create `lib/services/statement-ordering-service.ts`
- [ ] Implement `SequentialStrategy`
- [ ] Implement `RandomStrategy` with seeded shuffle
- [ ] Add `SeededRandom` utility class
- [ ] Update `VotingService.getStatementBatch()` to use ordering service
- [ ] Write unit tests for strategies
- [ ] Write integration tests
- [ ] Test in development
- [ ] Update poll creation form to set ordering mode
- [ ] Deploy to production (default to sequential for safety)

### Phase 2: Weighted Routing 🔮 Future
- [ ] Add `statement_weights` table
- [ ] Add `statement_vote_statistics` table
- [ ] Add system settings for routing configuration
- [ ] Implement `WeightedStrategy` with 4-factor calculation
- [ ] Create Edge Function for weight computation
- [ ] Implement predictiveness calculation (variance across groups)
- [ ] Implement consensus potential calculation
- [ ] Implement recency boost calculation
- [ ] Implement pass rate penalty calculation
- [ ] Add weight caching mechanism
- [ ] Add admin UI for routing configuration
- [ ] A/B testing framework
- [ ] Gradual rollout with monitoring

---

## 🚀 Recommended Next Steps

1. **Review this design** with the team
2. **Create database migration** for Phase 1 columns
3. **Build StatementOrderingService** with Sequential + Random strategies
4. **Update VotingService** to use ordering service
5. **Test thoroughly** in development
6. **Deploy with sequential as default** (safe rollout)
7. **Enable random for new polls** after monitoring
8. **Plan Phase 2** (weighted routing) based on Phase 1 learnings

---

## 📚 References

- [Lovable-statement-order.md](.claude/misc/Lovable-statement-order.md) - Pol.is weighted routing system
- [VotingService](../lib/services/voting-service.ts) - Current batch loading logic
- [StatementManager](../lib/services/statement-manager.ts) - Batch navigation
- [Poll Page](../app/polls/[slug]/page.tsx) - Voting flow

