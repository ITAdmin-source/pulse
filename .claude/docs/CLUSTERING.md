# Opinion Clustering System

Comprehensive documentation for Pulse's opinion clustering and visualization system.

## Overview

Pulse implements a **Pol.is-inspired opinion clustering system** that analyzes voting patterns to identify natural groupings of users with similar viewpoints. The system uses dimensionality reduction (PCA) and clustering algorithms (K-means) to transform high-dimensional voting data into intuitive 2D visualizations.

### Key Features

- **Strategic clustering triggers** on batch completion and vote milestones (non-blocking background process)
- **Privacy-preserving visualization** showing group boundaries, not individual positions
- **Multi-tier caching** for sub-100ms response times
- **Consensus detection** identifying statements with broad agreement or division
- **Coalition analysis** revealing which opinion groups naturally align
- **Quality metrics** (silhouette score, variance explained) for result validation

### Use Cases

1. **Poll creators** understand how voters cluster into opinion groups (requires 20+ voters)
2. **Participants** see where they fit in the opinion landscape
3. **Researchers** analyze consensus and divisive statements
4. **Community managers** identify bridge statements connecting different viewpoints

---

## Architecture

### Algorithm Pipeline

The clustering system follows an 8-step pipeline:

```
1. Build Opinion Matrix      → [users × statements] with values {-1, 0, 1, null}
2. PCA Dimensionality Reduction → Reduce to 2D coordinates [PC1, PC2]
3. K-Means Fine Clustering   → Group users into K=20/50/100 clusters
4. Hierarchical Grouping     → Merge into 2-5 coarse opinion groups
5. Consensus Detection       → Classify statements as consensus/divisive/bridge
6. Coalition Analysis        → Identify which groups naturally align
7. Quality Validation        → Calculate silhouette score and variance explained
8. Database Persistence      → Store results with metadata for fast retrieval
```

### Eligibility Criteria

Clustering computation requires:
- **Minimum 20 users** who have voted (K-means mathematical requirement)
- **Minimum 6 approved statements**

**Rationale for 20-user minimum:**
- K-means clustering uses K=20 as the minimum number of fine clusters
- With fewer than 20 users, cluster assignments become unreliable (less than 1 user per cluster on average)
- Silhouette score (quality metric) becomes meaningless with sparse clusters
- 20+ users ensures at least 1-2 users per fine cluster for meaningful groupings

**Note:** Polls with 10-19 voters can still view basic results (vote percentages, statement rankings), but opinion clustering visualization requires 20+ participants for statistical validity.

### Background Triggering

Clustering is automatically triggered at strategic points during voting via `VotingService`:

**Trigger conditions:**
- **Batch completion**: After user completes each 10-statement batch
- **Milestone votes**: At 10, 20, 50, 100, 200, 500 total votes per user

```typescript
// lib/services/voting-service.ts:21-72
private static async shouldTriggerClustering(
  userId: string,
  pollId: string,
  currentVoteCount: number
): Promise<{ shouldTrigger: boolean; reason: string }> {
  // Milestone vote counts that always trigger clustering
  const milestones = [10, 20, 50, 100, 200, 500];

  if (milestones.includes(currentVoteCount)) {
    return {
      shouldTrigger: true,
      reason: `Milestone reached: ${currentVoteCount} votes`,
    };
  }

  // Check if batch was just completed
  const currentBatchNumber = Math.floor((currentVoteCount - 1) / 10) + 1;
  const startOfBatch = (currentBatchNumber - 1) * 10;
  const expectedBatchSize = Math.min(10, totalStatements - startOfBatch);

  const positionInBatch = ((currentVoteCount - 1) % 10) + 1;

  if (positionInBatch === expectedBatchSize) {
    return {
      shouldTrigger: true,
      reason: `Batch ${currentBatchNumber} completed (${expectedBatchSize} statements)`,
    };
  }

  return { shouldTrigger: false, reason: 'Mid-batch' };
}
```

**Batch size calculation:**
- Standard batches: 10 statements
- Final batch: Remaining statements (may be < 10)
- Example: Poll with 23 statements → Batch 1: 10, Batch 2: 10, Batch 3: 3
- Clustering triggers after completing Batch 3 (3 statements)

**Note**: Batch composition depends on poll's `statementOrderMode` setting:
- `sequential`: Chronological order (createdAt)
- `random`: Deterministic shuffle using poll-specific seed
- `weighted`: Adaptive routing based on predictiveness, consensus, recency, and pass rates (see STATEMENT_ORDERING.md)

The trigger is **non-blocking** and won't delay vote confirmation:

```typescript
// lib/services/voting-service.ts:226-234
ClusteringService.triggerBackgroundClustering(pollId).catch((error) => {
  // Log error but don't fail the vote
  console.error(`Background clustering failed for poll ${pollId}:`, error);
});
```

---

## Database Schema

### Tables

Three new tables store clustering data:

#### 1. `poll_clustering_metadata`

Stores PCA components, cluster centroids, and quality metrics for each poll.

**Key fields:**
- `pca_components` (JSONB) - Principal component vectors [2 × statements]
- `variance_explained` (JSONB) - Variance explained by PC1 and PC2
- `mean_vector` (JSONB) - Mean vector for data centering
- `cluster_centroids` (JSONB) - K-means centroids in 2D space [K × 2]
- `num_fine_clusters` (SMALLINT) - K value (20/50/100)
- `coarse_groups` (JSONB) - Hierarchical grouping metadata
- `silhouette_score` (REAL) - Clustering quality metric (-1 to 1)
- `total_variance_explained` (REAL) - Sum of PC1 + PC2 variance

**Schema:**
```sql
CREATE TABLE poll_clustering_metadata (
  poll_id UUID PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
  pca_components JSONB NOT NULL,
  variance_explained JSONB NOT NULL,
  mean_vector JSONB NOT NULL,
  cluster_centroids JSONB NOT NULL,
  num_fine_clusters SMALLINT NOT NULL,
  coarse_groups JSONB NOT NULL,
  silhouette_score REAL NOT NULL,
  total_variance_explained REAL NOT NULL,
  total_users SMALLINT NOT NULL,
  total_statements SMALLINT NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  version SMALLINT NOT NULL DEFAULT 1
);
```

#### 2. `user_clustering_positions`

Stores each user's position in the 2D opinion space.

**Key fields:**
- `pc1` (REAL) - First principal component coordinate
- `pc2` (REAL) - Second principal component coordinate
- `fine_cluster_id` (SMALLINT) - Fine-grained cluster assignment (0 to K-1)
- `coarse_group_id` (SMALLINT) - Coarse opinion group (0 to 4)
- `total_votes`, `agree_count`, `disagree_count`, `pass_count` - Vote statistics

**Schema:**
```sql
CREATE TABLE user_clustering_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pc1 REAL NOT NULL,
  pc2 REAL NOT NULL,
  fine_cluster_id SMALLINT NOT NULL,
  coarse_group_id SMALLINT NOT NULL,
  total_votes SMALLINT NOT NULL,
  agree_count SMALLINT NOT NULL,
  disagree_count SMALLINT NOT NULL,
  pass_count SMALLINT NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### 3. `statement_classifications`

Stores consensus/divisive/bridge classification for each statement.

**Key fields:**
- `classification_type` (TEXT) - Type: `positive_consensus`, `negative_consensus`, `divisive`, `bridge`, `normal`
- `group_agreements` (JSONB) - Agreement percentage by group {groupId → score}
- `average_agreement` (REAL) - Mean agreement across all groups
- `standard_deviation` (REAL) - Standard deviation of agreement (NOT variance!)
- `bridge_score` (REAL) - Bridge strength (only for bridge statements)
- `connects_groups` (JSONB) - Group IDs connected by bridge

**Schema:**
```sql
CREATE TABLE statement_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  statement_id UUID NOT NULL,
  classification_type TEXT NOT NULL,
  group_agreements JSONB NOT NULL,
  average_agreement REAL NOT NULL,
  standard_deviation REAL NOT NULL,
  bridge_score REAL,
  connects_groups JSONB,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### RLS Policies

All clustering tables have Row-Level Security enabled:
- **Read access:** Anyone can view clustering data for published polls
- **Write access:** Only system (via service) can insert/update clustering data

---

## Computation Engines

### 1. PCAEngine (`lib/clustering/pca-engine.ts`)

**Purpose:** Reduce N-dimensional voting patterns to 2D coordinates for visualization.

**Algorithm:**
1. **Mean imputation:** Replace null values (pass votes) with column means
2. **Centering:** Subtract mean from each feature
3. **PCA computation:** Extract first 2 principal components
4. **Projection:** Transform user vectors to 2D space

**Key methods:**
```typescript
PCAEngine.computePCA(opinionMatrix: OpinionMatrix): PCAResult
PCAEngine.projectUser(userVotes, components, meanVector, statementMeans): [pc1, pc2]
```

**Quality metric:**
- `totalVarianceExplained` should be >40% for meaningful clustering
- Low variance (<30%) **logs a warning** but computation proceeds
- **No rejection based on variance** - results are always persisted with quality tier marked as "low"

**Mathematical note:**
- Uses `ml-pca` library with covariance method
- Centers data but doesn't scale (preserves agreement magnitude)
- Returns eigenvectors for projection of new users

**Incremental projection method:**
```typescript
PCAEngine.projectUser(userVotes, components, meanVector, statementMeans): [pc1, pc2]
```

Projects a new user's votes onto existing PCA space without recomputation:
1. Impute missing values using statement means
2. Center data using existing mean vector
3. Project onto existing principal components
4. Return [PC1, PC2] coordinates

**Use case**: Real-time updates when new users vote (future optimization)
**Status**: Implemented but not yet used in production pipeline

---

### 2. KMeansEngine (`lib/clustering/kmeans-engine.ts`)

**Purpose:** Group users into fine-grained clusters based on 2D PCA coordinates.

**Adaptive K selection:**
```typescript
10-19 users  → ERROR (insufficient for K-means clustering)
20-49 users  → K=20  (ensures 1-2.5 users per cluster)
50-99 users  → K=50  (ensures 1-2 users per cluster)
100+ users   → K=100 (Pol.is approach, ensures 1+ users per cluster)
```

**Key methods:**
```typescript
KMeansEngine.cluster(coordinates: number[][]): KMeansResult
KMeansEngine.createCoarseGroups(centroids: number[][]): CoarseGrouping
KMeansEngine.assignToNearestCluster(userCoords, centroids): clusterId
```

**Quality metric:**
- `silhouetteScore` measures clustering quality (-1 to 1)
  - > 0.7: Strong structure
  - 0.5-0.7: Reasonable
  - 0.25-0.5: Weak
  - < 0.25: No substantial structure

**Hierarchical grouping:**
After fine clustering (K=20/50/100), creates 2-5 coarse groups:
1. Apply K-means on cluster centroids
2. Test K=2 through K=min(5, numFineClusters)
3. Select K with best silhouette score
4. Map fine clusters → coarse groups

**Note**: Polls with few fine clusters may have fewer coarse groups (e.g., 2-3 groups instead of 5).

**Incremental assignment method:**
```typescript
KMeansEngine.assignToNearestCluster(userCoords, centroids): clusterId
```

Assigns a new user to the nearest existing cluster without retraining:
- Calculates Euclidean distance to all centroids
- Returns cluster ID of nearest centroid

**Use case**: Real-time updates when new users vote (future optimization)
**Status**: Implemented but not yet used in production pipeline

---

### 3. ConsensusDetector (`lib/clustering/consensus-detector.ts`)

**Purpose:** Classify statements based on opinion group agreement patterns.

**Classification types:**

1. **Positive Consensus** - All groups strongly agree (>80%)
   - Low std dev (<0.2) + high average (>0.8)

2. **Negative Consensus** - All groups strongly disagree (<20%)
   - Low std dev (<0.2) + low average (<0.2)

3. **Divisive** - Groups have very different opinions
   - High std dev (>0.4)

4. **Bridge** - Connects disagreeing groups
   - Moderate agreement (40-70%)
   - Moderate std dev (0.2-0.4)
   - At least 2 groups agreeing

5. **Normal** - No special pattern

**Key methods:**
```typescript
ConsensusDetector.classifyStatement(statementId, groupAgreements): Classification
ConsensusDetector.classifyAllStatements(votes, userGroupAssignments, statementIds): Classification[]
```

**Critical fix:**
Uses **standard deviation** (not variance!) for thresholds. Original Pol.is spec had mathematically incorrect variance-based thresholds.

---

### 4. StatementClassifier (`lib/clustering/statement-classifier.ts`)

**Purpose:** Enhanced classification logic for statement agreement patterns.

**Extended classification types:**

1. **Full Consensus** - All groups agree or all disagree
2. **Partial Consensus** - N-1 groups agree/disagree
3. **Split Decision** - Equal groups on both sides
4. **Divisive** - Fragmented opinions
5. **Bridge** - Moderate agreement connecting groups

**Agreement threshold:** ±60% (groups between -60% and +60% considered neutral)

**Key methods:**
```typescript
StatementClassifier.classifyStatement(groupAgreements): EnhancedClassification
StatementClassifier.getTypeLabel(type): string
```

**Coalition pattern detection:**
Identifies which groups form natural coalitions:
- Agreeing groups (>60% positive)
- Disagreeing groups (<-60% negative)
- Neutral groups (-60% to +60%)

---

### 5. CoalitionAnalyzer (`lib/clustering/coalition-analyzer.ts`)

**Purpose:** Analyze which opinion groups form natural coalitions.

**Pairwise alignment calculation:**
For each pair of groups (i, j):
1. Count statements where both agree (>60% or <-60% same direction)
2. Count statements where they oppose (opposite directions)
3. Count neutral statements (at least one group neutral)
4. Calculate alignment percentage

**Key methods:**
```typescript
CoalitionAnalyzer.analyzeCoalitions(statements, numGroups, groupLabels): CoalitionAnalysis
CoalitionAnalyzer.getStrongestCoalition(analysis): PairwiseAlignment
CoalitionAnalyzer.isStrongCoalition(groupId1, groupId2, analysis): boolean
CoalitionAnalyzer.calculatePolarizationLevel(analysis): number
```

**Use cases:**
- Identify which groups naturally align
- Find strongest coalitions (top 3 pairs)
- Calculate overall polarization score
- Detect bridge opportunities between opposing groups

---

## Caching Strategy

### Multi-Tier Architecture

**Layer 1: Client-side (Optimistic UI)**
- Not implemented in current version
- Future: React Query / SWR for instant UI updates

**Layer 2: In-Memory Cache (Node.js)**
- Singleton `ClusteringCacheManager` with LRU eviction
- **Response time:** <10ms
- **TTL:** 5 minutes
- **Max size:** 100 polls
- Background cleanup every 60 seconds

**Layer 3: Database (PostgreSQL JSONB)**
- Persistent storage in `poll_clustering_metadata`
- **Response time:** 50-100ms
- **TTL:** Until new votes trigger recomputation

### Cache Configuration

```typescript
ClusteringCacheManager.getInstance().configure({
  maxSize: 100,     // Max polls in cache (default: 100)
  cacheTTL: 300000  // TTL in ms (default: 5 minutes)
});
```

**Defaults:**
- Max size: 100 polls
- TTL: 5 minutes (300,000ms)
- Cleanup interval: 60 seconds

### Cache Invalidation

Caches are invalidated when:
1. New clustering computation completes
2. Manual trigger via admin/manager
3. TTL expires (Layer 2 only)

```typescript
// Invalidate all caches for a poll
invalidateAllCaches(pollId);
revalidatePath(`/polls/${pollId}/opinionmap`);
```

**Note:** Clustering recomputation also triggers statement weight cache invalidation (for weighted ordering mode). See `lib/services/clustering-service.ts:373-385` and STATEMENT_ORDERING.md for details.

### Usage

```typescript
// Automatic caching via helper
const data = await getCachedClusteringData(pollId, async () => {
  return await ClusteringService.getClusteringData(pollId);
});
```

---

## Visualization

### Opinion Map (`/polls/[slug]/opinionmap`)

**Privacy-preserving design:**
- Shows **group boundaries** (semi-transparent regions)
- Shows **group centroids** (markers)
- Shows **current user's position** ONLY (with pulsing animation)
- Does NOT show individual positions of other users

**Desktop visualization:**
- SVG-based canvas (800×600 viewBox)
- Grid background with axes
- Color-coded group regions (smoothed convex hulls)
- Interactive hover states
- RTL-compatible layout

**Mobile visualization:**
- Simplified card-based view
- Group statistics cards
- Swipeable interface
- Touch-optimized interactions

**Components:**
- `OpinionMapCanvas` - Desktop SVG visualization
- `MobileClusteringView` - Mobile card-based view
- `OpinionMapLegend` - Legend with color key
- `ClusteringLoadingSkeleton` - Loading state
- `ClusteringErrorState` - Error handling
- `ClusteringNotEligible` - Eligibility message

### Statement Agreement Heatmap

**Purpose:** Show how each opinion group votes on each statement.

**Visualization:**
- Rows: Statements (sorted by classification type)
- Columns: Opinion groups
- Cell colors: Red (disagree) → Gray (neutral) → Green (agree)
- Classification badges: Consensus, Divisive, Bridge, etc.

**Components:**
- `StatementAgreementHeatmap` - Main heatmap grid
- `StatementAgreementView` - Container with filters
- `StatementStatsCards` - Summary statistics

### Convex Hull Visualization

**Purpose:** Generate smooth, privacy-preserving boundaries around opinion groups in the 2D opinion map.

**Algorithm:** Graham Scan with Catmull-Rom spline smoothing (`lib/clustering/convex-hull.ts`)

#### Implementation Details

**Convex Hull Computation (Graham Scan):**
1. Find anchor point (lowest Y, leftmost if tie)
2. Sort remaining points by polar angle from anchor
3. Build hull by removing clockwise turns
4. Time complexity: O(n log n)
5. Space complexity: O(n)

**Smoothing (D3-shape):**
- Uses Catmull-Rom closed splines for smooth curves
- Preserves convex hull boundary while adding visual polish
- Integrates with `d3-shape` library's `line()` and `curveCatmullRomClosed`
- Produces SVG path strings for rendering

**Edge Cases:**
- **1-2 users:** Falls back to simple circle (radius based on group size)
- **Collinear points:** Returns empty array, falls back to circle
- **Identical points:** Handled gracefully with circle fallback

**Privacy Preservation:**
- Only group boundaries shown (not individual user positions)
- Convex hull naturally generalizes individual positions
- Current user's position shown separately with pulsing marker

**Performance:**
- <15ms rendering time per group
- Efficient for typical groups (2-50 users per group)
- Pre-computed during clustering, cached in component state

**Theming:**
- Uses CSS variables for consistent color scheme
- Semi-transparent fills (opacity: 0.15)
- Colored strokes matching group colors
- Supports theme switching without code changes

**File Location:** `lib/clustering/convex-hull.ts`

**Key Functions:**
```typescript
computeConvexHull(points: Point2D[]): Point2D[]
createSmoothPath(hullPoints: Point2D[]): string
```

**Example Usage:**
```typescript
// In OpinionMapCanvas component
const hullPoints = computeConvexHull(userPositionsInGroup);
if (hullPoints.length >= 3) {
  const smoothPath = createSmoothPath(hullPoints);
  return <path d={smoothPath} fill={groupColor} opacity={0.15} />;
} else {
  // Fallback to circle for small groups
  return <circle cx={centroid.x} cy={centroid.y} r={radius} />;
}
```

---

## Service Layer

### ClusteringService (`lib/services/clustering-service.ts`)

**Main orchestration service for all clustering operations.**

#### Core Methods

**`computeOpinionLandscape(pollId): ClusteringResult`**
- Complete 8-step clustering pipeline
- Validates eligibility (10 users, 6 statements)
- Returns metadata, user positions, and statement classifications
- **Duration:** 200-500ms for typical poll (50 users, 20 statements)

**`getClusteringData(pollId): ClusteringResult | null`**
- Fetch existing clustering data from database
- Returns null if not yet computed
- **Duration:** 50-100ms (database query)

**`isEligibleForClustering(pollId): EligibilityStatus`**
- Fast eligibility check
- Returns user count, statement count, and eligibility reason
- **Duration:** <50ms (two simple counts)

**`triggerBackgroundClustering(pollId): void`**
- Non-blocking async computation trigger
- Checks eligibility first
- Fires and forgets (errors logged, not thrown)
- Called automatically on batch completion and vote milestones

**`getGroupAgreementMatrix(pollId): StatementGroupAgreement[] | null`**
- Fetch detailed statement-group agreement data
- Used for heatmap visualization
- Includes classification and coalition data

#### Quality Tiers

Based on variance explained and silhouette score:

```typescript
High:   variance ≥ 60% AND silhouette ≥ 0.4
Medium: variance ≥ 40% AND silhouette ≥ 0.25
Low:    otherwise
```

#### Consensus Levels

Based on consensus statement ratio:

```typescript
High:   ≥ 50% consensus statements
Medium: 30-50% consensus statements
Low:    < 30% consensus statements
```

---

## Server Actions

### Clustering Actions (`actions/clustering-actions.ts`)

**`getClusteringDataAction(pollId)`**
- Get clustering data with multi-tier caching
- Returns: `{success, data}`

**`computeClusteringAction(pollId)`**
- Manual clustering computation (admin/manager only)
- Validates eligibility first
- Invalidates caches after completion
- Returns: `{success, data: metadata}`

**`checkClusteringEligibilityAction(pollId)`**
- Fast eligibility check for UI
- Returns: `{success, data: {eligible, reason, userCount, statementCount}}`

**`getUserPositionAction(pollId, userId)`**
- Get specific user's position in opinion map
- Returns: `{success, data: position}`

**`triggerBackgroundClusteringAction(pollId)`**
- Non-blocking trigger (fires and forgets)
- Always returns success (errors logged only)

**`manualTriggerClusteringAction(pollId)`**
- Force immediate clustering computation (admin/manager only)
- **Blocks until completion** (unlike background trigger)
- Returns detailed metrics including duration
- Bypasses debouncing and idempotency checks
- Invalidates caches after completion
- Returns: `{success, data: {metadata, duration, triggeredAt}}`

**`getCompleteClusteringDataAction(pollId, options)`**
- Fetch complete clustering data for opinion map page
- Options:
  - `includeGroupAgreements` - Include statement agreement matrix
  - `includeCoalitionAnalysis` - Include coalition analysis
- Returns: `{success, data: {metadata, userPositions, classifications, groups, ...}}`

---

## Database Queries

### Clustering Queries (`db/queries/clustering-queries.ts`)

**`getCompleteClusteringData(pollId)`**
- Fetch metadata, positions, and classifications in one call
- Returns complete clustering result

**`getUserClusteringPosition(pollId, userId)`**
- Get specific user's 2D position and group assignment
- Returns: `{pc1, pc2, fineClusterId, coarseGroupId, voteStats}`

**`getStatementClassifications(pollId)`**
- Get all statement classifications for a poll
- Returns array of classifications with types and scores

---

## Quality Metrics

### Silhouette Score

**Range:** -1 to +1 (higher is better)

**Interpretation:**
- **> 0.7:** Strong clustering structure (excellent separation)
- **0.5-0.7:** Reasonable clustering (good separation)
- **0.25-0.5:** Weak clustering (some structure)
- **< 0.25:** No substantial clustering (poor separation)

**Formula:**
For each point i:
```
s(i) = (b - a) / max(a, b)

where:
  a = mean distance to points in same cluster
  b = mean distance to points in nearest neighboring cluster
```

Average silhouette score = mean of s(i) across all points

### Variance Explained

**Range:** 0% to 100%

**Interpretation:**
- **> 60%:** Excellent dimensionality reduction
- **40-60%:** Good reduction (acceptable for clustering)
- **30-40%:** Fair (borderline, results may be less reliable)
- **< 30%:** Poor (indicates high consensus or limited diversity)

**Formula:**
```
Variance explained = (λ₁ + λ₂) / Σλᵢ

where:
  λ₁, λ₂ = eigenvalues of first 2 principal components
  Σλᵢ = sum of all eigenvalues
```

### Quality Thresholds

**Minimum acceptable:**
- Variance explained: 40%
- Silhouette score: 0.25

**Warning triggers:**
- Variance < 30%: Log warning about high consensus
- Silhouette < 0.25: Log warning about weak clustering

**Computation still proceeds** even if metrics are low, but quality tier is marked accordingly.

---

## Error Handling

### Insufficient Data

**Error:** "Insufficient users for clustering: X. Minimum required: 20."
**Resolution:** Wait for more users to vote
**Note:** 20 users minimum ensures statistically valid K-means clustering with K=20 fine clusters

**Error:** "Insufficient statements for clustering: X. Minimum required: 6."
**Resolution:** Add more approved statements to poll

### Low Quality Results

**Warning:** "Very low PCA variance: X%. This may indicate extremely high consensus."
**Action:** Computation proceeds, quality tier marked as "low"

**Warning:** "Low clustering quality: silhouette score X. Proceeding anyway, but results may be unreliable."
**Action:** Computation proceeds, quality tier marked accordingly

### Background Failures

Background clustering failures are **logged but not thrown**:
```typescript
.catch((error) => {
  console.error(`Background clustering failed: ${error}`);
  // Don't throw - this is background processing
});
```

This ensures votes are never blocked by clustering failures.

---

## Performance Considerations

### Computation Complexity

**Time complexity:**
- Opinion matrix building: O(users × statements)
- PCA: O(statements³) for covariance matrix
- K-means: O(iterations × K × users) ≈ O(100 × 100 × users) = O(10,000 × users)
- Total: ~O(users × statements + statements³ + 10,000 × users)

**Typical performance:**
- 50 users, 20 statements: 200-300ms
- 100 users, 30 statements: 400-600ms
- 500 users, 50 statements: 2-4 seconds

### Optimization Strategies

1. **Background computation:** Never blocks user interactions
2. **Multi-tier caching:** Sub-100ms response for cached results
3. **Strategic triggering:** Only on batch completion and milestones (not every vote)
4. **Incremental updates:** Future optimization (methods implemented but not yet used)

### Database Performance

**Indexed fields:**
- `poll_id` (primary key on all tables)
- `user_id` (for user position lookups)

**Query optimization:**
- Single query to fetch all votes (not N+1)
- Batch inserts for user positions and classifications
- Transaction wrapping for atomic updates

---

## Hebrew Strings

All clustering UI text is managed in `lib/strings/he.ts`:

```typescript
export const opinionMap = {
  pageTitle: 'מפת דעות',
  backToResults: 'חזרה לתוצאות',
  loading: 'בונים את מפת הדעות...',
  notEligibleTitle: 'מפת הדעות עדיין לא זמינה',
  errorTitle: 'שגיאה בטעינת מפת הדעות',
  yourPosition: 'המיקום שלכם',
  groupLabel: (n: number) => `קבוצה ${n}`,
  // ... 60+ more strings
};
```

**Never hardcode Hebrew strings** in components - always import from `lib/strings/he.ts`.

---

## Testing

### Unit Tests

Test coverage for clustering engines:

```bash
npm run test lib/clustering/
```

**Tested components:**
- PCAEngine: Mean imputation, PCA computation, user projection
- KMeansEngine: Adaptive K selection, clustering, silhouette score
- ConsensusDetector: Statement classification, thresholds
- StatementClassifier: Enhanced classification, coalition patterns
- CoalitionAnalyzer: Pairwise alignment, polarization scoring

### Integration Tests

Test full clustering pipeline:

```bash
npm run test:integration -- clustering
```

**Test scenarios:**
- Insufficient data handling
- Quality metric validation
- Database persistence
- Cache invalidation
- Background triggering

---

## Future Enhancements

### Short-term (Q1 2026)

1. **Incremental clustering updates**
   - Avoid full recomputation on each batch
   - Project new users into existing PCA space
   - Reassign to nearest cluster (no retraining)
   - **Status:** Methods implemented (projectUser, assignToNearestCluster), not yet integrated

2. **Advanced visualizations**
   - Interactive filters (by demographic, vote pattern)
   - Animation of opinion shifts over time
   - 3D visualization option (PC1, PC2, PC3)

3. **Statement recommendations**
   - Suggest bridge statements for divided polls
   - Identify missing perspectives
   - Recommend statements to clarify group differences

### Long-term (Q2+ 2026)

1. **Machine learning enhancements**
   - EMPCA (Expectation-Maximization PCA) for better missing data handling
   - DBSCAN for automatic cluster number selection
   - Hierarchical clustering for better coarse grouping

2. **Real-time updates**
   - WebSocket-based live opinion map
   - See new users joining clusters in real-time
   - Animated transitions as groups evolve

3. **Advanced analytics**
   - Predict user opinion group from partial votes
   - Identify influential voters (opinion leaders)
   - Detect vote brigading or manipulation

---

## References

### Academic Papers

- Pol.is: "Scaling Collective Deliberation" (MIT Media Lab)
- "Principal Component Analysis" (Jolliffe, 2002)
- "K-means Clustering" (MacQueen, 1967)
- "Silhouette Coefficient" (Rousseeuw, 1987)

### Libraries

- **ml-pca** - Principal Component Analysis
- **ml-kmeans** - K-means clustering
- **ml-distance** - Distance metrics (Euclidean)
- **ml-matrix** - Matrix operations
- **d3-shape** - SVG path generation and curve smoothing (Catmull-Rom splines for convex hulls)

### External Resources

- [Pol.is Open Source](https://github.com/pol-is/polis)
- [Computational Democracy Project](https://compdemocracy.org)
- [PCA Tutorial](https://www.e-revistes.uji.es/pca-tutorial)

---

## Change Log

### 2025-10-25: Implemented Smoothed Convex Hulls

**Feature:** Replace simple circle approximations with accurate smoothed convex hulls for opinion map visualization.

**Implementation:**
- Added `lib/clustering/convex-hull.ts` with Graham Scan algorithm
- Integrated D3-shape library for Catmull-Rom spline smoothing
- Updated `OpinionMapCanvas` to compute and render smoothed hulls
- Added CSS variables for theme-aware coloring
- Implemented circle fallback for small groups (1-2 users)

**Technical Details:**
- Graham Scan: O(n log n) convex hull computation
- Catmull-Rom closed splines via `d3-shape`
- Privacy-preserving: shows group boundaries, not individual positions
- Performance: <15ms rendering time per group

**Files Changed:**
- `lib/clustering/convex-hull.ts` - New convex hull engine
- `components/clustering/opinion-map-canvas.tsx` - Updated visualization
- `.claude/docs/CLUSTERING.md` - Added documentation

**Impact:**
- More accurate visual representation of opinion group boundaries
- Follows Pol.is approach with polished smooth curves
- Maintains privacy while improving spatial clarity

---

### 2025-10-24: Fixed MIN_USERS Discrepancy

**Issue:** There was a discrepancy between eligibility check (10 users) and K-means requirements (20 users):
- `ClusteringService.MIN_USERS` was set to 10
- `KMeansEngine.determineOptimalK()` threw error if users < 20
- Result: Polls with 10-19 users passed eligibility but failed during clustering computation

**Solution:** Raised `MIN_USERS` from 10 to 20 in `clustering-service.ts:96`

**Rationale:**
- K-means uses minimum K=20 fine clusters
- With 10 users and K=20 clusters → 0.5 users per cluster (unreliable)
- Silhouette score becomes meaningless with sparse data
- 20+ users ensures 1-2 users per fine cluster for valid statistical groupings

**Files Changed:**
- `lib/services/clustering-service.ts:96` - Raised MIN_USERS constant to 20
- `.claude/docs/CLUSTERING.md` - Updated documentation (lines 44-56, 18-23, 692-696)
- `CLAUDE.md` - Updated quick reference (lines 96, 197)

**Impact:**
- Polls now require 20+ voters to show opinion clustering visualization
- Polls with 10-19 voters can still view basic results (percentages, rankings)
- Consistent behavior between eligibility check and clustering execution

---

**Last Updated:** 2025-10-24 (clustering branch - fixed MIN_USERS discrepancy)
