import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getUserPollInsightAction, upsertUserPollInsightAction } from "@/actions/user-poll-insights-actions";
import { getSessionIdAction } from "@/actions/users-actions";
import { UserService } from "@/lib/services/user-service";
import { AIService } from "@/lib/services/ai-service";
import { AnonymousInsightHandler } from "@/components/polls/anonymous-insight-handler";
import { InsightPageClient } from "./insight-page-client";

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">הפעלה לא נמצאה</h1>
          <p className="text-gray-600 mb-4">אנא התחל להצביע כדי ליצור תובנות.</p>
          <Button asChild>
            <Link href={`/polls/${slug}/vote`}>התחל הצבעה</Link>
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
            בחר עוד קלפים תחילה
          </h1>
          <p className="text-gray-600 leading-relaxed">
            עליך לבחור {remainingVotes} קלף{remainingVotes !== 1 ? 'ים' : ''} נוסף{remainingVotes !== 1 ? 'ים' : ''} כדי לפתוח את התובנות האישיות שלך.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" asChild>
              <Link href={`/polls/${slug}/vote`}>המשך חפיסה</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/polls/${slug}`}>חזרה לחפיסה</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // For anonymous users, use client-side handler with localStorage
  // For authenticated users, use server-side generation with DB storage
  if (!clerkUserId) {
    return (
      <AnonymousInsightHandler
        pollId={poll.id}
        pollSlug={slug}
        pollQuestion={poll.question}
        isAuthenticated={false}
      />
    );
  }

  // Authenticated user flow - server-side with DB storage
  const insightResult = await getUserPollInsightAction(effectiveUserId, poll.id);

  let insight;
  if (insightResult.success && insightResult.data) {
    insight = insightResult.data;
  } else {
    // Generate insight using AI service
    try {
      const generated = await AIService.generatePersonalInsight(effectiveUserId, poll.id);
      // Save to database for authenticated users
      const saveResult = await upsertUserPollInsightAction(effectiveUserId, poll.id, generated.title, generated.body);
      insight = saveResult.success && saveResult.data ? saveResult.data : generated;
    } catch (error) {
      console.error("Failed to generate insight:", error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-6 max-w-md px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              לא ניתן ליצור תובנות
            </h1>
            <p className="text-gray-600 leading-relaxed">
              נתקלנו בשגיאה ביצירת התובנות האישיות שלך.
              ייתכן שזה נובע מהצבעות לא מספקות או בעיית שירות זמנית.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" asChild>
                <Link href={`/polls/${slug}/vote`}>המשך הצבעה</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                נסה שוב
              </Button>
              <Button variant="ghost" asChild>
                <Link href={`/polls/${slug}/results`}>
                  צפה בתוצאות הסקר במקום
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 pt-2">
              אתה יכול גם לגשת לתובנות שלך מאוחר יותר מלוח הבקרה שלך
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <InsightPageClient
      insight={insight}
      pollQuestion={poll.question}
      pollSlug={slug}
      userId={clerkUserId || undefined}
    />
  );
}
