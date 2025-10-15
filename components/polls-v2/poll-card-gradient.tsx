"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { components } from "@/lib/design-tokens-v2";
import { pollCard } from "@/lib/strings/he";

interface PollCardGradientProps {
  slug: string;
  question: string;
  status: "active" | "closed";
  positionCount?: number;
  voterCount?: number;
}

export function PollCardGradient({
  slug,
  question,
  status,
  positionCount = 0,
  voterCount = 0
}: PollCardGradientProps) {
  const isActive = status === "active";

  return (
    <Link href={`/polls/${slug}`}>
      <motion.div
        className="relative cursor-pointer group overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Gradient Header */}
        <div className={`${components.pollCard.headerGradient} p-6 min-h-[120px] flex items-center justify-center relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-2 start-2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-2 end-2 w-20 h-20 rounded-full bg-white/10 blur-xl" />

          {/* Question Text */}
          <h3
            className="text-white text-center font-bold text-base sm:text-lg line-clamp-3 relative z-10 px-2"
            dir="auto"
          >
            {question}
          </h3>

          {/* Status Indicator - Top left corner */}
          {!isActive && (
            <div className="absolute top-3 start-3 z-20">
              <div className="bg-gray-700/90 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {pollCard.statusClosed}
              </div>
            </div>
          )}
        </div>

        {/* White Body */}
        <div className="bg-white p-6">
          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{positionCount}</span>
              <span>{pollCard.positions}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-900">{voterCount}</span>
              <span>{pollCard.voters}</span>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base transition-colors ${
              isActive
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-gray-200 text-gray-600 cursor-not-allowed"
            }`}
            whileHover={isActive ? { scale: 1.02 } : {}}
            whileTap={isActive ? { scale: 0.98 } : {}}
            disabled={!isActive}
          >
            {isActive ? pollCard.ctaVoteNow : pollCard.statusClosed}
          </motion.button>
        </div>

        {/* Hover Glow Effect */}
        {isActive && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className={`absolute inset-0 ${components.pollCard.headerGradient} opacity-10 blur-xl`} />
          </div>
        )}
      </motion.div>
    </Link>
  );
}
