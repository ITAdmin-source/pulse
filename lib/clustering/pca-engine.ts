/**
 * PCA Engine
 * Implements Principal Component Analysis for dimensionality reduction
 * Reduces N-dimensional voting patterns to 2D coordinates for visualization
 */

import { PCA } from "ml-pca";
import { Matrix } from "ml-matrix";

export interface PCAResult {
  /** User positions in 2D space [user_count x 2] */
  transformedData: number[][];
  /** Principal component vectors [2 x statement_count] */
  components: number[][];
  /** Variance explained by each component [PC1, PC2] */
  varianceExplained: number[];
  /** Total variance explained (should be >40% for good clustering) */
  totalVarianceExplained: number;
  /** Mean vector used for centering [statement_count] */
  meanVector: number[];
}

export interface OpinionMatrix {
  /** Opinion matrix [users x statements] where values are -1, 0, 1, or null */
  data: (number | null)[][];
  /** User IDs corresponding to rows */
  userIds: string[];
  /** Statement IDs corresponding to columns */
  statementIds: string[];
}

/**
 * PCA Engine for Opinion Clustering
 * Uses mean imputation for missing values (pass votes treated as null)
 */
export class PCAEngine {
  /**
   * Perform PCA on opinion matrix
   *
   * @param opinionMatrix - Sparse voting matrix with nulls for pass votes
   * @param numComponents - Number of components to extract (default: 2)
   * @returns PCA result with 2D coordinates
   *
   * @throws Error if variance explained is too low (<40%)
   * @throws Error if matrix has insufficient data
   */
  static computePCA(
    opinionMatrix: OpinionMatrix,
    numComponents: number = 2
  ): PCAResult {
    const { data, userIds, statementIds } = opinionMatrix;

    // Validate input
    if (data.length === 0 || data[0].length === 0) {
      throw new Error("Opinion matrix is empty");
    }

    if (userIds.length !== data.length) {
      throw new Error(
        `User ID count mismatch: ${userIds.length} IDs vs ${data.length} rows`
      );
    }

    if (statementIds.length !== data[0].length) {
      throw new Error(
        `Statement ID count mismatch: ${statementIds.length} IDs vs ${data[0].length} columns`
      );
    }

    // Step 1: Mean imputation for missing values
    const imputedData = this.meanImputation(data);

    // Step 2: Create matrix for PCA
    const matrix = new Matrix(imputedData);

    // Step 3: Compute PCA
    const pca = new PCA(matrix, {
      center: true, // Center the data (subtract mean)
      scale: false, // Don't scale to unit variance (preserve agreement magnitude)
    });

    // Step 4: Extract components
    const transformedData = pca.predict(matrix, {
      nComponents: numComponents,
    });

    // Step 5: Validate quality
    const varianceExplained = pca.getExplainedVariance();
    const totalVarianceExplained = varianceExplained
      .slice(0, numComponents)
      .reduce((sum, val) => sum + val, 0);

    // Quality check: require at least 40% variance explained
    if (totalVarianceExplained < 0.4) {
      throw new Error(
        `PCA quality too low: only ${(totalVarianceExplained * 100).toFixed(1)}% variance explained. ` +
          `Minimum required: 40%. This suggests voting patterns are too random or sparse.`
      );
    }

    // Step 6: Extract components (eigenvectors)
    const components = pca.getLoadings().to2DArray();

    // Step 7: Calculate mean vector for reconstruction
    const meanVector = this.calculateMeanVector(imputedData);

    return {
      transformedData: transformedData.to2DArray(),
      components: components.slice(0, numComponents), // First numComponents eigenvectors
      varianceExplained: varianceExplained.slice(0, numComponents),
      totalVarianceExplained,
      meanVector,
    };
  }

  /**
   * Mean imputation: Replace null values with column mean
   *
   * For each statement (column):
   * - Calculate mean of non-null values
   * - Replace nulls with that mean
   *
   * This is simpler than EMPCA but sufficient for MVP
   *
   * @param data - Opinion matrix with nulls
   * @returns Imputed matrix without nulls
   */
  private static meanImputation(data: (number | null)[][]): number[][] {
    const numUsers = data.length;
    const numStatements = data[0].length;

    // Calculate column means (for each statement)
    const columnMeans: number[] = [];

    for (let col = 0; col < numStatements; col++) {
      const values: number[] = [];

      for (let row = 0; row < numUsers; row++) {
        const value = data[row][col];
        if (value !== null) {
          values.push(value);
        }
      }

      // Calculate mean (or 0 if no values)
      const mean = values.length > 0
        ? values.reduce((sum, val) => sum + val, 0) / values.length
        : 0;

      columnMeans.push(mean);
    }

    // Impute missing values
    const imputedData: number[][] = [];

    for (let row = 0; row < numUsers; row++) {
      const imputedRow: number[] = [];

      for (let col = 0; col < numStatements; col++) {
        const value = data[row][col];
        imputedRow.push(value !== null ? value : columnMeans[col]);
      }

      imputedData.push(imputedRow);
    }

    return imputedData;
  }

  /**
   * Calculate mean vector for each statement (column means)
   * Used for centering in PCA
   */
  private static calculateMeanVector(data: number[][]): number[] {
    const numStatements = data[0].length;
    const meanVector: number[] = [];

    for (let col = 0; col < numStatements; col++) {
      let sum = 0;
      for (let row = 0; row < data.length; row++) {
        sum += data[row][col];
      }
      meanVector.push(sum / data.length);
    }

    return meanVector;
  }

  /**
   * Project a single user's votes onto existing PCA space
   * Used for real-time updates when a new user votes
   *
   * @param userVotes - User's votes (may contain nulls)
   * @param components - Existing PCA components from computePCA
   * @param meanVector - Mean vector from computePCA
   * @param statementMeans - Column means for imputation
   * @returns 2D coordinates [pc1, pc2]
   */
  static projectUser(
    userVotes: (number | null)[],
    components: number[][],
    meanVector: number[],
    statementMeans: number[]
  ): [number, number] {
    if (userVotes.length !== meanVector.length) {
      throw new Error(
        `Vote count mismatch: ${userVotes.length} votes vs ${meanVector.length} statements`
      );
    }

    // Step 1: Impute missing values using statement means
    const imputedVotes = userVotes.map((vote, idx) =>
      vote !== null ? vote : statementMeans[idx]
    );

    // Step 2: Center the data (subtract mean)
    const centeredVotes = imputedVotes.map(
      (vote, idx) => vote - meanVector[idx]
    );

    // Step 3: Project onto principal components
    const pc1 =
      components[0].reduce((sum, val, idx) => sum + val * centeredVotes[idx], 0);
    const pc2 =
      components[1].reduce((sum, val, idx) => sum + val * centeredVotes[idx], 0);

    return [pc1, pc2];
  }
}
