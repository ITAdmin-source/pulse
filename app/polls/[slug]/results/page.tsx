import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getPollResultsSummaryAction, getPollResultsAction } from "@/actions/poll-results-actions";
import { ResultsDashboard } from "@/components/shared/results-dashboard";
import { DemographicAnalyticsDashboard } from "@/components/analytics/demographic-analytics-dashboard";

interface ResultsPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPollResults(slug: string) {
  // Fetch poll by slug
  const pollResult = await getPollBySlugAction(slug);

  if (!pollResult.success || !pollResult.data) {
    throw new Error("Poll not found");
  }

  const poll = pollResult.data;

  // Fetch both summary and detailed results
  const [summaryResult, detailedResults] = await Promise.all([
    getPollResultsSummaryAction(poll.id),
    getPollResultsAction(poll.id),
  ]);

  if (!summaryResult.success || !summaryResult.data || !detailedResults.success || !detailedResults.data) {
    // Fallback if generation fails
    return {
      pollSlug: slug,
      pollQuestion: poll.question,
      summaryText: "Results summary is being generated. Please check back later.",
      participantCount: 0,
      voteCount: 0,
      generatedAt: new Date().toISOString(),
      statements: [],
    };
  }

  return {
    pollSlug: slug,
    pollQuestion: poll.question,
    summaryText: summaryResult.data.summaryText,
    participantCount: summaryResult.data.participantCount,
    voteCount: summaryResult.data.voteCount,
    generatedAt: summaryResult.data.generatedAt.toISOString(),
    statements: detailedResults.data.statements,
  };
}

// Fallback for development/demo
async function getPollResultsFallback(_slug: string) {
  return {
    pollSlug: _slug,
    pollQuestion: "What are the most important climate action priorities?",
    summaryText: `## Overall Poll Sentiment

This poll reveals a strong community consensus on the urgency of climate action, with 78% of participants supporting immediate government intervention. However, opinions diverge significantly on implementation methods.

**Main Themes:**
- **Renewable Energy Transition**: Overwhelming support (87% agreement) for accelerating solar and wind energy adoption
- **Corporate Accountability**: Strong majority (73%) favor stricter regulations on emissions
- **International Cooperation**: Mixed views on global climate agreements (52% support)

**Polarizing Statements:**
1. "Nuclear energy should be part of our climate solution" - Split 48% agree / 52% disagree
2. "Carbon taxes are the best way to reduce emissions" - Divisive at 45% / 55%
3. "Individual lifestyle changes are more important than policy" - Strong disagreement (72% disagree)

**Key Trends:**
- Younger participants (18-34) show 23% higher support for aggressive climate policies
- Urban residents favor public transportation investment at higher rates than rural participants
- There's broad consensus (91%) that climate change is a serious threat requiring action

**Demographic Patterns:**
- Progressive political alignment correlates with support for government-led solutions
- Concern for climate justice issues varies significantly by ethnicity
- Education level shows positive correlation with support for science-based policies`,
    participantCount: 234,
    voteCount: 1547,
    generatedAt: new Date().toISOString(),
  };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { slug } = await params;
  const results = await getPollResults(slug);

  // Get poll data for demographic analytics
  const pollResult = await getPollBySlugAction(slug);
  const poll = pollResult.success ? pollResult.data : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="space-y-6">
          {/* Results Dashboard */}
          <ResultsDashboard
            pollQuestion={results.pollQuestion}
            participantCount={results.participantCount}
            voteCount={results.voteCount}
            statements={results.statements}
            summaryText={results.summaryText}
            generatedAt={results.generatedAt}
          />

          {/* Demographic Analytics */}
          {poll && (
            <DemographicAnalyticsDashboard
              pollId={poll.id}
              privacyThreshold={5}
              title="ניתוח דמוגרפי"
              description="התפלגות בחירות לפי קבוצות דמוגרפיות"
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
