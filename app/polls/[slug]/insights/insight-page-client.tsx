"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InsightActions } from "@/components/polls/insight-actions";
import { InsightCard } from "@/components/shared/insight-card";

interface InsightPageClientProps {
  insight: {
    title: string;
    body: string;
  };
  pollQuestion: string;
  pollSlug: string;
  userId?: string;
}

export function InsightPageClient({
  insight,
  pollQuestion,
  pollSlug,
  userId,
}: InsightPageClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="space-y-4">
          {/* Insight Card */}
          <InsightCard
            title={insight.title}
            body={insight.body}
            pollQuestion={pollQuestion}
          />

          {/* Action Buttons - Inline row */}
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
              <Link href={`/polls/${pollSlug}/results`}>
                צפה בתוצאות
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
