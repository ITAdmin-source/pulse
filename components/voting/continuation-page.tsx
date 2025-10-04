"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContinuationPageProps {
  statementsVoted: number;
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  minStatementsRequired: number;
  onContinue: () => void;
  onFinish: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export function ContinuationPage({
  statementsVoted,
  agreeCount,
  disagreeCount,
  unsureCount,
  minStatementsRequired,
  onContinue,
  onFinish,
  error,
  onRetry,
}: ContinuationPageProps) {
  const canFinish = statementsVoted >= minStatementsRequired;
  const remainingVotes = minStatementsRequired - statementsVoted;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Great progress!</h2>
          <p className="text-muted-foreground">
            You&apos;ve voted on {statementsVoted} statement
            {statementsVoted !== 1 ? "s" : ""} so far.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 text-center">Your Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agree:</span>
                <span className="font-medium">{agreeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disagree:</span>
                <span className="font-medium">{disagreeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unsure:</span>
                <span className="font-medium">{unsureCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>There are more statements to explore.</p>
          <p className="mt-1">What would you like to do?</p>
        </div>

        {error && onRetry && (
          <div className="text-center space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={onRetry} variant="outline" size="sm" className="w-full">
              Retry Loading Next Batch
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={onContinue} className="w-full h-12" size="lg" disabled={!!error}>
            Continue Voting
          </Button>
          <Button
            onClick={onFinish}
            variant="outline"
            className="w-full h-12"
            size="lg"
            disabled={!canFinish}
            title={!canFinish ? `Vote on ${remainingVotes} more to finish` : "Finish voting"}
          >
            {canFinish ? "Finish & See Results" : `Vote on ${remainingVotes} more to finish`}
          </Button>
        </div>
      </div>
    </div>
  );
}
