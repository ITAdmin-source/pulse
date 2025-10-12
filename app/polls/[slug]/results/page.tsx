import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getPollResultsSummaryAction } from "@/actions/poll-results-actions";
import { PollStatsCard } from "@/components/shared/poll-stats-card";
import { HeatmapDashboard } from "@/components/analytics/heatmap-dashboard";

interface ResultsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPollStats(slug: string) {
  // Fetch poll by slug
  const pollResult = await getPollBySlugAction(slug);

  if (!pollResult.success || !pollResult.data) {
    throw new Error("Poll not found");
  }

  const poll = pollResult.data;

  // Fetch summary for participant and vote counts
  const summaryResult = await getPollResultsSummaryAction(poll.id);

  if (!summaryResult.success || !summaryResult.data) {
    return {
      pollQuestion: poll.question,
      participantCount: 0,
      voteCount: 0,
    };
  }

  return {
    pollQuestion: poll.question,
    participantCount: summaryResult.data.participantCount,
    voteCount: summaryResult.data.voteCount,
  };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { slug } = await params;
  const stats = await getPollStats(slug);

  // Get poll data for heatmap
  const pollResult = await getPollBySlugAction(slug);
  const poll = pollResult.success ? pollResult.data : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="space-y-6">
          {/* Poll Stats */}
          <PollStatsCard
            pollQuestion={stats.pollQuestion}
            participantCount={stats.participantCount}
            voteCount={stats.voteCount}
          />

          {/* Demographic Heatmap */}
          {poll && (
            <HeatmapDashboard
              pollId={poll.id}
              title="מפת חום דמוגרפית"
              description="התפלגות הסכמה להצהרות לפי קבוצות דמוגרפיות"
              defaultAttribute="gender"
              autoRefreshInterval={30000}
            />
          )}

          {/* Back Button */}
          <div className="text-center pb-8">
            <Button size="lg" asChild>
              <Link href="/polls">
                חזרה לכל החפיסות
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
