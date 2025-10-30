/**
 * useClusteringData Hook
 * Fetches and caches clustering data for a poll
 */

import { useState, useEffect, useCallback } from "react";
import { getCompleteClusteringDataAction } from "@/actions/clustering-actions";

export interface ClusteringDataResult {
  metadata: {
    totalUsers: number;
    totalStatements: number;
    numFineClusters: number;
    numCoarseGroups: number;
    silhouetteScore: number;
    totalVarianceExplained: number;
    qualityTier: "high" | "medium" | "low";
    consensusLevel: "high" | "medium" | "low";
  };
  userPositions: Array<{
    userId: string;
    pc1: number;
    pc2: number;
    fineClusterId: number;
    coarseGroupId: number;
  }>;
  statementClassifications: Array<{
    statementId: string;
    type: string;
    averageAgreement: number;
  }>;
  coarseGroups: Array<{
    id: number;
    label: string;
    centroid: number[];
    fineClusterIds: number[];
    userCount: number;
  }>;
}

export function useClusteringData(pollId: string) {
  const [data, setData] = useState<ClusteringDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!pollId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCompleteClusteringDataAction(pollId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch clustering data");
      }

      // Transform the data to match our expected shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = result.data as any;
      setData({
        metadata: {
          totalUsers: rawData.metadata.totalUsers,
          totalStatements: rawData.metadata.totalStatements,
          numFineClusters: rawData.metadata.numFineClusters,
          numCoarseGroups: rawData.metadata.coarseGroups?.length || 0,
          silhouetteScore: rawData.metadata.silhouetteScore,
          totalVarianceExplained: rawData.metadata.totalVarianceExplained,
          qualityTier: rawData.metadata.qualityTier || "medium",
          consensusLevel: rawData.metadata.consensusLevel || "medium",
        },
        userPositions: rawData.userPositions,
        statementClassifications: rawData.statementClassifications,
        coarseGroups: rawData.coarseGroups,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    refetch();
  }, [pollId, refetch]);

  return { data, isLoading, error, refetch };
}
