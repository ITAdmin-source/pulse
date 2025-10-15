"use client";

import { useEffect } from "react";
import { getStatementBatchAction } from "@/actions/votes-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";

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

/**
 * Prefetch statements for anonymous users (no userId yet)
 * Uses getApprovedStatementsByPollIdAction instead of batch action
 * Anonymous users load ALL approved statements on vote page, so we prefetch that
 */
export function PrefetchStatementsAnonymous({ pollId }: { pollId: string }) {
  useEffect(() => {
    console.log("[PREFETCH] Anonymous prefetch component mounted for poll:", pollId);

    const prefetch = async () => {
      try {
        console.log("[PREFETCH] Starting anonymous statements prefetch...");
        await getApprovedStatementsByPollIdAction(pollId);
        console.log("[PREFETCH] Anonymous statements prefetch completed successfully!");
        // Data is now cached by Next.js for when user enters vote page
      } catch (error) {
        console.error("[PREFETCH] Prefetch approved statements failed:", error);
      }
    };

    // Small delay to avoid blocking main render
    const timer = setTimeout(prefetch, 100);
    return () => clearTimeout(timer);
  }, [pollId]);

  return null;
}
