"use client";

import { motion } from "framer-motion";
import { components } from "@/lib/design-tokens-v2";

interface ProgressSegmentsProps {
  total: number;
  current: number;
}

export function ProgressSegments({ total, current }: ProgressSegmentsProps) {
  return (
    <div className="flex gap-1.5 w-full mb-4">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;

        return (
          <div
            key={index}
            className={`flex-1 h-1.5 rounded-full overflow-hidden ${
              isCompleted
                ? "bg-white"
                : isCurrent
                ? "bg-white/50"
                : "bg-white/20"
            }`}
          >
            {isCurrent && (
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
