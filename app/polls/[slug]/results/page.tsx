import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getPollResultsSummaryAction } from "@/actions/poll-results-actions";
import { ResultsCard } from "@/components/shared/results-card";

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

  // Fetch poll results summary
  const summaryResult = await getPollResultsSummaryAction(poll.id);

  if (!summaryResult.success || !summaryResult.data) {
    // Fallback summary if generation fails
    return {
      pollSlug: slug,
      pollQuestion: poll.question,
      summaryText: "Results summary is being generated. Please check back later.",
      participantCount: 0,
      voteCount: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    pollSlug: slug,
    pollQuestion: poll.question,
    summaryText: summaryResult.data.summaryText,
    participantCount: summaryResult.data.participantCount,
    voteCount: summaryResult.data.voteCount,
    generatedAt: summaryResult.data.generatedAt.toISOString(),
  };
}

// Fallback for development/demo
async function getPollResultsFallback(slug: string) {
  return {
    pollSlug: slug,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="space-y-4">
          {/* Results Card */}
          <ResultsCard
            pollQuestion={results.pollQuestion}
            summaryText={results.summaryText}
            participantCount={results.participantCount}
            voteCount={results.voteCount}
            generatedAt={results.generatedAt}
          />

          {/* Back Button */}
          <div className="text-center">
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
