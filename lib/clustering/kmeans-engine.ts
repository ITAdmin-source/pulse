/**
 * K-Means Clustering Engine
 * Implements K-means clustering with adaptive K selection
 * Groups users into fine-grained clusters based on 2D PCA coordinates
 */

import { kmeans } from "ml-kmeans";
import { distance } from "ml-distance";

export interface KMeansResult {
  /** Cluster assignments for each user [user_count] */
  clusters: number[];
  /** Cluster centroids in 2D space [K x 2] */
  centroids: number[][];
  /** Number of clusters (K) */
  numClusters: number;
  /** Silhouette score (clustering quality: -1 to 1, higher is better) */
  silhouetteScore: number;
  /** Number of iterations until convergence */
  iterations: number;
}

/**
 * K-Means Engine for Opinion Clustering
 * Uses adaptive K selection based on user count
 */
export class KMeansEngine {
  /**
   * Determine optimal K based on user count
   * Pol.is uses K=100 for large polls, we use adaptive approach:
   *
   * - 20-49 users: K=20 (ensures 1-2.5 users per cluster)
   * - 50-99 users: K=50 (ensures 1-2 users per cluster)
   * - 100+ users: K=100 (Pol.is approach, ensures 1+ users per cluster)
   *
   * @param userCount - Number of users who voted
   * @returns Optimal K value
   */
  static determineOptimalK(userCount: number): number {
    if (userCount < 20) {
      throw new Error(
        `Insufficient users for clustering: ${userCount}. Minimum required: 20.`
      );
    }

    if (userCount < 50) {
      return 20;
    }

    if (userCount < 100) {
      return 50;
    }

    return 100;
  }

  /**
   * Perform K-means clustering on 2D PCA coordinates
   *
   * @param coordinates - User positions in 2D space [[pc1, pc2], ...]
   * @param k - Number of clusters (if not provided, auto-determined)
   * @returns Clustering result with assignments and quality metrics
   */
  static cluster(coordinates: number[][], k?: number): KMeansResult {
    const userCount = coordinates.length;

    // Validate input
    if (userCount < 20) {
      throw new Error(
        `Insufficient users for clustering: ${userCount}. Minimum required: 20.`
      );
    }

    if (coordinates.some((coord) => coord.length !== 2)) {
      throw new Error("All coordinates must be 2D [pc1, pc2]");
    }

    // Determine K if not provided
    const numClusters = k ?? this.determineOptimalK(userCount);

    // Validate K
    if (numClusters > userCount) {
      throw new Error(
        `K (${numClusters}) cannot exceed user count (${userCount})`
      );
    }

    // Perform K-means clustering
    const result = kmeans(coordinates, numClusters, {
      initialization: "kmeans++", // Smart initialization (better than random)
      maxIterations: 100,
      tolerance: 1e-4,
    });

    // Calculate silhouette score (clustering quality metric)
    const silhouetteScore = this.calculateSilhouetteScore(
      coordinates,
      result.clusters,
      result.centroids
    );

    return {
      clusters: result.clusters,
      centroids: result.centroids,
      numClusters,
      silhouetteScore,
      iterations: result.iterations,
    };
  }

  /**
   * Calculate Silhouette Score for clustering quality
   *
   * Silhouette score measures how well each point fits its cluster:
   * - +1: Point is far from neighboring clusters (excellent)
   * - 0: Point is on the border between clusters (ambiguous)
   * - -1: Point might be in the wrong cluster (poor)
   *
   * Average score interpretation:
   * - > 0.7: Strong clustering structure
   * - 0.5-0.7: Reasonable clustering
   * - 0.25-0.5: Weak clustering structure
   * - < 0.25: No substantial clustering
   *
   * @param coordinates - User positions [[pc1, pc2], ...]
   * @param clusters - Cluster assignments [0, 1, 2, ...]
   * @param centroids - Cluster centroids [[pc1, pc2], ...]
   * @returns Average silhouette score (-1 to 1)
   */
  private static calculateSilhouetteScore(
    coordinates: number[][],
    clusters: number[],
    centroids: number[][]
  ): number {
    const numPoints = coordinates.length;
    const numClusters = centroids.length;

    if (numPoints === 0 || numClusters <= 1) {
      return 0;
    }

    const silhouetteScores: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const point = coordinates[i];
      const cluster = clusters[i];

      // a(i): Mean distance to points in same cluster
      const sameClusterPoints = coordinates.filter(
        (_, idx) => clusters[idx] === cluster && idx !== i
      );

      if (sameClusterPoints.length === 0) {
        // Singleton cluster, skip
        continue;
      }

      const a =
        sameClusterPoints.reduce(
          (sum, otherPoint) =>
            sum + distance.euclidean(point, otherPoint),
          0
        ) / sameClusterPoints.length;

      // b(i): Mean distance to points in nearest neighboring cluster
      let minMeanDistance = Infinity;

      for (let k = 0; k < numClusters; k++) {
        if (k === cluster) continue;

        const otherClusterPoints = coordinates.filter(
          (_, idx) => clusters[idx] === k
        );

        if (otherClusterPoints.length === 0) continue;

        const meanDistance =
          otherClusterPoints.reduce(
            (sum, otherPoint) =>
              sum + distance.euclidean(point, otherPoint),
            0
          ) / otherClusterPoints.length;

        minMeanDistance = Math.min(minMeanDistance, meanDistance);
      }

      const b = minMeanDistance;

      // Silhouette score for point i
      const s = (b - a) / Math.max(a, b);
      silhouetteScores.push(s);
    }

    // Return average silhouette score
    return silhouetteScores.length > 0
      ? silhouetteScores.reduce((sum, val) => sum + val, 0) /
          silhouetteScores.length
      : 0;
  }

  /**
   * Hierarchical grouping: Merge fine-grained clusters into 2-5 coarse opinion groups
   *
   * Strategy:
   * 1. Use fine clusters as input (K=20/50/100)
   * 2. Apply K-means again with K=2-5 on cluster centroids
   * 3. Determine optimal coarse K based on silhouette score
   *
   * @param centroids - Fine cluster centroids [[pc1, pc2], ...]
   * @param fineClusters - Fine cluster assignments for each user
   * @returns Coarse grouping result
   */
  static createCoarseGroups(
    centroids: number[][]
  ): {
    coarseK: number;
    coarseCentroids: number[][];
    fineToCoarseMapping: Map<number, number>; // fine cluster ID -> coarse group ID
  } {
    const numFineClusters = centroids.length;

    if (numFineClusters < 2) {
      throw new Error(
        "Need at least 2 fine clusters to create coarse groups"
      );
    }

    // Try K=2 through K=5 and pick best based on silhouette score
    let bestK = 2;
    let bestScore = -1;
    let bestResult: { clusters: number[]; centroids: number[][] } | null = null;

    for (let k = 2; k <= Math.min(5, numFineClusters); k++) {
      const result = kmeans(centroids, k, {
        initialization: "kmeans++",
        maxIterations: 50,
      });

      const score = this.calculateSilhouetteScore(
        centroids,
        result.clusters,
        result.centroids
      );

      if (score > bestScore) {
        bestScore = score;
        bestK = k;
        bestResult = result;
      }
    }

    // Create mapping: fine cluster ID -> coarse group ID
    const fineToCoarseMapping = new Map<number, number>();

    if (!bestResult) {
      throw new Error("Failed to compute coarse grouping");
    }

    bestResult.clusters.forEach((coarseId: number, fineId: number) => {
      fineToCoarseMapping.set(fineId, coarseId);
    });

    return {
      coarseK: bestK,
      coarseCentroids: bestResult.centroids,
      fineToCoarseMapping,
    };
  }

  /**
   * Assign a single user to nearest cluster
   * Used for real-time updates when a new user votes
   *
   * @param userCoordinates - User's 2D coordinates [pc1, pc2]
   * @param centroids - Existing cluster centroids
   * @returns Cluster ID (0 to K-1)
   */
  static assignToNearestCluster(
    userCoordinates: number[],
    centroids: number[][]
  ): number {
    if (userCoordinates.length !== 2) {
      throw new Error("User coordinates must be 2D [pc1, pc2]");
    }

    let nearestCluster = 0;
    let minDistance = Infinity;

    for (let i = 0; i < centroids.length; i++) {
      const dist = distance.euclidean(userCoordinates, centroids[i]);

      if (dist < minDistance) {
        minDistance = dist;
        nearestCluster = i;
      }
    }

    return nearestCluster;
  }
}
