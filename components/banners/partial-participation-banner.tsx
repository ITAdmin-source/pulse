"use client";

import { motion } from "framer-motion";

interface PartialParticipationBannerProps {
  votedCount: number;
  totalStatements: number;
}

export function PartialParticipationBanner({ votedCount, totalStatements }: PartialParticipationBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
    >
      <p className="text-white-95 text-center text-sm sm:text-base">
        הצבעתם על <strong>{votedCount} מתוך {totalStatements} עמדות</strong> לפני שהדיון נסגר.
      </p>
    </motion.div>
  );
}
