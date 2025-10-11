"use client";

/**
 * Anonymous Insight Handler
 *
 * Client component that handles localStorage-based insights for anonymous users
 * - Checks localStorage for existing insight
 * - Calls API to generate new insight if needed
 * - Saves to localStorage (anonymous) or triggers DB save (authenticated)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InsightCard } from "@/components/shared/insight-card";
import { InsightActions } from "@/components/polls/insight-actions";
import { Loader2 } from "lucide-react";
import { getInsightFromStorage, saveInsightToStorage } from "@/lib/utils/insight-storage";

interface AnonymousInsightHandlerProps {
  pollId: string;
  pollSlug: string;
  pollQuestion: string;
  userId?: string; // Clerk user ID if authenticated
  isAuthenticated: boolean;
}

export function AnonymousInsightHandler({
  pollId,
  pollSlug,
  pollQuestion,
  userId,
  isAuthenticated,
}: AnonymousInsightHandlerProps) {
  const [insight, setInsight] = useState<{ title: string; body: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false; // Prevent duplicate API calls

    async function loadInsight() {
      if (isCancelled) return;
      try {
        // For anonymous users, check localStorage first
        if (!isAuthenticated) {
          const stored = getInsightFromStorage(pollId);
          if (stored) {
            console.log("[AnonymousInsight] Found in localStorage");
            setInsight({ title: stored.title, body: stored.body });
            setIsLoading(false);
            return;
          }
        }

        // Generate new insight via API
        console.log("[AnonymousInsight] Generating new insight");
        const response = await fetch("/api/insights/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle rate limit
          if (response.status === 429) {
            setError(errorData.message || "Rate limit exceeded. Please try again later.");
            setIsLoading(false);
            return;
          }

          throw new Error(errorData.message || "Failed to generate insight");
        }

        const data = await response.json();

        if (data.success && data.insight) {
          setInsight(data.insight);

          // Save to localStorage for anonymous users
          if (!isAuthenticated) {
            saveInsightToStorage(pollId, pollQuestion, data.insight.title, data.insight.body);
            console.log("[AnonymousInsight] Saved to localStorage");
          }

          // Log cost metrics (dev only)
          if (data.metadata) {
            console.log("[AnonymousInsight] Tokens used:", data.metadata.tokensUsed);
            console.log("[AnonymousInsight] Cost:", data.metadata.cost);
            console.log("[AnonymousInsight] Latency:", data.metadata.latency, "ms");
          }
        } else {
          throw new Error("Invalid response from server");
        }

        setIsLoading(false);
      } catch (err) {
        if (isCancelled) return; // Don't update state if cancelled
        console.error("[AnonymousInsight] Error:", err);
        setError(err instanceof Error ? err.message : "Failed to load insight");
        setIsLoading(false);
      }
    }

    loadInsight();

    // Cleanup function to prevent duplicate calls
    return () => {
      isCancelled = true;
    };
  }, [pollId, pollQuestion, isAuthenticated]);

  // Loading state - calm and simple for fast response
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4 max-w-md px-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            מייצר תובנות אישיות
          </h1>

          <p className="text-gray-600 leading-relaxed">
            מנתח את דפוס ההצבעה שלך...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6 max-w-md px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">לא ניתן ליצור תובנות</h1>
          <h2 className="text-xl text-gray-700">Could Not Generate Insights</h2>
          <p className="text-gray-600 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <Button size="lg" variant="outline" onClick={() => window.location.reload()}>
              נסה שוב / Try Again
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/polls/${pollSlug}/results`}>דלג לתוצאות / View Results</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show insight
  if (!insight) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="space-y-4">
          {/* Insight Card */}
          <InsightCard
            title={insight.title}
            body={insight.body}
            pollQuestion={pollQuestion}
          />

          {/* Action Buttons */}
          <InsightActions
            pollTitle={pollQuestion}
            insightTitle={insight.title}
            insightBody={insight.body}
            userId={userId}
            pollSlug={pollSlug}
          />

          {/* Navigation Button */}
          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href={`/polls/${pollSlug}/results`}>צפה בתוצאות</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
