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
  agreeLabel = "Keep",
  disagreeLabel = "Throw",
  passLabel = "Skip",
  onVote,
  disabled = false,
}: StatementCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto px-4">
      {/* Statement Card - Wisdom Card Style */}
      <div className="relative w-full group">
        {/* Card deck depth effect - stacked cards behind */}
        <div className="absolute inset-0 bg-amber-50 rounded-3xl shadow-sm transform translate-y-3 translate-x-2 opacity-30 pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-amber-50 rounded-3xl shadow-sm transform translate-y-1.5 translate-x-1 opacity-60 pointer-events-none -z-10" />

        {/* Main card with fixed aspect ratio */}
        <Card className="relative w-full aspect-[2/3] shadow-lg rounded-3xl border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 z-0">
          <CardContent className="p-6 h-full flex flex-col justify-center items-center">
            {/* Small decorative element */}
            <div className="mb-4 text-3xl opacity-60">✦</div>

            {/* Statement Text */}
            <p className="text-sm md:text-base text-center leading-relaxed font-medium text-gray-800 px-2">
              {statement}
            </p>

            {/* Small decorative element */}
            <div className="mt-4 text-3xl opacity-60">✦</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Below the card */}
      <div className="flex gap-3 w-full justify-center">
        <Button
          onClick={() => onVote(-1)}
          disabled={disabled}
          className="flex-1 max-w-[140px] h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all"
          variant="destructive"
        >
          {disagreeLabel}
        </Button>
        <Button
          onClick={() => onVote(1)}
          disabled={disabled}
          className="flex-1 max-w-[140px] h-11 text-base font-semibold shadow-md hover:shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700"
        >
          {agreeLabel}
        </Button>
      </div>
      
      {/* Skip option */}
      <Button
        onClick={() => onVote(0)}
        disabled={disabled}
        variant="ghost"
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        {passLabel}
      </Button>
    </div>
  );
}