# Opinion Group Clustering & Consensus Detection Specification

## Executive Summary

This document specifies the implementation of opinion group clustering for the Pulse platform, inspired by the Pol.is algorithm. The system will identify groups of users with similar voting patterns and detect consensus statements that transcend opinion groups.

**Primary Goals:**
1. Cluster users into opinion groups based on voting patterns
2. Identify consensus statements (agreed upon across groups)
3. Identify divisive statements (separating groups)
4. Visualize opinion landscape for poll creators and participants
5. Enable cross-group dialogue and bridge-building

---

## 1. Background Research

### 1.1 How Pol.is Works

**Core Algorithm:**
- Uses **Expectation-Maximization PCA (EMPCA)** for incremental sparse matrix updates
- Reduces high-dimensional opinion space to 2D using PCA (2 principal components)
- Applies **K-means clustering with K=100** for fine-grained clusters
- Groups fine-grained clusters into coarse-grained opinion groups (typically 2-5 major groups)
- Identifies consensus and divisive statements based on cross-group agreement

**Data Structure:**
- Opinion matrix: `M[participants × statements]` where values are:
  - `1` = agree
  - `-1` = disagree
  - `0` = pass/neutral
  - `null` = not voted

**Consensus Detection:**
- Consensus statements: High agreement across ALL identified clusters
- Divisive statements: High agreement within clusters but disagreement across clusters
- Bridge statements: Statements that connect different opinion groups

**Visualization:**
- 2D visualization with opinion group regions/clouds (aggregated boundaries)
- User's own position shown as highlighted marker
- No other individual participants visible (privacy-preserving)
- Real-time updates as votes accumulate

---

## 2. Clustering Algorithm Evaluation

### 2.1 Algorithm Comparison

| Algorithm | Pros | Cons | Suitability |
|-----------|------|------|-------------|
| **PCA + K-means** (Pol.is approach) | ✓ Proven in production<br>✓ Efficient for sparse data (EMPCA)<br>✓ Incremental updates<br>✓ Good interpretability | ✗ Requires specifying K<br>✗ Assumes spherical clusters<br>✗ PCA may lose non-linear patterns | **★★★★☆** Very good for MVP |
| **UMAP + K-means** | ✓ Better cluster separation<br>✓ Preserves local & global structure<br>✓ Better visualization | ✗ Computationally expensive<br>✗ Less interpretable<br>✗ Harder to update incrementally | **★★★☆☆** Good for future enhancement |
| **UMAP + HDBSCAN** | ✓ No need to specify K<br>✓ Finds arbitrary shapes<br>✓ Handles noise/outliers<br>✓ Hierarchical structure | ✗ Computationally expensive<br>✗ Complex to implement<br>✗ May create too many micro-clusters | **★★★☆☆** Good for future enhancement |
| **PCA + Hierarchical** | ✓ No need to specify K upfront<br>✓ Creates dendrogram<br>✓ Multiple granularity levels | ✗ O(n²) time complexity<br>✗ Not suitable for incremental updates<br>✗ Slower for large datasets | **★★☆☆☆** Too slow for real-time |
| **Spectral Clustering** | ✓ Finds non-convex clusters<br>✓ Good for graph-like data | ✗ O(n³) time complexity<br>✗ Requires K specification<br>✗ Not incremental | **★☆☆☆☆** Not suitable |
| **Affinity Propagation** | ✓ Auto-determines K<br>✓ Finds exemplars<br>✓ Good theoretical foundation | ✗ O(n²) space/time complexity<br>✗ Can be unstable<br>✗ Not incremental | **★★☆☆☆** Too slow for real-time |
| **DBSCAN** | ✓ No need to specify K<br>✓ Finds arbitrary shapes<br>✓ Handles outliers | ✗ Struggles with varying densities<br>✗ Sensitive to parameters (ε, min_samples)<br>✗ Not suitable for high-dimensional data | **★☆☆☆☆** Not suitable for voting patterns |

### 2.2 Similarity Metrics for Voting Patterns

For measuring similarity between users' voting patterns:

| Metric | Formula | Best For | Notes |
|--------|---------|----------|-------|
| **Cosine Similarity** | `cos(θ) = (A·B)/(||A|| ||B||)` | Direction of opinion | Range: [-1, 1]<br>Ignores magnitude<br>**RECOMMENDED** |
| **Euclidean Distance** | `d = √(Σ(a_i - b_i)²)` | Absolute differences | Sensitive to scale<br>Good for PCA space |
| **Pearson Correlation** | `ρ = cov(A,B)/(σ_A σ_B)` | Linear relationships | Good for relative patterns |
| **Jaccard Similarity** | `J = |A∩B| / |A∪B|` | Binary voting overlap | Only for agree/disagree (no neutral) |
| **Hamming Distance** | Count of differing positions | Binary differences | Doesn't handle "pass" well |

**Recommendation:** Use **Cosine Similarity** in the original opinion space and **Euclidean Distance** after PCA projection.

---

## 3. Recommended Algorithm: PCA + K-means (Pol.is Approach)

### 3.1 Why This Choice?

1. **Proven Track Record:** Successfully used by Pol.is in production with millions of users
2. **Handles Sparse Data:** EMPCA variant designed for incomplete voting matrices
3. **Incremental Updates:** Can update clustering as new votes arrive without full recomputation
4. **Interpretability:** PCA components often correspond to interpretable opinion dimensions
5. **Visualization:** Natural 2D projection for user-facing visualizations
6. **Performance:** Efficient enough for real-time updates (O(n·k) for k-means)
7. **Simple Implementation:** Well-documented libraries available (scikit-learn, etc.)

### 3.2 Algorithm Pipeline

```
1. Build Opinion Matrix
   ↓
2. Apply EMPCA (Expectation-Maximization PCA)
   - Handle missing/sparse data
   - Reduce to 2 principal components
   ↓
3. K-means Clustering (K=100 fine-grained)
   - Cluster in 2D PCA space
   - Use Euclidean distance
   ↓
4. Coarse-Grained Grouping
   - Merge similar fine-grained clusters
   - Typically results in 2-5 major opinion groups
   ↓
5. Consensus Detection
   - Calculate agreement scores per statement per group
   - Identify consensus (high cross-group agreement)
   - Identify divisive (high within-group, low across-group)
   ↓
6. Visualization & Insights
   - 2D scatter plot (PC1 vs PC2)
   - Color by opinion group
   - Highlight consensus/divisive statements
```

---

## 4. Technical Implementation Details

### 4.1 Database Schema Extensions

**New Tables:**

```sql
-- Opinion groups for each poll
CREATE TABLE poll_opinion_groups (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  group_number INTEGER NOT NULL,
  group_label VARCHAR(100), -- e.g., "Progressive", "Conservative", "Moderate"
  centroid_pc1 FLOAT, -- PCA component 1
  centroid_pc2 FLOAT, -- PCA component 2
  member_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(poll_id, group_number)
);

-- User assignments to opinion groups
CREATE TABLE user_opinion_groups (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES poll_opinion_groups(id) ON DELETE CASCADE,
  pc1 FLOAT, -- User's position in PCA space
  pc2 FLOAT,
  confidence_score FLOAT, -- How strongly user belongs to this group (0-1)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, poll_id)
);

-- Statement classifications
CREATE TABLE statement_classifications (
  id SERIAL PRIMARY KEY,
  statement_id INTEGER REFERENCES statements(id) ON DELETE CASCADE,
  classification_type VARCHAR(20), -- 'consensus', 'divisive', 'bridge', 'neutral'
  consensus_score FLOAT, -- 0-1, higher = more consensus
  divisiveness_score FLOAT, -- 0-1, higher = more divisive
  group_agreement_data JSONB, -- {group_id: agreement_percentage}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clustering metadata and PCA model
CREATE TABLE poll_clustering_metadata (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  algorithm_version VARCHAR(50), -- e.g., "pca-kmeans-v1"
  num_clusters INTEGER,
  pca_explained_variance JSONB, -- [variance_pc1, variance_pc2]
  pca_components JSONB, -- Store PCA transformation matrix
  last_computed_at TIMESTAMP,
  num_votes_at_computation INTEGER,
  needs_recompute BOOLEAN DEFAULT false,
  UNIQUE(poll_id)
);

-- System-wide clustering configuration
CREATE TABLE clustering_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  value_type VARCHAR(20) NOT NULL, -- 'number', 'boolean', 'string'
  description TEXT,
  min_value FLOAT, -- For numeric values
  max_value FLOAT, -- For numeric values
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default configuration values
INSERT INTO clustering_config (config_key, config_value, value_type, description, min_value, max_value) VALUES
  ('fine_grained_k', '100', 'number', 'Number of fine-grained clusters (K-means K parameter)', 50, 200),
  ('pca_components', '2', 'number', 'Number of PCA components for dimensionality reduction', 2, 3),
  ('coarse_groups_min', '2', 'number', 'Minimum number of coarse opinion groups', 2, 3),
  ('coarse_groups_max', '5', 'number', 'Maximum number of coarse opinion groups', 3, 8),
  ('consensus_variance_threshold', '0.2', 'number', 'Variance threshold for consensus detection (lower = stricter)', 0.1, 0.3),
  ('consensus_agreement_threshold', '0.7', 'number', 'Agreement percentage threshold for consensus', 0.6, 0.9),
  ('divisive_threshold', '0.4', 'number', 'Divisiveness score threshold', 0.3, 0.6),
  ('bridge_threshold_min', '0.2', 'number', 'Minimum divisiveness for bridge statements', 0.1, 0.3),
  ('bridge_threshold_max', '0.4', 'number', 'Maximum divisiveness for bridge statements', 0.3, 0.5),
  ('min_votes_per_user', '7', 'number', 'Minimum votes per user to include in clustering', 3, 15),
  ('min_total_users', '10', 'number', 'Minimum total users before clustering starts', 5, 50),
  ('recompute_debounce_seconds', '30', 'number', 'Debounce time for real-time clustering updates', 10, 300),
  ('empca_max_iterations', '100', 'number', 'Maximum iterations for EMPCA convergence', 50, 200),
  ('kmeans_n_init', '10', 'number', 'Number of k-means initialization runs', 5, 20),
  ('kmeans_max_iter', '300', 'number', 'Maximum iterations for k-means convergence', 100, 500),
  ('clustering_enabled', 'true', 'boolean', 'Enable clustering system-wide', NULL, NULL);
```

### 4.2 Configuration Management

**TypeScript Configuration Interface:**

```typescript
// lib/config/clustering-config.ts

export interface ClusteringConfig {
  // Core algorithm parameters
  fineGrainedK: number;
  pcaComponents: number;
  coarseGroupsMin: number;
  coarseGroupsMax: number;

  // Consensus detection
  consensusVarianceThreshold: number;
  consensusAgreementThreshold: number;
  divisiveThreshold: number;
  bridgeThresholdMin: number;
  bridgeThresholdMax: number;

  // Data inclusion
  minVotesPerUser: number;
  minTotalUsers: number;

  // Performance
  recomputeDebounceSeconds: number;
  empcaMaxIterations: number;
  kmeansNInit: number;
  kmeansMaxIter: number;

  // System
  clusteringEnabled: boolean;
}

// Default values (fallback if DB not available)
export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  fineGrainedK: 100,
  pcaComponents: 2,
  coarseGroupsMin: 2,
  coarseGroupsMax: 5,
  consensusVarianceThreshold: 0.2,
  consensusAgreementThreshold: 0.7,
  divisiveThreshold: 0.4,
  bridgeThresholdMin: 0.2,
  bridgeThresholdMax: 0.4,
  minVotesPerUser: 7,
  minTotalUsers: 10,
  recomputeDebounceSeconds: 30,
  empcaMaxIterations: 100,
  kmeansNInit: 10,
  kmeansMaxIter: 300,
  clusteringEnabled: true,
};
```

**Configuration Service:**

```typescript
// lib/services/clustering-config-service.ts

import { db } from "@/db/db";
import { clusteringConfig } from "@/db/schema";
import { eq } from "drizzle-orm";

class ClusteringConfigService {
  private static cache: ClusteringConfig | null = null;
  private static cacheExpiry: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get clustering configuration from database with caching
   */
  static async getConfig(): Promise<ClusteringConfig> {
    // Check cache
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    try {
      // Load from database
      const configs = await db.select().from(clusteringConfig);

      const configMap = configs.reduce((acc, config) => {
        acc[config.config_key] = JSON.parse(config.config_value as string);
        return acc;
      }, {} as Record<string, any>);

      // Build typed config object
      const config: ClusteringConfig = {
        fineGrainedK: configMap.fine_grained_k ?? DEFAULT_CLUSTERING_CONFIG.fineGrainedK,
        pcaComponents: configMap.pca_components ?? DEFAULT_CLUSTERING_CONFIG.pcaComponents,
        coarseGroupsMin: configMap.coarse_groups_min ?? DEFAULT_CLUSTERING_CONFIG.coarseGroupsMin,
        coarseGroupsMax: configMap.coarse_groups_max ?? DEFAULT_CLUSTERING_CONFIG.coarseGroupsMax,
        consensusVarianceThreshold: configMap.consensus_variance_threshold ?? DEFAULT_CLUSTERING_CONFIG.consensusVarianceThreshold,
        consensusAgreementThreshold: configMap.consensus_agreement_threshold ?? DEFAULT_CLUSTERING_CONFIG.consensusAgreementThreshold,
        divisiveThreshold: configMap.divisive_threshold ?? DEFAULT_CLUSTERING_CONFIG.divisiveThreshold,
        bridgeThresholdMin: configMap.bridge_threshold_min ?? DEFAULT_CLUSTERING_CONFIG.bridgeThresholdMin,
        bridgeThresholdMax: configMap.bridge_threshold_max ?? DEFAULT_CLUSTERING_CONFIG.bridgeThresholdMax,
        minVotesPerUser: configMap.min_votes_per_user ?? DEFAULT_CLUSTERING_CONFIG.minVotesPerUser,
        minTotalUsers: configMap.min_total_users ?? DEFAULT_CLUSTERING_CONFIG.minTotalUsers,
        recomputeDebounceSeconds: configMap.recompute_debounce_seconds ?? DEFAULT_CLUSTERING_CONFIG.recomputeDebounceSeconds,
        empcaMaxIterations: configMap.empca_max_iterations ?? DEFAULT_CLUSTERING_CONFIG.empcaMaxIterations,
        kmeansNInit: configMap.kmeans_n_init ?? DEFAULT_CLUSTERING_CONFIG.kmeansNInit,
        kmeansMaxIter: configMap.kmeans_max_iter ?? DEFAULT_CLUSTERING_CONFIG.kmeansMaxIter,
        clusteringEnabled: configMap.clustering_enabled ?? DEFAULT_CLUSTERING_CONFIG.clusteringEnabled,
      };

      // Update cache
      this.cache = config;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      return config;
    } catch (error) {
      console.error("Failed to load clustering config from DB:", error);
      return DEFAULT_CLUSTERING_CONFIG;
    }
  }

  /**
   * Update a specific configuration value
   */
  static async updateConfig(key: string, value: number | boolean | string): Promise<void> {
    await db
      .update(clusteringConfig)
      .set({
        config_value: JSON.stringify(value),
        updated_at: new Date(),
      })
      .where(eq(clusteringConfig.config_key, key));

    // Invalidate cache
    this.cache = null;
  }

  /**
   * Update multiple configuration values at once
   */
  static async updateMultipleConfigs(updates: Record<string, number | boolean | string>): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      await this.updateConfig(key, value);
    }
  }

  /**
   * Invalidate cache (call after config changes)
   */
  static invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Get a single config value
   */
  static async getConfigValue<T extends keyof ClusteringConfig>(
    key: T
  ): Promise<ClusteringConfig[T]> {
    const config = await this.getConfig();
    return config[key];
  }
}

export default ClusteringConfigService;
```

### 4.3 Data Processing Pipeline

**Step 1: Build Opinion Matrix**

```typescript
interface OpinionMatrix {
  users: number[]; // user IDs
  statements: number[]; // statement IDs
  matrix: number[][]; // [users][statements] with values: 1, -1, 0, null
  sparsity: number; // percentage of null values
}

async function buildOpinionMatrix(pollId: number): Promise<OpinionMatrix> {
  // 1. Get all approved statements for poll
  const statements = await getApprovedStatements(pollId);

  // 2. Get all users who have voted on this poll
  const users = await getUsersWhoVoted(pollId);

  // 3. Build matrix from votes
  const matrix = [];
  for (const user of users) {
    const row = [];
    for (const statement of statements) {
      const vote = await getVote(user.id, statement.id);
      row.push(vote?.value ?? null); // 1, -1, 0, or null
    }
    matrix.push(row);
  }

  return {
    users: users.map(u => u.id),
    statements: statements.map(s => s.id),
    matrix,
    sparsity: calculateSparsity(matrix)
  };
}
```

**Step 2: Apply PCA with Missing Data Handling**

```typescript
interface PCAResult {
  coordinates: number[][]; // [users][2] - PC1, PC2 for each user
  explainedVariance: number[]; // [variance_pc1, variance_pc2]
  components: number[][]; // Transformation matrix for future projections
}

async function applyPCA(
  opinionMatrix: OpinionMatrix
): Promise<PCAResult> {
  // Load configuration
  const config = await ClusteringConfigService.getConfig();

  // For sparse matrices, use EMPCA (Expectation-Maximization PCA)
  // This handles null values properly

  // Recommended: Python microservice for EMPCA
  const result = await callPythonService('empca', {
    matrix: opinionMatrix.matrix,
    n_components: config.pcaComponents,
    max_iterations: config.empcaMaxIterations
  });

  return result;
}
```

**Step 3: K-means Clustering**

```typescript
interface ClusteringResult {
  labels: number[]; // Cluster assignment for each user
  centroids: number[][]; // [clusters][2] - centroid in PCA space
  inertia: number; // Sum of squared distances to centroids
}

async function clusterUsers(
  pcaCoordinates: number[][]
): Promise<ClusteringResult> {
  // Load configuration
  const config = await ClusteringConfigService.getConfig();

  // Use k-means++ initialization for better starting centroids
  // Run multiple times and pick best result (lowest inertia)

  const result = await callPythonService('kmeans', {
    data: pcaCoordinates,
    n_clusters: config.fineGrainedK,
    init: 'k-means++',
    n_init: config.kmeansNInit,
    max_iter: config.kmeansMaxIter
  });

  return result;
}
```

**Step 4: Coarse-Grained Grouping**

```typescript
async function createCoarseGroups(
  fineGrainedClusters: ClusteringResult
): Promise<number[]> {
  // Load configuration
  const config = await ClusteringConfigService.getConfig();

  // Determine optimal number of coarse groups
  // Uses elbow method or silhouette scores within configured range
  const targetGroups = await determineOptimalCoarseGroups(
    fineGrainedClusters.centroids,
    config.coarseGroupsMin,
    config.coarseGroupsMax
  );

  // Merge fine-grained clusters into coarse groups
  // Use hierarchical clustering on the centroids
  const hierarchical = await callPythonService('hierarchical', {
    data: fineGrainedClusters.centroids,
    n_clusters: targetGroups,
    linkage: 'ward'
  });

  // Map each user from fine cluster to coarse group
  const userGroups = fineGrainedClusters.labels.map(
    fineLabel => hierarchical.labels[fineLabel]
  );

  return userGroups;
}

async function determineOptimalCoarseGroups(
  centroids: number[][],
  minGroups: number,
  maxGroups: number
): Promise<number> {
  // Try hierarchical clustering with different group counts
  // Use silhouette score to pick best
  let bestScore = -1;
  let bestK = minGroups;

  for (let k = minGroups; k <= maxGroups; k++) {
    const result = await callPythonService('hierarchical', {
      data: centroids,
      n_clusters: k,
      linkage: 'ward'
    });

    const score = await calculateSilhouetteScore(centroids, result.labels);
    if (score > bestScore) {
      bestScore = score;
      bestK = k;
    }
  }

  return bestK;
}
```

**Step 5: Consensus Detection**

```typescript
interface StatementClassification {
  statementId: number;
  type: 'consensus' | 'divisive' | 'bridge' | 'neutral';
  consensusScore: number; // 0-1
  divisivenessScore: number; // 0-1
  groupAgreement: Record<number, number>; // {groupId: agreementPercentage}
}

async function classifyStatements(
  opinionMatrix: OpinionMatrix,
  userGroups: number[]
): Promise<StatementClassification[]> {
  const classifications: StatementClassification[] = [];

  for (let stmtIdx = 0; stmtIdx < opinionMatrix.statements.length; stmtIdx++) {
    const statementId = opinionMatrix.statements[stmtIdx];

    // Calculate agreement per group
    const groupAgreement: Record<number, number> = {};
    const uniqueGroups = [...new Set(userGroups)];

    for (const group of uniqueGroups) {
      const usersInGroup = userGroups
        .map((g, idx) => g === group ? idx : -1)
        .filter(idx => idx !== -1);

      const votes = usersInGroup.map(userIdx =>
        opinionMatrix.matrix[userIdx][stmtIdx]
      ).filter(v => v !== null);

      // Agreement = % of agree votes / (agree + disagree)
      const agrees = votes.filter(v => v === 1).length;
      const total = votes.filter(v => v !== 0).length; // exclude neutral
      groupAgreement[group] = total > 0 ? agrees / total : 0;
    }

    // Calculate consensus score
    // High if all groups have similar agreement
    const agreementValues = Object.values(groupAgreement);
    const avgAgreement = agreementValues.reduce((a, b) => a + b, 0) / agreementValues.length;
    const variance = agreementValues.reduce((sum, val) =>
      sum + Math.pow(val - avgAgreement, 2), 0) / agreementValues.length;
    const consensusScore = 1 - variance; // Low variance = high consensus

    // Calculate divisiveness score
    // High if groups have very different agreement levels
    const divisivenessScore = Math.sqrt(variance);

    // Load configuration for thresholds
    const config = await ClusteringConfigService.getConfig();

    // Classify based on configured thresholds
    let type: 'consensus' | 'divisive' | 'bridge' | 'neutral';
    const isConsensus = consensusScore > (1 - config.consensusVarianceThreshold) &&
      (avgAgreement > config.consensusAgreementThreshold ||
       avgAgreement < (1 - config.consensusAgreementThreshold));

    if (isConsensus) {
      type = 'consensus'; // Strong cross-group agreement or disagreement
    } else if (divisivenessScore > config.divisiveThreshold) {
      type = 'divisive'; // Groups strongly disagree
    } else if (divisivenessScore > config.bridgeThresholdMin &&
               divisivenessScore <= config.bridgeThresholdMax) {
      type = 'bridge'; // Moderate differences, potential for dialogue
    } else {
      type = 'neutral'; // No clear pattern
    }

    classifications.push({
      statementId,
      type,
      consensusScore,
      divisivenessScore,
      groupAgreement
    });
  }

  return classifications;
}
```

### 4.4 Incremental Updates

**When to Recompute Clustering:**

```typescript
async function shouldRecomputeClustering(pollId: number): Promise<boolean> {
  // Load configuration
  const config = await ClusteringConfigService.getConfig();

  // Check if clustering is enabled system-wide
  if (!config.clusteringEnabled) return false;

  const metadata = await getPollClusteringMetadata(pollId);
  const currentUsers = await countUsersWhoVoted(pollId);

  // Not enough users yet
  if (currentUsers < config.minTotalUsers) return false;

  // First time clustering
  if (!metadata) return true;

  // Manual flag
  if (metadata.needs_recompute) return true;

  // Real-time mode: recompute on every vote (with debouncing handled elsewhere)
  return true;
}

async function filterUsersByVotingThreshold(
  pollId: number,
  users: number[]
): Promise<number[]> {
  // Load configuration
  const config = await ClusteringConfigService.getConfig();

  // Filter users who have voted on enough statements
  const filteredUsers = [];
  for (const userId of users) {
    const voteCount = await countUserVotesInPoll(userId, pollId);
    if (voteCount >= config.minVotesPerUser) {
      filteredUsers.push(userId);
    }
  }

  return filteredUsers;
}
```

### 4.5 Python Microservice Architecture

Since JavaScript lacks robust implementations of EMPCA and advanced clustering, we'll use a Python microservice:

**Python Service (`/services/clustering-service`):**

```python
# clustering_service.py
from fastapi import FastAPI
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans, AgglomerativeClustering
import numpy as np
from typing import List, Optional
import uvicorn

app = FastAPI()

@app.post("/api/empca")
async def empca(
    matrix: List[List[Optional[float]]],
    n_components: int = 2,
    max_iterations: int = 100
):
    """
    Expectation-Maximization PCA for sparse matrices
    Uses weighted PCA with missing data handling
    """
    # Convert to numpy array
    X = np.array(matrix, dtype=float)

    # Use iterative imputation for missing values
    from sklearn.experimental import enable_iterative_imputer
    from sklearn.impute import IterativeImputer

    imputer = IterativeImputer(max_iter=max_iterations)
    X_imputed = imputer.fit_transform(X)

    # Apply PCA
    pca = PCA(n_components=n_components)
    coordinates = pca.fit_transform(X_imputed)

    return {
        "coordinates": coordinates.tolist(),
        "explained_variance": pca.explained_variance_ratio_.tolist(),
        "components": pca.components_.tolist()
    }

@app.post("/api/kmeans")
async def kmeans(
    data: List[List[float]],
    n_clusters: int = 100,
    init: str = "k-means++",
    n_init: int = 10,
    max_iter: int = 300
):
    """K-means clustering"""
    X = np.array(data)

    kmeans = KMeans(
        n_clusters=n_clusters,
        init=init,
        n_init=n_init,
        max_iter=max_iter,
        random_state=42
    )
    labels = kmeans.fit_predict(X)

    return {
        "labels": labels.tolist(),
        "centroids": kmeans.cluster_centers_.tolist(),
        "inertia": float(kmeans.inertia_)
    }

@app.post("/api/hierarchical")
async def hierarchical(
    data: List[List[float]],
    n_clusters: int,
    linkage: str = "ward"
):
    """Hierarchical clustering for coarse grouping"""
    X = np.array(data)

    clustering = AgglomerativeClustering(
        n_clusters=n_clusters,
        linkage=linkage
    )
    labels = clustering.fit_predict(X)

    return {
        "labels": labels.tolist()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

**Docker Container:**

```dockerfile
# Dockerfile.clustering
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY clustering_service.py .

EXPOSE 8001

CMD ["python", "clustering_service.py"]
```

**requirements.txt:**

```
fastapi==0.109.0
uvicorn==0.27.0
numpy==1.26.3
scikit-learn==1.4.0
scipy==1.12.0
```

---

## 5. UI/UX Components

### 5.1 Visualization Components

**Opinion Space Visualization (2D Scatter Plot):**

```typescript
// components/clustering/OpinionSpaceVisualization.tsx
interface OpinionSpaceProps {
  pollId: number;
  showCurrentUser?: boolean;
  interactive?: boolean;
}

// Shows:
// - 2D visualization of opinion space (PC1 vs PC2)
// - Opinion group regions/clouds (aggregated shapes, no individual points)
// - Color-coded group boundaries
// - Current user's position highlighted if showCurrentUser=true
// - No other individual user markers (privacy-preserving)
// - Click statement to show how groups voted on it
```

**Statement Classification Badges:**

```typescript
// components/clustering/StatementBadge.tsx
interface StatementBadgeProps {
  classification: 'consensus' | 'divisive' | 'bridge' | 'neutral';
  score: number;
}

// Visual indicators:
// - Consensus: Green badge "Consensus across groups"
// - Divisive: Red badge "Divides opinion groups"
// - Bridge: Yellow badge "Potential for dialogue"
// - Neutral: Gray badge (or no badge)
```

**Group Insights Panel:**

```typescript
// components/clustering/GroupInsights.tsx
interface GroupInsightsProps {
  pollId: number;
  userId: number;
}

// Shows:
// - Which opinion group the user belongs to
// - Group size and characteristics
// - Statements this group strongly agrees/disagrees with
// - How this group compares to other groups
// - Bridge statements for cross-group understanding
```

### 5.2 Admin Dashboard Components

**Clustering Configuration Panel:**

```typescript
// components/admin/ClusteringConfigPanel.tsx
interface ConfigParameter {
  key: string;
  label: string;
  value: number | boolean;
  type: 'number' | 'boolean';
  description: string;
  min?: number;
  max?: number;
  category: 'core' | 'consensus' | 'data' | 'performance';
}

// Admin UI for editing clustering configuration
// - Grouped by category (Core, Consensus Detection, Data Inclusion, Performance)
// - Sliders for numeric values with min/max constraints
// - Toggles for boolean values
// - Real-time validation
// - "Save Changes" button with confirmation
// - "Reset to Defaults" button
// - Shows current values vs defaults
```

**Example Admin UI Structure:**

```tsx
// Pseudocode for admin config UI
<ClusteringConfigPanel>
  <Section title="Core Algorithm">
    <NumberInput
      label="Fine-Grained Clusters (K)"
      value={config.fineGrainedK}
      min={50}
      max={200}
      step={10}
      description="Number of fine-grained clusters before merging"
    />
    <NumberInput
      label="Coarse Groups (Min)"
      value={config.coarseGroupsMin}
      min={2}
      max={3}
      description="Minimum number of final opinion groups"
    />
    <NumberInput
      label="Coarse Groups (Max)"
      value={config.coarseGroupsMax}
      min={3}
      max={8}
      description="Maximum number of final opinion groups"
    />
  </Section>

  <Section title="Consensus Detection">
    <Slider
      label="Consensus Variance Threshold"
      value={config.consensusVarianceThreshold}
      min={0.1}
      max={0.3}
      step={0.01}
      description="Lower = stricter consensus requirement"
    />
    <Slider
      label="Agreement Threshold"
      value={config.consensusAgreementThreshold}
      min={0.6}
      max={0.9}
      step={0.05}
      description="% agreement needed for consensus"
    />
    <Slider
      label="Divisive Threshold"
      value={config.divisiveThreshold}
      min={0.3}
      max={0.6}
      step={0.05}
      description="Score above which statements are divisive"
    />
  </Section>

  <Section title="Data Inclusion">
    <NumberInput
      label="Min Votes Per User"
      value={config.minVotesPerUser}
      min={3}
      max={15}
      description="Users must vote this many times to be included"
    />
    <NumberInput
      label="Min Total Users"
      value={config.minTotalUsers}
      min={5}
      max={50}
      description="Poll needs this many users before clustering"
    />
  </Section>

  <Section title="Performance">
    <NumberInput
      label="Debounce (seconds)"
      value={config.recomputeDebounceSeconds}
      min={10}
      max={300}
      description="Wait time before recomputing after new votes"
    />
    <Toggle
      label="Enable Clustering"
      value={config.clusteringEnabled}
      description="Turn clustering on/off system-wide"
    />
  </Section>

  <Actions>
    <Button onClick={saveConfig}>Save Changes</Button>
    <Button onClick={resetToDefaults} variant="secondary">
      Reset to Defaults
    </Button>
    <Button onClick={recomputeAllPolls} variant="warning">
      Recompute All Polls
    </Button>
  </Actions>
</ClusteringConfigPanel>
```

**Clustering Overview:**

- Number of opinion groups identified
- Group sizes and labels
- Clustering quality metrics (silhouette score, etc.)
- Last computation timestamp
- Button to force recomputation
- Link to configuration panel

**Consensus Report:**

- List of consensus statements (sorted by score)
- List of divisive statements
- Bridge statements for facilitated dialogue
- Export report as PDF/CSV

---

## 6. Performance Considerations

### 6.1 Computational Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Build opinion matrix | O(u·s) | u=users, s=statements |
| EMPCA | O(u·s·k·i) | k=components (2), i=iterations (~10) |
| K-means | O(u·K·t) | K=clusters (100), t=iterations (~50) |
| Hierarchical (coarse) | O(K²) | K=100, negligible |
| Consensus detection | O(s·G) | G=groups (2-5) |
| **Total** | **O(u·s·i + u·K·t)** | Dominated by EMPCA and K-means |

**Example:** 1000 users, 50 statements, EMPCA ~10 iterations, K-means ~50 iterations
- EMPCA: 1000 × 50 × 2 × 10 = 1,000,000 ops
- K-means: 1000 × 100 × 50 = 5,000,000 ops
- **Total: ~6M operations** (sub-second on modern hardware)

### 6.2 Caching Strategy

```typescript
// Cache PCA coordinates and cluster assignments
interface CachedClustering {
  pollId: number;
  computedAt: Date;
  groups: PollOpinionGroup[];
  userAssignments: Map<number, UserOpinionGroup>;
  statementClassifications: Map<number, StatementClassification>;
}

// Cache invalidation (real-time system):
// 1. Clustering recomputes (every 30s debounce after new votes)
// 2. Manual recompute requested
// 3. Poll settings change
// Note: Real-time debouncing means cache stays fresh automatically
```

### 6.3 Background Job Processing

```typescript
// Use background job queue (e.g., BullMQ) for clustering computation
async function scheduleClusteringJob(pollId: number) {
  await clusteringQueue.add('compute-clustering', {
    pollId,
    priority: 'normal'
  });
}

// Job handler
clusteringQueue.process('compute-clustering', async (job) => {
  const { pollId } = job.data;

  // 1. Build opinion matrix
  const matrix = await buildOpinionMatrix(pollId);

  // 2. Apply PCA
  const pca = await applyPCA(matrix);

  // 3. Cluster users
  const clustering = await clusterUsers(pca.coordinates);

  // 4. Create coarse groups
  const groups = await createCoarseGroups(clustering);

  // 5. Classify statements
  const classifications = await classifyStatements(matrix, groups);

  // 6. Save to database
  await saveClustering(pollId, pca, groups, classifications);

  // 7. Invalidate relevant caches
  await invalidatePollCache(pollId);
});
```

---

## 7. Design Decisions (RESOLVED)

### 7.1 Clustering Parameters ✓

**Decision:** Fixed K=100 fine-grained clusters, merged to 2-5 coarse groups (Pol.is approach)
- No poll creator override allowed
- Consistent clustering across entire platform
- Proven at scale with Pol.is

### 7.2 Recompute Policy ✓

**Decision:** Follow Pol.is approach with real-time clustering
- **Minimum threshold:** 7 votes per user (Pol.is standard) OR poll's `min_statements_voted_to_end` setting (whichever is higher)
- **Real-time updates:** Clustering recomputed continuously as votes arrive
- **Debouncing:** 30-second debounce to avoid excessive computation
- **System-wide policy:** No per-poll configuration needed

**Implementation:**
```typescript
const CLUSTERING_CONFIG = {
  minVotesPerUser: 7, // Pol.is standard
  minTotalUsers: 10, // Need meaningful sample
  recomputeDebounceSeconds: 30, // Avoid excessive recomputation
  realTimeEnabled: true
};
```

### 7.3 Consensus Definition ✓

**Decision:** Variance-based approach (Pol.is method)
- Consensus when variance across groups <0.2
- Supports both positive consensus (all agree) and negative consensus (all disagree)
- **UI distinction:** Subtle differentiation between positive/negative consensus
  - Positive: Green badge "✓ Consensus: Groups agree"
  - Negative: Blue badge "✓ Consensus: Groups reject"

### 7.4 Sparse Data Handling ✓

**Decision:** Use existing poll minimum voting threshold
- Minimum votes = `min_statements_voted_to_end` from poll settings (default 5)
- If user hasn't met threshold: Show "Vote on N more statements to see your position"
- Clustering only includes users who meet the threshold
- Links clustering eligibility to poll's existing participation requirements

### 7.5 Dimensionality Reduction ✓

**Decision:** Start with PCA, add UMAP later
- **Phase 1 (MVP):** EMPCA for dimensionality reduction
- **Phase 4 (Future):** Add UMAP as optional visualization enhancement
- Rationale: PCA proven, incremental, faster for real-time

### 7.6 Privacy & Anonymity ✓

**Decision:** Spatial visualization with self-only positioning
- **Visualization shows:**
  - Opinion group regions/clouds (aggregated shapes)
  - User's own position highlighted with marker
  - No other individual user markers visible
- **Benefits:**
  - User can see where they fit in opinion landscape
  - Cannot identify or track other specific users
  - Balances insight with privacy
- **Group sizes:** Always show group counts even if <5 users

**Implementation:**
```typescript
interface OpinionSpaceVisualization {
  groups: Array<{
    id: number;
    label: string;
    boundaryPolygon: [number, number][]; // Convex hull of group
    centroid: [number, number];
    memberCount: number;
  }>;
  currentUser: {
    position: [number, number];
    groupId: number;
  };
  // No other individual user positions exposed
}
```

### 7.7 Group Labeling ✓

**Decision:** Simple numeric labels initially, AI labeling in Phase 4
- **Phase 1-3:** "Opinion Group 1", "Opinion Group 2", etc.
- **Phase 4:** Add AI-generated descriptive labels as optional enhancement
- Poll creators can manually override labels if desired

### 7.8 Real-Time Updates ✓

**Decision:** Real-time with WebSocket infrastructure
- Clustering recomputes in real-time (30s debounce)
- Visualization updates pushed via WebSocket
- User's position updates smoothly with animation
- Group boundaries update when significant changes occur
- **Optimization:** Only push updates to active viewers of opinion space

**Technical Requirements:**
- WebSocket server for real-time push
- Background job queue for clustering computation
- Redis for pub/sub coordination
- Client-side animation for smooth transitions

---

## 8. Implementation Roadmap

### Phase 1: MVP (Core Clustering)
**Timeline: 2-3 weeks**

- [ ] Set up Python clustering microservice (Docker)
- [ ] Implement opinion matrix builder
- [ ] Integrate EMPCA for PCA with sparse data
- [ ] Implement K-means clustering (K=100)
- [ ] Implement coarse-grained grouping
- [ ] Create database schema (new tables)
- [ ] Build consensus detection algorithm
- [ ] Create background job queue for clustering computation
- [ ] Add recompute policies and triggers
- [ ] Basic admin UI: trigger clustering, view results

**Deliverable:** Working clustering system, viewable in admin dashboard

### Phase 2: Visualization (User-Facing)
**Timeline: 1-2 weeks**

- [ ] Build 2D opinion space visualization component
- [ ] Add statement classification badges (consensus/divisive)
- [ ] Create group insights panel for users
- [ ] Add "Your Opinion Group" section to poll results
- [ ] Implement hover/click interactions on visualization
- [ ] Add export functionality (PDF reports)

**Deliverable:** User-facing clustering insights and visualizations

### Phase 3: Refinement (Polish & Optimization)
**Timeline: 1 week**

- [ ] Optimize clustering performance (caching, incremental updates)
- [ ] Add silhouette scores and clustering quality metrics
- [ ] Implement adaptive K determination (elbow method)
- [ ] Add A/B testing framework for clustering parameters
- [ ] Polish UI/UX based on feedback
- [ ] Write documentation and user guides

**Deliverable:** Production-ready, optimized clustering system

### Phase 4: Advanced Features (Future Enhancements)
**Timeline: TBD**

- [ ] UMAP alternative for visualization
- [ ] AI-generated group labels
- [ ] Bridge-building features (cross-group dialogue prompts)
- [ ] Time-series view (how clusters evolve over poll lifetime)
- [ ] Comparative clustering (compare across polls)
- [ ] Export clustering data via API

**Deliverable:** Advanced analytics and engagement features

---

## 9. Success Metrics

### 9.1 Technical Metrics

- **Clustering Quality:** Silhouette score >0.3 (good cluster separation)
- **Explained Variance:** First 2 PCA components explain >40% of variance
- **Computation Time:** <10 seconds for polls with <1000 users
- **Consensus Detection:** Identify at least 3 consensus statements per poll (on average)
- **Update Frequency:** Clustering updates within 1 minute of votes being cast (30s debounce)

### 9.2 User Engagement Metrics

- **Visualization Engagement:** >50% of poll participants view opinion space
- **Group Insights:** >30% of participants view their group insights
- **Cross-Group Understanding:** Track clicks on bridge statements
- **Poll Creator Usage:** >70% of poll creators review clustering analytics

### 9.3 Platform Impact Metrics

- **Consensus Surfacing:** Consensus statements get highlighted in results
- **Dialogue Quality:** Measure if bridge statements prompt more nuanced discussion
- **User Retention:** Do clustering features increase repeat engagement?

---

## 10. Technical Dependencies

### 10.1 Required Libraries & Services

**Python Microservice:**
- scikit-learn (PCA, K-means, hierarchical clustering)
- NumPy (matrix operations)
- FastAPI (API framework)
- uvicorn (ASGI server)

**Node.js/TypeScript:**
- Axios or Fetch (HTTP client for Python service)
- BullMQ (background job queue)
- Redis (job queue backend)

**Frontend:**
- D3.js or Recharts (2D visualization)
- React (UI components)

**Infrastructure:**
- Docker (containerize Python service)
- PostgreSQL (data storage)
- Redis (caching & job queue)

### 10.2 Development Environment

```bash
# Start Python clustering service
cd services/clustering-service
docker build -t pulse-clustering .
docker run -p 8001:8001 pulse-clustering

# Test endpoint
curl -X POST http://localhost:8001/api/empca \
  -H "Content-Type: application/json" \
  -d '{"matrix": [[1, -1, 0], [1, 1, null]], "n_components": 2}'
```

---

## 11. Alternative Approaches Considered

### 11.1 Pure JavaScript Implementation

**Pros:** No microservice needed, simpler architecture
**Cons:** No good EMPCA library, slower performance
**Decision:** Rejected - Python is much better for ML workloads

### 11.2 Third-Party Clustering API

**Pros:** No infrastructure to maintain
**Cons:** Vendor lock-in, privacy concerns, ongoing costs
**Decision:** Rejected - Want full control over algorithm

### 11.3 Client-Side Clustering

**Pros:** No server load
**Cons:** Exposes all voting data to client, slow on large datasets
**Decision:** Rejected - Security and performance issues

---

## 12. References & Further Reading

1. **Pol.is Academic Paper:**
   - Small, C., Bjorkegren, M., Erkkilä, T., Shaw, L., & Megill, C. (2021). "Polis: Scaling Deliberation by Mapping High Dimensional Opinion Spaces"
   - Available: https://gwern.net/doc/sociology/2021-small.pdf

2. **EMPCA (Weighted PCA for Missing Data):**
   - Bailey, S. (2012). "Principal Component Analysis with Noisy and/or Missing Data"
   - GitHub: https://github.com/sbailey/empca

3. **PCA + K-means Theory:**
   - Ding, C. & He, X. (2004). "K-means Clustering via Principal Component Analysis"

4. **UMAP for Clustering:**
   - McInnes, L., Healy, J., & Melville, J. (2018). "UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction"

5. **Consensus Detection in Deliberation:**
   - Landemore, H. (2017). "Democratic Reason: Politics, Collective Intelligence, and the Rule of the Many"

6. **Pol.is GitHub Repository:**
   - https://github.com/compdemocracy/polis

7. **Analysis Examples:**
   - https://github.com/ilivieris/pol.is (Jupyter notebooks for Pol.is data)

---

## 13. Next Steps & Implementation Plan

### ✓ All Major Decisions Resolved

All critical design decisions have been made (see Section 7). Ready to proceed with implementation.

### Remaining Implementation Questions:

1. **Small poll handling:** Should polls with <10 participants skip clustering entirely?
   - **Recommendation:** Yes, show message "Clustering requires at least 10 participants"

2. **Tie-breaking:** How to assign users equidistant from multiple group centroids?
   - **Recommendation:** Use soft assignment with confidence scores; assign to closest centroid

3. **Poll unpublish/republish:** Should clustering data persist or reset?
   - **Recommendation:** Persist data (votes are preserved), recompute when republished

4. **Historical snapshots:** Should we version clustering over time?
   - **Recommendation:** Phase 4 feature - track evolution of opinion groups over poll lifetime

5. **Group visibility:** Can users see which group specific other users belong to?
   - **Recommendation:** No - only aggregate statistics (aligns with privacy decision)

### Immediate Next Actions:

1. ✅ **Spec approved** - All design decisions finalized
2. **Set up Python microservice** - Create clustering service with Docker (Week 1)
3. **Database migration** - Add clustering tables to schema (Week 1)
4. **Implement clustering pipeline** - EMPCA + K-means + consensus detection (Week 1-2)
5. **Build visualization component** - 2D opinion space with group clouds (Week 3)
6. **WebSocket infrastructure** - Real-time update system (Week 3)
7. **Admin dashboard** - Clustering overview and controls (Week 4)
8. **User-facing insights** - "Your Opinion Group" panel (Week 4)
9. **Testing & optimization** - Performance tuning and edge cases (Week 5)
10. **Documentation & launch** - User guides and rollout (Week 5-6)

### Success Criteria for MVP Launch:

- [ ] Clustering completes in <10s for polls with <1000 users
- [ ] Real-time updates working with <1min latency (30s debounce)
- [ ] PCA explains >40% variance on average
- [ ] Identifies consensus statements in >80% of polls
- [ ] Visualization loads in <2s
- [ ] All admin controls functional
- [ ] User privacy maintained (no individual user de-identification possible)
- [ ] Only current user's position visible; no other individual markers shown

### Timeline: 5-6 weeks to production-ready MVP

---

**Document Version:** 3.0
**Created:** 2025-10-02
**Updated:** 2025-10-02
**Author:** Claude (AI Assistant)
**Status:** ✅ APPROVED - Ready for implementation

### Changelog:
- **v3.0 (2025-10-02):** Added comprehensive configuration system
  - Added `clustering_config` database table for system-wide settings
  - Created `ClusteringConfigService` for centralized config management
  - Updated all algorithm code to reference configurable parameters
  - Added admin UI specification for configuration panel
  - All 16 parameters now configurable via database (no hardcoding)
  - 5-minute cache on config for performance
  - Min/max validation on all numeric parameters
- **v2.1 (2025-10-02):** Fixed conflicts and incoherencies
  - Fixed visualization privacy contradiction (now consistently privacy-preserving)
  - Fixed recompute threshold inconsistency (per-user vs total votes)
  - Removed time-based recompute (not needed with real-time)
  - Updated cache invalidation for real-time approach
  - Fixed success metric (1 hour → 1 minute for real-time)
- **v2.0 (2025-10-02):** All design decisions finalized, ready for development
- **v1.0 (2025-10-02):** Initial draft with open questions

---

## Appendix A: Configuration Parameters Quick Reference

### All 16 Configurable Parameters

| Parameter | DB Key | Default | Min | Max | Category | Impact |
|-----------|--------|---------|-----|-----|----------|--------|
| Fine-Grained K | `fine_grained_k` | 100 | 50 | 200 | Core | Number of initial clusters |
| PCA Components | `pca_components` | 2 | 2 | 3 | Core | Dimensionality (2 for viz) |
| Coarse Groups Min | `coarse_groups_min` | 2 | 2 | 3 | Core | Min final opinion groups |
| Coarse Groups Max | `coarse_groups_max` | 5 | 3 | 8 | Core | Max final opinion groups |
| Consensus Variance | `consensus_variance_threshold` | 0.2 | 0.1 | 0.3 | Consensus | Lower = stricter |
| Consensus Agreement | `consensus_agreement_threshold` | 0.7 | 0.6 | 0.9 | Consensus | % needed to agree |
| Divisive Threshold | `divisive_threshold` | 0.4 | 0.3 | 0.6 | Consensus | Divisiveness cutoff |
| Bridge Min | `bridge_threshold_min` | 0.2 | 0.1 | 0.3 | Consensus | Min for bridge |
| Bridge Max | `bridge_threshold_max` | 0.4 | 0.3 | 0.5 | Consensus | Max for bridge |
| Min Votes/User | `min_votes_per_user` | 7 | 3 | 15 | Data | User inclusion threshold |
| Min Total Users | `min_total_users` | 10 | 5 | 50 | Data | Poll clustering threshold |
| Debounce (sec) | `recompute_debounce_seconds` | 30 | 10 | 300 | Performance | Real-time delay |
| EMPCA Iterations | `empca_max_iterations` | 100 | 50 | 200 | Performance | PCA convergence |
| K-means N-Init | `kmeans_n_init` | 10 | 5 | 20 | Performance | Initialization runs |
| K-means Max Iter | `kmeans_max_iter` | 300 | 100 | 500 | Performance | K-means convergence |
| Clustering Enabled | `clustering_enabled` | true | - | - | System | Master on/off switch |

### Code Usage Example

```typescript
// Example: Using config in clustering pipeline
async function runClusteringPipeline(pollId: number) {
  // Load config once at start
  const config = await ClusteringConfigService.getConfig();

  // Check if enabled
  if (!config.clusteringEnabled) {
    console.log("Clustering disabled system-wide");
    return;
  }

  // Build opinion matrix
  const matrix = await buildOpinionMatrix(pollId);

  // Filter users by voting threshold
  const eligibleUsers = await filterUsersByVotingThreshold(pollId, matrix.users);

  // Check minimum users
  if (eligibleUsers.length < config.minTotalUsers) {
    console.log(`Not enough users (${eligibleUsers.length} < ${config.minTotalUsers})`);
    return;
  }

  // Apply PCA with configured components and iterations
  const pca = await applyPCA(matrix); // Uses config.pcaComponents, config.empcaMaxIterations

  // Cluster with configured K
  const clustering = await clusterUsers(pca.coordinates); // Uses config.fineGrainedK

  // Create coarse groups within configured range
  const groups = await createCoarseGroups(clustering); // Uses config.coarseGroupsMin/Max

  // Classify statements with configured thresholds
  const classifications = await classifyStatements(matrix, groups); // Uses all consensus thresholds

  // Save results
  await saveClustering(pollId, pca, groups, classifications);
}
```

### Admin Actions

```typescript
// Update single parameter
await ClusteringConfigService.updateConfig('divisive_threshold', 0.45);

// Update multiple parameters
await ClusteringConfigService.updateMultipleConfigs({
  consensus_variance_threshold: 0.15,
  consensus_agreement_threshold: 0.75,
  min_total_users: 15
});

// Get single value
const minUsers = await ClusteringConfigService.getConfigValue('minTotalUsers');

// Invalidate cache after changes
ClusteringConfigService.invalidateCache();
```
