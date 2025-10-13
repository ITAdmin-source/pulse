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
    <div className={cn("flex gap-1.5 w-full", className)}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isFilled = index < currentSegment;
        const isCurrent = index === currentSegment;

        // When showing results, the current segment should be filled not pulsing
        const shouldFillCurrent = isCurrent && showingResults;

        return (
          <div
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-all duration-300",
              (isFilled || shouldFillCurrent) && "bg-amber-500",
              isCurrent && !showingResults && "bg-amber-300 animate-pulse",
              !isFilled && !isCurrent && "bg-amber-100"
            )}
          />
        );
      })}
    </div>
  );
}
