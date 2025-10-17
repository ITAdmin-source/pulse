"use client";

import { motion } from "framer-motion";
import { pollPage } from "@/lib/strings/he";

interface ResultsLockedBannerProps {
  votesCompleted: number;
  votesRequired: number;
  onGoToVote: () => void;
}

export function ResultsLockedBanner({
  votesCompleted,
  votesRequired,
  onGoToVote
}: ResultsLockedBannerProps) {
  const remaining = votesRequired - votesCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {pollPage.resultsLockedTitle}
        </h3>

        <p className="text-lg text-gray-600 mb-2" dir="auto">
          {pollPage.resultsLockedMessage.replace("{remaining}", remaining.toString())}
        </p>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="font-semibold text-primary-600">{votesCompleted}</span>
            <span>/</span>
            <span>{votesRequired}</span>
            <span>{pollPage.votesLabel}</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(votesCompleted / votesRequired) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-poll-header"
            />
          </div>
        </div>

        <motion.button
          onClick={onGoToVote}
          className="w-full py-4 bg-gradient-poll-header text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {pollPage.continueVotingButton}
        </motion.button>
      </div>
    </motion.div>
  );
}
