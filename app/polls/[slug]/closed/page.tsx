import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, Minus } from "lucide-react";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";
import { getVotesByUserIdAction } from "@/actions/votes-actions";
import { getUserPollInsightAction } from "@/actions/user-poll-insights-actions";
import { getSessionIdAction } from "@/actions/users-actions";

interface ClosedPollPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function VoteIcon({ vote }: { vote: 1 | 0 | -1 }) {
  if (vote === 1) {
    return <Check className="h-5 w-5 text-green-600" />;
  } else if (vote === -1) {
    return <X className="h-5 w-5 text-red-600" />;
  } else {
    return <Minus className="h-5 w-5 text-gray-500" />;
  }
}

function VoteLabel({ vote }: { vote: 1 | 0 | -1 }) {
  if (vote === 1) return <span className="text-green-700 font-medium">You agreed</span>;
  if (vote === -1) return <span className="text-red-700 font-medium">You disagreed</span>;
  return <span className="text-gray-700 font-medium">You were unsure</span>;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
          <Button asChild>
            <Link href="/polls">Back to Polls</Link>
          </Button>
        </div>
      </div>
    );
  }

  const poll = pollResult.data;

  // Get effective user ID (authenticated or anonymous)
  let effectiveUserId = userId;
  if (!effectiveUserId) {
    const sessionResult = await getSessionIdAction();
    effectiveUserId = sessionResult.data || null;
  }

  // Check if user voted by fetching their votes
  const votesResult = effectiveUserId
    ? await getVotesByUserIdAction(effectiveUserId)
    : { success: false, data: [] };

  // Fetch all statements to match votes
  const statementsResult = await getApprovedStatementsByPollIdAction(poll.id);
  const statements = statementsResult.data || [];
  const statementIds = statements.map(s => s.id);

  // Filter votes for this poll's statements
  const userVotes = votesResult.success && votesResult.data
    ? votesResult.data.filter(v => statementIds.includes(v.statementId))
    : [];

  const userParticipated = userVotes.length > 0;
  const hasInsights = effectiveUserId && userVotes.length >= (poll.minStatementsVotedToEnd || 5);

  // Fetch insight if user has one
  const insightResult = hasInsights && effectiveUserId
    ? await getUserPollInsightAction(effectiveUserId, poll.id)
    : null;

  const data = {
    pollSlug: slug,
    pollQuestion: poll.question,
    userParticipated,
    hasInsights: insightResult?.success && insightResult.data,
    userVotes: userVotes.map(vote => {
      const statement = statements.find(s => s.id === vote.statementId);
      return {
        statementText: statement?.text || "Statement not found",
        userVote: vote.value as 1 | 0 | -1,
      };
    }),
    insightTitle: insightResult?.data?.title || null,
    insightSummary: insightResult?.data?.body || null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/polls">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Polls
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Title Section */}
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="mb-2">
              CLOSED
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {data.pollQuestion}
            </h1>
          </div>

          {data.userParticipated ? (
            /* Layout for Voters */
            <>
              {/* Personal Insights (if available) */}
              {data.hasInsights && data.insightTitle && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Your Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {data.insightTitle}
                      </h3>
                      <p className="text-gray-700">{data.insightSummary}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* View Poll Results Button */}
              <div className="flex justify-center">
                <Button size="lg" asChild>
                  <Link href={`/polls/${data.pollSlug}/results`}>
                    View Poll Results
                  </Link>
                </Button>
              </div>

              {/* Your Votes */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Your Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.userVotes.map((vote, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <VoteIcon vote={vote.userVote} />
                        </div>
                        <div className="flex-grow">
                          <p className="text-gray-900 mb-1">{vote.statementText}</p>
                          <VoteLabel vote={vote.userVote} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Layout for Non-Voters */
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-lg text-gray-700">This poll has ended.</p>
                  <p className="text-gray-600">
                    You can view the results and insights from this poll.
                  </p>
                </div>

                <Button size="lg" asChild>
                  <Link href={`/polls/${data.pollSlug}/results`}>
                    View Poll Results
                  </Link>
                </Button>

                <p className="text-sm text-gray-500 pt-4">
                  (No personal insights or vote history available)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Back to Polls Link */}
          <div className="text-center pt-4">
            <Button variant="link" asChild>
              <Link href="/polls">Back to All Polls</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
