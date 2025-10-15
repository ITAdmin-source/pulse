import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getVotingProgressAction } from "@/actions/votes-actions";
import { getSessionIdAction } from "@/actions/users-actions";
import { getUserRolesByUserIdAction } from "@/actions/user-roles-actions";
import { UserService } from "@/lib/services/user-service";
import { ClickableCardDeck } from "@/components/polls/clickable-card-deck";
import { canManagePoll as checkCanManagePoll } from "@/lib/utils/permissions";
import { PrefetchStatements, PrefetchStatementsAnonymous } from "@/components/polls/prefetch-statements";

interface PollEntryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PollEntryPage({ params }: PollEntryPageProps) {
  const { slug } = await params;
  const pollResult = await getPollBySlugAction(slug);

  if (!pollResult.success || !pollResult.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">
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

  // Check if poll is closed (by status or end time)
  const isClosed = poll.status === "closed" ||
                   (poll.endTime && new Date(poll.endTime) < new Date());

  if (isClosed) {
    redirect(`/polls/${slug}/closed`);
  }

  // Only show published polls for voting
  if (poll.status !== "published") {
    // Check if poll is scheduled for the future
    const isScheduled = poll.startTime && new Date(poll.startTime) > new Date();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isScheduled ? "סקר עדיין לא פעיל" : "סקר לא זמין"}
          </h1>
          <p className="text-gray-600 mb-4">
            {isScheduled && poll.startTime
              ? `סקר זה יהיה זמין ב-${new Date(poll.startTime).toLocaleDateString()} בשעה ${new Date(poll.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : "סקר זה אינו פעיל כרגע."
            }
          </p>
          <Button asChild>
            <Link href="/polls">חזרה לסקרים</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get current user (authenticated or anonymous)
  const { userId: clerkUserId } = await auth();
  let dbUser = null;
  let votingProgress = null;
  let canManage = false;

  try {
    // Resolve to database user
    if (clerkUserId) {
      // Authenticated user
      dbUser = await UserService.findByClerkId(clerkUserId);
    } else {
      // Anonymous user - check if they have a session
      const sessionResult = await getSessionIdAction();
      if (sessionResult.success && sessionResult.data) {
        dbUser = await UserService.findBySessionId(sessionResult.data);
      }
    }

    // If user exists in database, check permissions and get progress
    if (dbUser) {
      // Check if user can manage this poll - MUST use user-specific roles
      const rolesResult = await getUserRolesByUserIdAction(dbUser.id);
      if (rolesResult.success && rolesResult.data) {
        canManage = checkCanManagePoll(rolesResult.data, poll.id);
      }

      const progressResult = await getVotingProgressAction(poll.id, dbUser.id);
      if (progressResult.success && progressResult.data) {
        votingProgress = progressResult.data;
      }
    }
  } catch (error) {
    console.error("Error fetching user progress:", error);
    // Continue with votingProgress = null (treat as new user)
  }

  // Determine UI state
  const votedCount = votingProgress?.totalVoted || 0;
  const totalStatements = votingProgress?.totalStatements || 0;
  const thresholdReached = votingProgress?.thresholdReached || false;
  const isNewUser = !dbUser || votedCount === 0;
  const isInProgress = votedCount > 0 && !thresholdReached;
  const isThresholdReached = thresholdReached && votedCount < totalStatements;
  const isCompleted = votedCount > 0 && votedCount >= totalStatements;

  return (
    <div className="h-[calc(100vh-48px)] overflow-hidden bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 flex flex-col">
      {/* Prefetch first batch of statements in background for faster voting page load */}
      {dbUser && (isNewUser || isInProgress) && (
        <PrefetchStatements pollId={poll.id} userId={dbUser.id} batchNumber={1} />
      )}

      {/* Prefetch for anonymous users without DB record yet */}
      {!dbUser && (
        <PrefetchStatementsAnonymous pollId={poll.id} />
      )}

      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="flex-1 container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-8">
          {/* Manage Poll Button - show for owners/managers */}
          {canManage && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/polls/${poll.slug}/manage`}>
                  <Settings className="w-4 h-4 me-2" />
                  ניהול סקר
                </Link>
              </Button>
            </div>
          )}

          {/* Card Deck Package */}
          <ClickableCardDeck
            pollSlug={poll.slug}
            pollQuestion={poll.question}
            allowUserStatements={poll.allowUserStatements}
            description={poll.description || undefined}
            navigateTo={
              isNewUser || isInProgress
                ? "vote"
                : isThresholdReached || isCompleted
                ? "insights"
                : "vote"
            }
          />

          {/* CTA Buttons - Adaptive based on user state */}
          <div className="flex flex-col gap-3 items-center">
            {/* STATE A: New User */}
            {isNewUser && (
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link href={`/polls/${poll.slug}/vote`}>
                  פתיחת חפיסה
                </Link>
              </Button>
            )}

            {/* STATE B: In Progress (below threshold) */}
            {isInProgress && (
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link href={`/polls/${poll.slug}/vote`}>
                  המשך חפיסה
                </Link>
              </Button>
            )}

            {/* STATE C: Threshold Reached (but not all voted) */}
            {isThresholdReached && (
              <>
                <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                  <Link href={`/polls/${poll.slug}/insights`}>
                    צפה בתובנות שלך
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto"
                  asChild
                >
                  <Link href={`/polls/${poll.slug}/vote`}>
                    המשך חפיסה
                  </Link>
                </Button>
              </>
            )}

            {/* STATE D: All Statements Voted */}
            {isCompleted && (
              <>
                <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                  <Link href={`/polls/${poll.slug}/insights`}>
                    צפה בתובנות שלך
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto"
                  asChild
                >
                  <Link href={`/polls/${poll.slug}/results`}>
                    צפה בתוצאות הסקר
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
