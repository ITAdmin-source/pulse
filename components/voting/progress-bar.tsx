"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  totalSegments: number;
  currentSegment: number;
  showingResults?: boolean; // New prop to indicate results are showing
  className?: string;
}

export function ProgressBar({
  totalSegments,
  currentSegment,
  showingResults = false,
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("flex gap-1 w-full", className)}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isFilled = index < currentSegment;
        const isCurrent = index === currentSegment;

        // When showing results, the current segment should be filled (black) not pulsing
        const shouldFillCurrent = isCurrent && showingResults;

        return (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              (isFilled || shouldFillCurrent) && "bg-primary",
              isCurrent && !showingResults && "bg-primary/50 animate-pulse",
              !isFilled && !isCurrent && "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}
