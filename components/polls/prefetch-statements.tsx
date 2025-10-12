"use client";

import { useEffect } from "react";
import { getStatementBatchAction } from "@/actions/votes-actions";

interface PrefetchStatementsProps {
  pollId: string;
  userId: string;
  batchNumber: number;
}

/**
 * Invisible component that prefetches statement batches in the background
 * This improves perceived performance by loading data before user navigates
 */
export function PrefetchStatements({ pollId, userId, batchNumber }: PrefetchStatementsProps) {
  useEffect(() => {
    // Prefetch the batch in background when component mounts
    const prefetch = async () => {
      try {
        await getStatementBatchAction(pollId, userId, batchNumber);
        // Data is now cached by Next.js and will load instantly when needed
      } catch (error) {
        // Silent fail - prefetch is optimization, not critical
        console.debug("Prefetch batch failed:", error);
      }
    };

    // Small delay to avoid blocking main render
    const timer = setTimeout(prefetch, 100);
    return () => clearTimeout(timer);
  }, [pollId, userId, batchNumber]);

  // This component renders nothing
  return null;
}
