import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPollBySlugAction } from "@/actions/polls-actions";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
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
