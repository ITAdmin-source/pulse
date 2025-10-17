"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";
import { components } from "@/lib/design-tokens-v2";
import { pollCard } from "@/lib/strings/he";

interface PollCardGradientProps {
  slug: string;
  question: string;
  emoji?: string | null;
  status: "active" | "closed";
  voteCount?: number;
  voterCount?: number;
}

export function PollCardGradient({
  slug,
  question,
  emoji,
  status,
  voteCount = 0,
  voterCount = 0
}: PollCardGradientProps) {
  const isActive = status === "active";
  const participantLabel = isActive ? pollCard.participantsActive : pollCard.participantsVoted;

  return (
    <Link href={`/polls/${slug}`}>
      <motion.div
        className="relative cursor-pointer group overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Gradient Header */}
        <div className={`${components.pollCard.headerGradient} p-5 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden`}>
          {/* Decorative circles */}
          <div className="absolute top-2 start-2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-2 end-2 w-20 h-20 rounded-full bg-white/10 blur-xl" />

          {/* Emoji or Placeholder Icon */}
          {emoji ? (
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3 relative z-10">
              {emoji}
            </div>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 sm:mb-3 rounded-full bg-white/20 flex items-center justify-center relative z-10">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          )}

          {/* Question Text - Max 3 lines */}
          <h3
            className="text-white text-center font-bold text-base sm:text-lg line-clamp-3 relative z-10 px-2"
            dir="auto"
          >
            {question}
          </h3>

          {/* Status Badge - Top right corner */}
          {!isActive && (
            <div className="absolute top-3 right-3 z-20">
              <div className="bg-status-error text-white px-2 py-1 rounded text-xs font-bold">
                {pollCard.statusClosed}
              </div>
            </div>
          )}
        </div>

        {/* White Body - Compact */}
        <div className="bg-white p-4 sm:p-5">
          {/* Stats Row with Icons */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Users size={14} className="sm:w-4 sm:h-4" />
              <span>{voterCount} {participantLabel}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={14} className="sm:w-4 sm:h-4" />
              <span>{voteCount} {pollCard.totalVotes}</span>
            </div>
          </div>

          {/* CTA Button */}
          <motion.button
            className={`w-full font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
              isActive
                ? "btn-primary text-white"
                : "btn-secondary text-white"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isActive ? pollCard.ctaVoteNow : pollCard.ctaViewResults}
          </motion.button>
        </div>
      </motion.div>
    </Link>
  );
}
