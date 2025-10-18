"use client";

import { motion } from "framer-motion";

interface ProgressSegmentsProps {
  total: number;
  current: number;
  showStats?: boolean;
}

export function ProgressSegments({ total, current, showStats = false }: ProgressSegmentsProps) {
  return (
    <div className="flex gap-1.5 w-full mb-4">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const shouldFillCurrent = isCurrent && showStats;

        return (
          <div
            key={index}
            className={`flex-1 h-2 sm:h-1.5 rounded-full overflow-hidden ${
              isCompleted || shouldFillCurrent
                ? "bg-progress"
                : isCurrent
                ? "bg-progress-50 animate-pulse"
                : "bg-progress-20"
            }`}
          >
            {shouldFillCurrent && (
              <motion.div
                className="h-full bg-progress"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, ease: "linear" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
