import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getUserPollInsightAction } from "@/actions/user-poll-insights-actions";
import { getPollResultsSummaryAction } from "@/actions/poll-results-actions";
import { getSessionIdAction } from "@/actions/users-actions";
import { UserService } from "@/lib/services/user-service";
import { InsightCard } from "@/components/shared/insight-card";
import { ResultsCard } from "@/components/shared/results-card";

interface ClosedPollPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ClosedPollPage({ params }: ClosedPollPageProps) {
  const { slug } = await params;
  const { userId } = await auth();

  // Fetch poll data
  const pollResult = await getPollBySlugAction(slug);
  if (!pollResult.success || !pollResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">סקר לא נמצא</h1>
          <Button asChild>
            <Link href="/polls">חזרה לסקרים</Link>
          </Button>
        </div>
      </div>
    );
  }

  const poll = pollResult.data;

  // Resolve to database user ID
  let dbUser;
  if (userId) {
    dbUser = await UserService.findByClerkId(userId);
  } else {
    const sessionResult = await getSessionIdAction();
    if (sessionResult.success && sessionResult.data) {
      dbUser = await UserService.findBySessionId(sessionResult.data);
    }
  }

  const effectiveUserId = dbUser?.id || null;

  // Check if user has insights
  let userInsight = null;
  if (effectiveUserId) {
    const insightResult = await getUserPollInsightAction(effectiveUserId, poll.id);
    if (insightResult.success && insightResult.data) {
      userInsight = insightResult.data;
    }
  }

  // Fetch poll results
  const resultsResult = await getPollResultsSummaryAction(poll.id);
  const pollResults = resultsResult.success && resultsResult.data
    ? resultsResult.data
    : {
        summaryText: "Results summary is being generated. Please check back later.",
        participantCount: 0,
        voteCount: 0,
        generatedAt: new Date().toISOString(),
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="space-y-4">
          {/* Cards Container - Side-by-side on desktop, stacked on mobile */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center">
            {/* Insight Card - Only for voters */}
            {userInsight && (
              <div className="w-full lg:w-auto flex justify-center">
                <InsightCard
                  title={userInsight.title}
                  body={userInsight.body}
                  pollQuestion={poll.question}
                />
              </div>
            )}

            {/* Results Card - Always shown */}
            <div className="w-full lg:w-auto flex justify-center">
              <ResultsCard
                pollQuestion={poll.question}
                summaryText={pollResults.summaryText}
                participantCount={pollResults.participantCount}
                voteCount={pollResults.voteCount}
                generatedAt={pollResults.generatedAt.toString()}
              />
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <Button size="lg" variant="ghost" asChild>
              <Link href="/polls">חזרה לכל החפיסות</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
