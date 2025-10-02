"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  totalSegments: number;
  currentSegment: number;
  className?: string;
}

export function ProgressBar({
  totalSegments,
  currentSegment,
  className,
}: ProgressBarProps) {
  return (
    <div className={cn("flex gap-1 w-full", className)}>
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isFilled = index < currentSegment;
        const isCurrent = index === currentSegment;

        return (
          <div
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              isFilled && "bg-primary",
              isCurrent && "bg-primary/50 animate-pulse",
              !isFilled && !isCurrent && "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
}
