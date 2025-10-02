import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target } from "lucide-react";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";
import { getPollResultsAction } from "@/actions/poll-results-actions";

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
  const statementsResult = await getApprovedStatementsByPollIdAction(poll.id);
  const statementCount = statementsResult.data?.length || 0;

  // Get current vote count if voting goal is set
  let currentVoters = 0;
  if (poll.votingGoal) {
    const resultsData = await getPollResultsAction(poll.id);
    if (resultsData.success && resultsData.data) {
      currentVoters = resultsData.data.totalVoters;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/polls">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-72px)]">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Poll Question */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {poll.question}
          </h1>

          {/* Description */}
          {poll.description && (
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              {poll.description}
            </p>
          )}

          {/* Stats Card */}
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{statementCount}</p>
                  <p className="text-sm text-gray-600">Statements</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{poll.status}</p>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
              </div>

              {/* Voting Goal Progress */}
              {poll.votingGoal && poll.votingGoal > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-700">Voting Goal Progress</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{currentVoters} voters</span>
                      <span>{poll.votingGoal} goal</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((currentVoters / poll.votingGoal) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-center text-sm font-medium text-gray-900">
                      {Math.round((currentVoters / poll.votingGoal) * 100)}% complete
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Button */}
          <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
            <Link href={`/polls/${poll.slug}/vote`}>
              Start Voting
            </Link>
          </Button>

          {/* Helper Text */}
          <p className="text-sm text-gray-500">
            Vote on statements one at a time and discover your personalized insights
          </p>
        </div>
      </main>
    </div>
  );
}
