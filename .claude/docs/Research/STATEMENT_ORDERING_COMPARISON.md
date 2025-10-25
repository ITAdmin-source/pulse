# Statement Ordering Algorithm Comparison

**Comparing three approaches to adaptive statement routing**

**Date:** October 25, 2025
**Purpose:** Evaluate different strategies for prioritizing which statements users should vote on

---

## Executive Summary

This document compares three different approaches to statement ordering/routing in participatory polling platforms:

1. **Pol.is** - The original platform that inspired our work, focuses on maximizing information gain by prioritizing divisive statements
2. **Lovable** - A balanced approach using 4 factors with weighted random selection
3. **Pulse** - Our implementation with hybrid clustering/cold-start modes and event-driven caching

**Key Finding:** All three systems prioritize **divisive statements** (high variance) over consensus statements, but differ significantly in their formulas, selection mechanisms, and operational modes.

---

## 1. Pol.is Approach

### Philosophy
**"Maximize information gain for opinion clustering"**

Pol.is prioritizes showing statements that best differentiate between opinion groups, treating statement ordering as an information-gathering optimization problem.

### Core Algorithm

**Priority Score = Statistical Variance of Voting Patterns**

- **High variance** (divisive statements) → **High priority** → Shown more often
- **Low variance** (consensus statements) → **Low priority** → Shown less often

**Rationale:** *"Consensus statements are lower in information for forming groups, so comments that are instructive to the formation of groups (higher statistical variance) are prioritized."*

### Technical Details

#### Weight Calculation
- **Primary Factor:** Statistical variance of votes across opinion groups
- **No explicit recency boost** documented
- **No pass rate penalty** documented
- Formula appears to be primarily variance-based

#### Selection Mechanism
- **Semi-random routing** based on priority scores
- Different users see different orderings to avoid bias
- Adaptive - changes as opinion landscape evolves

#### Operating Modes
- **Single mode** - variance-based prioritization throughout lifecycle
- No cold start vs mature poll distinction documented

#### Clustering Integration
- Uses **EMPCA** (Expectation-Maximization PCA) for incremental updates
- K-means clustering with k=2-5 groups
- Silhouette coefficient used to select optimal k
- Comment routing directly informed by current clustering state

### Strengths
✅ Theoretically optimal for information maximization
✅ Directly tied to clustering algorithm
✅ Proven track record (vTaiwan, governments worldwide)
✅ Strong academic foundation
✅ Incremental PCA enables real-time adaptation

### Weaknesses
⚠️ May under-expose consensus statements (valuable for bridging)
⚠️ New statements may not get fair initial exposure
⚠️ No documented mechanism for balancing democratic participation
⚠️ Implementation details not fully documented publicly
⚠️ May create "rich get richer" dynamics for divisive statements

### Sources
- GitHub issues: [#1289](https://github.com/compdemocracy/polis/issues/1289), [#217](https://github.com/compdemocracy/polis/issues/217)
- Academic paper: "Polis: Scaling Deliberation by Mapping High Dimensional Opinion Spaces" (Small et al., 2021)
- CompDemocracy.org documentation

---

## 2. Lovable Approach

### Philosophy
**"Balanced prioritization with democratic participation"**

Lovable balances multiple factors including divisiveness, consensus potential, recency, and clarity to ensure fair exposure while still optimizing for clustering.

### Core Algorithm

**Combined Weight = Predictiveness × Consensus Potential × Recency × Pass Rate Penalty**

All factors are multiplicative, meaning low scores in any factor significantly reduce overall priority.

### Weight Factors

#### 1. Predictiveness (0.0 - 1.0)
**Measures variance in support percentages across opinion groups**

- Calculated from group-level agreement percentages
- High variance (groups disagree) → High weight
- Low variance (groups agree) → Low weight
- **Similar to Pol.is's variance approach**

**Example:**
```
Group agreements: [90%, 10%, 85%, 5%]
Variance: high
Predictiveness: 0.72
```

#### 2. Consensus Potential (0.0 - 1.0)
**Ratio of groups meeting consensus criteria**

- Based on thresholds: min_support_pct (50%), max_opposition_pct (50%)
- Measures how many groups meet the consensus threshold
- **Unique to Lovable** - balances the divisiveness bias

**Example:**
```
4 groups: [80%, 85%, 30%, 25%]
Groups meeting threshold: 2 (first two groups >50% support)
Consensus potential: 0.5 (2/4)
```

#### 3. Recency Boost (0.1 - 2.0+)
**Time-based priority for new statements**

- New statements (<24h): **2.0x boost**
- Exponential decay: half-life = 7 days
- Minimum: **0.1x** (never reaches zero)

**Formula:**
```
if age < 24h: boost = 2.0
else: boost = 2.0 × 0.5^(days / 7)
boost = max(boost, 0.1)
```

#### 4. Pass Rate Penalty (0.1 - 1.0)
**Penalty for high "unsure" rates**

- 0% pass rate → 1.0 (no penalty)
- 50% pass rate → 0.5 (moderate penalty)
- 100% pass rate → 0.1 (heavy penalty)

**Formula:**
```
penalty = max(1.0 - pass_rate × 0.9, 0.1)
```

### Selection Mechanism

**Weighted Random Selection** (not pure ranking)

1. Calculate cumulative weights for all unvoted statements
2. Generate random number ∈ [0, total_weight]
3. Select statement where random falls in cumulative distribution
4. Remove selected and repeat

**Benefits:**
- Higher-weighted statements appear more often
- Lower-weighted statements still have a chance
- Introduces helpful randomness to prevent echo chambers

### Operating Modes
- **Single mode** - same 4 factors throughout poll lifecycle
- No distinction between cold start and mature polls

### Strengths
✅ Balances divisiveness with consensus building
✅ Recency boost ensures new statements get visibility
✅ Pass rate penalty filters out confusing statements
✅ Weighted random prevents deterministic "rich get richer"
✅ Consensus potential factor is innovative

### Weaknesses
⚠️ Multiplicative formula means one low factor kills entire weight
⚠️ No special handling for cold start (low vote counts)
⚠️ Consensus potential calculation may not align with actual consensus value
⚠️ 4 factors = more complex to tune and understand
⚠️ No caching strategy documented

---

## 3. Pulse Approach (Our Implementation)

### Philosophy
**"Adaptive hybrid with democratic participation"**

Pulse uses different strategies for cold start (<20 users) and mature polls (20+ users) to optimize for both data collection balance and clustering quality.

### Core Algorithm

**Two Operating Modes:**

#### Mode 1: Cold Start (<20 users)
**Weight = Vote Count Boost × Recency × Pass Rate Penalty**

Focus: Ensure balanced data collection across all statements

#### Mode 2: Clustering (20+ users)
**Weight = Predictiveness × Consensus Potential × Recency × Pass Rate Penalty**

Focus: Optimize for clustering quality while maintaining fairness

### Weight Factors

#### Clustering Mode (20+ users)

**1. Predictiveness (0.0 - 1.0)**
**Variance of group agreement percentages**

```typescript
variance = avg((group_agreement - mean)^2)
predictiveness = min(variance / 0.25, 1.0)  // Normalized to [0,1]
```

**Example:**
```
Groups: [90%, 10%, 85%, 5%]
Mean: 47.5%
Variance: 0.18
Predictiveness: 0.72 (0.18 / 0.25)
```

**2. Consensus Potential (0.0 - 1.0)**
**Based on statement classification type**

- **Positive/Negative Consensus:** 1.0
- **Bridge statements:** 0.7
- **Others:** Ratio of groups with strong opinions (>60% or <40%)

**Formula for non-classified:**
```typescript
strong_threshold = 0.6
strong_groups = groups.filter(ag => ag > 0.6 || ag < 0.4)
consensus_potential = strong_groups.length / total_groups
```

**3. Recency Boost (0.1 - 2.0)**
**Identical to Lovable**

- First 24h: 2.0x
- Exponential decay: half-life = 7 days
- Minimum: 0.1x

**4. Pass Rate Penalty (0.1 - 1.0)**
**Identical to Lovable**

```typescript
penalty = max(1.0 - pass_rate × 0.9, 0.1)
```

#### Cold Start Mode (<20 users)

**1. Vote Count Boost (0.5 - 1.5)**
**Prioritize less-voted statements**

```typescript
ratio = vote_count / avg_votes
boost = clamp(2.0 - ratio, 0.5, 1.5)
```

**Example:**
```
Statement A: 5 votes, avg = 10 → boost = 1.5 (prioritized)
Statement B: 15 votes, avg = 10 → boost = 0.5 (deprioritized)
Statement C: 10 votes, avg = 10 → boost = 1.0 (neutral)
```

**2. Recency Boost (0.1 - 2.0)**
Same as clustering mode

**3. Pass Rate Penalty (0.1 - 1.0)**
Same as clustering mode

### Selection Mechanism

**Weighted Random Selection with Deterministic Seeding**

```typescript
seed = hash(userId + pollId + batchNumber)
// Use seeded RNG to select from weighted distribution
```

**Benefits:**
- Same user refreshing page → same order (consistency)
- Different users → different orders (better coverage)
- Different batches → different orders (variety)

### Operating Modes

**Automatic mode switching:**

1. **Cold Start (<20 users):** Vote count balancing
2. **Clustering (20+ users):** Clustering optimization
3. **Fallback (on errors):** Falls back to random mode

### Caching Strategy

**Event-Driven Smart Invalidation**

Weights cached in `statement_weights` table until:
- ✅ Clustering is recomputed (after batch completion)
- ✅ New statement is approved (affects recency distribution)

**No time-based TTL** - weights stay valid until data actually changes.

**Performance:**
- Cached weights: <10ms (database lookup)
- Uncached weights: 50-100ms (calculate + save)
- Cache hit rate: >90% after warmup

### Strengths
✅ **Adaptive:** Different strategies for different poll maturity
✅ **Fair cold start:** Vote count boost ensures balanced data collection
✅ **Performant:** Smart caching with event-driven invalidation
✅ **Deterministic:** Same user sees same order (no confusion)
✅ **Graceful fallback:** Falls back to random on errors
✅ **Battle-tested:** Implemented and documented in Pulse

### Weaknesses
⚠️ More complex (2 modes vs 1)
⚠️ Consensus potential calculation differs from Lovable
⚠️ Requires maintenance of mode-switching logic
⚠️ Cache invalidation adds architectural complexity
⚠️ Threshold (20 users) is somewhat arbitrary

---

## Side-by-Side Comparison

### Summary Table

| Feature | Pol.is | Lovable | Pulse |
|---------|--------|---------|-------|
| **Primary Goal** | Maximize information gain | Balanced optimization | Adaptive optimization |
| **Selection Method** | Semi-random by variance | Weighted random | Weighted random (seeded) |
| **# of Factors** | 1 (variance) | 4 | 3-4 (mode-dependent) |
| **Operating Modes** | Single mode | Single mode | Dual mode (cold start + clustering) |
| **Caching** | Unknown (likely none) | Not documented | Event-driven database cache |
| **Determinism** | Non-deterministic | Non-deterministic | Deterministic (seeded) |
| **Cold Start Handling** | Same as mature | Same as mature | Special vote-count balancing |
| **Recency Boost** | Not documented | Yes (2.0x, 7-day decay) | Yes (2.0x, 7-day decay) |
| **Pass Rate Penalty** | Not documented | Yes (0.1-1.0) | Yes (0.1-1.0) |
| **Consensus Priority** | Deprioritized | Moderate priority | Moderate priority |
| **Divisive Priority** | Highly prioritized | Highly prioritized | Highly prioritized |

### Factor Breakdown

| Factor | Pol.is | Lovable | Pulse (Clustering) | Pulse (Cold Start) |
|--------|--------|---------|--------------------|--------------------|
| **Predictiveness/Variance** | ✅ Primary | ✅ 0.0-1.0 | ✅ 0.0-1.0 | ❌ |
| **Consensus Potential** | ❌ | ✅ 0.0-1.0 (threshold-based) | ✅ 0.0-1.0 (classification-based) | ❌ |
| **Recency Boost** | ❌ (not documented) | ✅ 0.1-2.0 | ✅ 0.1-2.0 | ✅ 0.1-2.0 |
| **Pass Rate Penalty** | ❌ (not documented) | ✅ 0.1-1.0 | ✅ 0.1-1.0 | ✅ 0.1-1.0 |
| **Vote Count Boost** | ❌ | ❌ | ❌ | ✅ 0.5-1.5 |

### Formula Comparison

#### Pol.is
```
priority = variance(group_votes)
```

#### Lovable
```
weight = predictiveness × consensus_potential × recency × pass_penalty
where:
  predictiveness = variance in group support
  consensus_potential = ratio of groups meeting threshold
  recency = 2.0 (if <24h) else 2.0 × 0.5^(days/7)
  pass_penalty = max(1.0 - pass_rate × 0.9, 0.1)
```

#### Pulse (Clustering Mode)
```
weight = predictiveness × consensus_potential × recency × pass_penalty
where:
  predictiveness = min(variance / 0.25, 1.0)
  consensus_potential = {
    1.0 if consensus statement
    0.7 if bridge statement
    ratio of strong opinion groups otherwise
  }
  recency = 2.0 (if <24h) else 2.0 × 0.5^(days/7)
  pass_penalty = max(1.0 - pass_rate × 0.9, 0.1)
```

#### Pulse (Cold Start Mode)
```
weight = vote_count_boost × recency × pass_penalty
where:
  vote_count_boost = clamp(2.0 - vote_count/avg_votes, 0.5, 1.5)
  recency = same as clustering
  pass_penalty = same as clustering
```

---

## Deep Dive: Consensus vs Divisive Prioritization

### How Each System Balances This Trade-off

#### Pol.is: **Strong Divisive Bias**
- **Divisive statements:** ⭐⭐⭐⭐⭐ (highest priority)
- **Consensus statements:** ⭐ (lowest priority)

**Rationale:** *"Consensus statements are lower in information for forming groups"*

**Effect:**
- ✅ Excellent for differentiating opinion groups
- ✅ Maximizes clustering quality
- ⚠️ May miss valuable consensus points
- ⚠️ Users may feel they're only seeing controversial content

#### Lovable: **Moderate Divisive Bias with Consensus Balance**
- **Divisive statements:** ⭐⭐⭐⭐ (high priority via predictiveness)
- **Consensus statements:** ⭐⭐⭐ (moderate priority via consensus potential)

**Mechanism:**
- **Predictiveness factor** boosts divisive statements (high variance)
- **Consensus potential factor** boosts statements with broad support
- Multiplicative formula means **both** factors matter

**Effect:**
- ✅ Balances information gain with bridge-building
- ✅ Consensus statements still get shown
- ⚠️ Multiplicative formula can over-penalize
- ⚠️ Tuning complexity (4 factors to balance)

#### Pulse: **Context-Dependent Strategy**

**Cold Start (<20 users): Equal Opportunity**
- **Divisive statements:** ⭐⭐⭐ (moderate - via pass rate)
- **Consensus statements:** ⭐⭐⭐ (moderate - via pass rate)
- **Primary driver:** Vote count balancing (ensure all statements get votes)

**Clustering (20+ users): Moderate Divisive Bias**
- **Divisive statements:** ⭐⭐⭐⭐ (high priority via predictiveness)
- **Consensus statements:** ⭐⭐⭐⭐⭐ (highest priority if classified as consensus)
- **Bridge statements:** ⭐⭐⭐ (moderate via 0.7 score)

**Key Difference from Others:**
- **Consensus statements get 1.0 weight** (highest possible) if classified
- **Bridge statements explicitly supported** (0.7 weight)
- **Classification-based** rather than threshold-based

**Effect:**
- ✅ Adapts strategy to poll maturity
- ✅ Explicitly values identified consensus statements
- ✅ Cold start ensures balanced data collection
- ⚠️ Relies on accurate classification
- ⚠️ More complex mode-switching logic

### Visual Comparison

```
DIVISIVE STATEMENTS (High Variance)
┌─────────────────────────────────────────────────┐
│ Pol.is:    ████████████████████████████ (100%)  │
│ Lovable:   ████████████████████ (80%)           │
│ Pulse:     ████████████████████ (80%)           │
└─────────────────────────────────────────────────┘

CONSENSUS STATEMENTS (Low Variance)
┌─────────────────────────────────────────────────┐
│ Pol.is:    ██ (10%)                              │
│ Lovable:   ████████████ (50%)                    │
│ Pulse:     ████████████████████████████ (100%)*  │
│            *If classified as consensus           │
└─────────────────────────────────────────────────┘

NEW STATEMENTS (<24 hours)
┌─────────────────────────────────────────────────┐
│ Pol.is:    ████████ (Base variance only)         │
│ Lovable:   ████████████████ (2x boost)           │
│ Pulse:     ████████████████ (2x boost)           │
└─────────────────────────────────────────────────┘
```

---

## Key Differences Analysis

### 1. Information Gain Philosophy

**Pol.is:**
- Pure information maximization
- "Which statement teaches us the most about opinion groups?"
- Academic/research focus

**Lovable:**
- Balanced optimization
- "Which statement is both informative AND consensus-building?"
- Democratic participation focus

**Pulse:**
- Adaptive optimization
- "What strategy makes sense given poll maturity?"
- Practical/production focus

### 2. Consensus Handling

**Pol.is:**
- Consensus statements deprioritized
- **Discovered post-hoc** through clustering results
- Not shown during voting phase

**Lovable:**
- Consensus statements moderately prioritized
- **Consensus potential** calculated during routing
- Shown if groups meet threshold

**Pulse:**
- Consensus statements **highly prioritized** if classified
- **Explicit classification system** (consensus/bridge/divisive/normal)
- Bridge statements get special treatment (0.7 weight)

### 3. Cold Start Strategy

**Pol.is:**
- Same variance-based approach from start
- May result in unbalanced data collection
- Rich-get-richer dynamics possible

**Lovable:**
- Same 4-factor approach from start
- Recency boost helps new statements
- No explicit vote balancing

**Pulse:**
- **Dedicated cold start mode** with vote count balancing
- Ensures all statements get minimum exposure
- Switches to clustering mode at 20 users

### 4. Determinism & Consistency

**Pol.is:**
- Different users see different orderings
- Same user may see different orderings on refresh
- Maximizes data diversity

**Lovable:**
- Weighted random (likely non-deterministic)
- Prevents gaming but may confuse users
- Not documented

**Pulse:**
- **Deterministic seeded randomness**
- Same user = same order (consistency)
- Different users = different orders (diversity)

### 5. Performance & Caching

**Pol.is:**
- EMPCA (incremental PCA) for efficiency
- Real-time updates as votes come in
- Caching strategy not documented

**Lovable:**
- Caching strategy not documented
- Likely recalculates on each request
- Performance characteristics unknown

**Pulse:**
- **Event-driven cache invalidation**
- Weights cached in database
- <10ms response time for cached weights
- >90% cache hit rate after warmup

---

## Pros and Cons Summary

### Pol.is

**Pros:**
- ✅ Theoretically optimal for clustering
- ✅ Proven track record (governments, vTaiwan)
- ✅ Strong academic foundation
- ✅ Incremental PCA enables real-time adaptation
- ✅ Simplicity (1 primary factor)

**Cons:**
- ❌ Under-exposes consensus statements
- ❌ No documented recency boost
- ❌ May create rich-get-richer dynamics
- ❌ Implementation details not fully public
- ❌ No special cold start handling

### Lovable

**Pros:**
- ✅ Balanced approach (divisive + consensus)
- ✅ Recency boost ensures new statement visibility
- ✅ Pass rate penalty filters confusing statements
- ✅ Weighted random prevents determinism
- ✅ Consensus potential is innovative

**Cons:**
- ❌ Multiplicative formula harsh on low scores
- ❌ No cold start specialization
- ❌ 4 factors = complexity
- ❌ Consensus potential calculation may miss actual consensus
- ❌ No caching strategy

### Pulse

**Pros:**
- ✅ Adaptive (2 modes for different contexts)
- ✅ Fair cold start with vote balancing
- ✅ Event-driven caching (high performance)
- ✅ Deterministic ordering (user consistency)
- ✅ Explicit consensus/bridge support
- ✅ Graceful fallback to random mode

**Cons:**
- ❌ More complex (2 modes vs 1)
- ❌ Requires classification accuracy
- ❌ Mode-switching threshold (20 users) is arbitrary
- ❌ Cache invalidation adds complexity
- ❌ More code to maintain

---

## Recommendations

### When to Use Each Approach

#### Use Pol.is-style if:
- Primary goal is **clustering quality**
- Academic/research context
- Large polls with 100+ statements
- You want simplicity (1 factor)
- Consensus detection happens post-hoc

#### Use Lovable-style if:
- Want **balanced** divisive + consensus
- Single-mode simplicity preferred
- Moderate-sized polls (20-100 statements)
- Democratic participation is priority
- Don't need performance optimization

#### Use Pulse-style if:
- Need **adaptive** strategy for poll lifecycle
- Performance is critical (high traffic)
- Want deterministic user experience
- Explicit consensus/bridge detection needed
- Have infrastructure for caching

### For Pulse: Recommendations

#### Keep:
✅ **Dual mode system** (cold start + clustering)
✅ **Event-driven caching** (excellent performance)
✅ **Deterministic seeding** (user consistency)
✅ **Vote count boost** in cold start (fair data collection)
✅ **Classification-based consensus potential** (more accurate)

#### Consider Changing:

**1. Make consensus potential more like Pol.is variance calculation?**
- **Current:** Classification-based (1.0 for consensus, 0.7 for bridge, ratio for others)
- **Alternative:** Threshold-based like Lovable (ratio of groups meeting threshold)
- **Recommendation:** **Keep current approach** - classification is more accurate

**2. Add Pol.is-style pure variance mode?**
- **Option:** Add third mode for "research/quality-focused" polls
- **Formula:** `weight = variance × recency × pass_penalty`
- **Use case:** Polls where clustering quality trumps all else
- **Recommendation:** **Consider as optional flag** (not default)

**3. Tune the multiplicative formula?**
- **Issue:** One low factor (e.g., pass_penalty = 0.1) kills weight
- **Alternative:** Use weighted sum instead of product?
  - `weight = 0.4×predictiveness + 0.3×consensus + 0.2×recency + 0.1×(1-pass_penalty)`
- **Recommendation:** **Keep multiplicative for now** - it's working well, but monitor for edge cases

**4. Adjust recency decay parameters?**
- **Current:** 24h boost, 7-day half-life
- **Question:** Should decay be faster/slower?
- **Recommendation:** **Keep current** - 7 days is reasonable, can tune per-poll later

**5. Lower clustering mode threshold from 20 to 15 users?**
- **Current:** 20 users minimum for clustering mode
- **Question:** Could we get quality clustering with 15 users?
- **Recommendation:** **Keep 20** - conservative threshold ensures quality

---

## Conclusion

### Key Insights

1. **All three prioritize divisive statements** - This is fundamental to opinion clustering
2. **Pol.is is purest** - Variance-only, maximum information gain
3. **Lovable balances best** - Divisive + consensus + recency + clarity
4. **Pulse adapts best** - Different strategies for different contexts

### How Pulse Differs

**Unique Strengths:**
- Only system with **dual operating modes** (cold start vs clustering)
- Only system with **event-driven caching** (performance)
- Only system with **deterministic seeding** (user consistency)
- Only system with **explicit classification-based consensus** (accuracy)

**Alignment with Pol.is:**
- ✅ Uses variance (predictiveness) as primary factor
- ✅ Prioritizes divisive statements for clustering
- ❌ Also prioritizes consensus statements (unlike Pol.is)
- ❌ Has recency boost (not documented in Pol.is)

**Alignment with Lovable:**
- ✅ 4-factor multiplicative formula (clustering mode)
- ✅ Recency boost (identical: 2.0x, 7-day decay)
- ✅ Pass rate penalty (identical formula)
- ❌ Different consensus potential calculation
- ❌ Has cold start mode (Lovable doesn't)

### Final Assessment

**Pulse implementation is a well-designed hybrid** that:
- Borrows **information maximization** from Pol.is
- Borrows **balanced factors** from Lovable
- Adds **adaptive intelligence** (dual modes)
- Adds **production-grade optimizations** (caching, determinism)

**Recommendation: Keep current Pulse approach** with minor monitoring:
- Track clustering quality metrics vs pure Pol.is approach
- Monitor if consensus statements are getting adequate exposure
- Watch for edge cases where multiplicative formula is too harsh
- Consider A/B testing cold start threshold (15 vs 20 users)

---

## Appendix: Research Sources

### Pol.is Sources
- GitHub Repository: https://github.com/compdemocracy/polis
- Academic Paper: "Polis: Scaling Deliberation by Mapping High Dimensional Opinion Spaces" (Small et al., 2021)
- GitHub Issue #1289: Restricting clustering to 2-5 groups impacts comment routing
- GitHub Issue #217: Allow participants to prioritize statements
- CompDemocracy.org FAQ and knowledge base

### Lovable Sources
- Implementation details provided by user (see requirements)

### Pulse Sources
- `C:\Users\Guy\Downloads\Projects\pulse\.claude\docs\STATEMENT_ORDERING.md`
- `C:\Users\Guy\Downloads\Projects\pulse\lib\services\statement-weighting-service.ts`
- `C:\Users\Guy\Downloads\Projects\pulse\lib\utils\statement-weights.ts`
- `C:\Users\Guy\Downloads\Projects\pulse\lib\services\clustering-service.ts`

### Key Quotes from Research

**Pol.is - Prioritization Philosophy:**
> "The prioritization is based on divisiveness — consensus statements are lower in information for forming groups, so comments that are instructive to the formation of groups (higher statistical variance) are prioritized."

**Pol.is - Technical Approach:**
> "Polis uses expectation-maximization PCA (EMPCA), which is the incremental PCA algorithm that Polis uses to update its sparse matrix in a computationally efficient way as new votes come in."

**Pol.is - Clustering:**
> "Polis currently sets k for k-means to 2-5 groups and chooses the best k using silhouette coefficient to determine opinion groups."

**Audrey Tang (Taiwan's Digital Minister) on Pol.is:**
> "Polis is quite well known in that it's a kind of social media that instead of polarizing people to drive so called engagement or addiction or attention, it automatically drives bridge making narratives and statements. So only the ideas that speak to both sides or to multiple sides will gain prominence in Polis."

---

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Author:** Claude Code (Computational Social Scientist Agent)
