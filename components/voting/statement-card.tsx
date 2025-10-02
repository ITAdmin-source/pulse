"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StatementCardProps {
  statement: string;
  agreeLabel?: string;
  disagreeLabel?: string;
  passLabel?: string;
  onVote: (value: -1 | 0 | 1) => void;
  disabled?: boolean;
}

export function StatementCard({
  statement,
  agreeLabel = "Agree",
  disagreeLabel = "Disagree",
  passLabel = "Pass",
  onVote,
  disabled = false,
}: StatementCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4">
      {/* Statement Card */}
      <Card className="w-full shadow-lg">
        <CardContent className="p-6 md:p-8">
          {/* Statement Text */}
          <p className="text-lg md:text-xl text-center mb-6 leading-relaxed">
            {statement}
          </p>

          {/* Primary Actions - ON the card */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => onVote(1)}
              disabled={disabled}
              className="flex-1 h-12 text-base font-semibold"
              variant="default"
            >
              {agreeLabel}
            </Button>
            <Button
              onClick={() => onVote(-1)}
              disabled={disabled}
              className="flex-1 h-12 text-base font-semibold"
              variant="destructive"
            >
              {disagreeLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Action - BELOW the card */}
      <Button
        onClick={() => onVote(0)}
        disabled={disabled}
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
      >
        {passLabel}
      </Button>
    </div>
  );
}
