import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getUserPollInsightAction, upsertUserPollInsightAction } from "@/actions/user-poll-insights-actions";
import { getSessionIdAction } from "@/actions/users-actions";
import { UserService } from "@/lib/services/user-service";
import { AIService } from "@/lib/services/ai-service";
import { InsightActions } from "@/components/polls/insight-actions";

interface InsightsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function InsightsPage({ params }: InsightsPageProps) {
  const { slug } = await params;
  const { userId: clerkUserId } = await auth();

  // Fetch poll data
  const pollResult = await getPollBySlugAction(slug);
  if (!pollResult.success || !pollResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
          <Button asChild>
            <Link href="/polls">Back to Polls</Link>
          </Button>
        </div>
      </div>
    );
  }

  const poll = pollResult.data;

  // Resolve to database user ID
  let dbUser;
  if (clerkUserId) {
    // Authenticated user - find by Clerk ID
    dbUser = await UserService.findByClerkId(clerkUserId);
  } else {
    // Anonymous user - find by session ID
    const sessionResult = await getSessionIdAction();
    if (sessionResult.success && sessionResult.data) {
      dbUser = await UserService.findBySessionId(sessionResult.data);
    }
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-600 mb-4">Please start voting to generate insights.</p>
          <Button asChild>
            <Link href={`/polls/${slug}/vote`}>Start Voting</Link>
          </Button>
        </div>
      </div>
    );
  }

  const effectiveUserId = dbUser.id;

  // Check if user has met voting threshold before allowing insights
  const { getVotingProgressAction } = await import("@/actions/votes-actions");
  const progressResult = await getVotingProgressAction(poll.id, effectiveUserId);

  if (!progressResult.success || !progressResult.data?.thresholdReached) {
    // Calculate remaining votes needed (threshold is min(10, totalStatements))
    const totalVoted = progressResult.data?.totalVoted || 0;
    const totalStatements = progressResult.data?.totalStatements || 0;
    const threshold = Math.min(10, totalStatements);
    const remainingVotes = Math.max(0, threshold - totalVoted);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6 max-w-md px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Complete Voting First
          </h1>
          <p className="text-gray-600 leading-relaxed">
            You need to vote on {remainingVotes} more statement{remainingVotes !== 1 ? 's' : ''} to unlock your personalized insights.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" asChild>
              <Link href={`/polls/${slug}/vote`}>Continue Voting</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/polls/${slug}`}>Back to Poll</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Try to fetch existing insight
  const insightResult = await getUserPollInsightAction(effectiveUserId, poll.id);

  let insight;
  if (insightResult.success && insightResult.data) {
    insight = insightResult.data;
  } else {
    // Generate insight using AI service
    try {
      const generated = await AIService.generatePersonalInsight(effectiveUserId, poll.id);
      // Save to database
      const saveResult = await upsertUserPollInsightAction(effectiveUserId, poll.id, generated.title, generated.body);
      insight = saveResult.success && saveResult.data ? saveResult.data : generated;
    } catch (error) {
      console.error("Failed to generate insight:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-6 max-w-md px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Could Not Generate Insights
            </h1>
            <p className="text-gray-600 leading-relaxed">
              We encountered an error generating your personalized insights.
              This might be due to insufficient votes or a temporary service issue.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild>
                <Link href={`/polls/${slug}/vote`}>Continue Voting</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/polls/${slug}/results`}>
                  View Poll Results Instead
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 pt-2">
              You can also access your insights later from your dashboard
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Anonymous User Warning */}
          {!clerkUserId && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-1">Anonymous Session</h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      You&apos;re viewing insights as an anonymous user. Your insights will be lost when you close your browser or clear cookies.
                    </p>
                    <Button size="sm" asChild>
                      <Link href="/signup">Sign Up to Save Your Insights</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Title Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Your Insights
            </h1>
            <p className="text-sm text-gray-500">
              {poll.question}
            </p>
          </div>

          {/* Insight Card */}
          <Card className="shadow-lg">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Insight Title */}
              <div className="text-center pb-4 border-b">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {insight.title}
                </h2>
              </div>

              {/* Insight Body */}
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                  {insight.body}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <InsightActions
            pollTitle={poll.question}
            insightTitle={insight.title}
            insightBody={insight.body}
            userId={clerkUserId || undefined}
          />
          <div className="flex justify-center pt-3">
            <Button size="lg" asChild>
              <Link href={`/polls/${slug}/results`}>
                View Poll Results
              </Link>
            </Button>
          </div>

          {/* Back to Polls Link */}
          <div className="text-center pt-4">
            <Button variant="link" asChild>
              <Link href="/polls">
                Back to All Polls
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
