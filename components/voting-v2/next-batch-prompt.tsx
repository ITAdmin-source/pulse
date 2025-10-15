"use client";

import { motion } from "framer-motion";
import { voting } from "@/lib/strings/he";

interface NextBatchPromptProps {
  batchNumber: number;
  statementsCompleted: number;
  remainingStatements: number;
  onContinue: () => void;
}

export function NextBatchPrompt({ batchNumber, statementsCompleted, remainingStatements, onContinue }: NextBatchPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {voting.batchCompleteTitle}
          </h3>
          <p className="text-gray-600">
            {voting.batchCompleteMessage(statementsCompleted)}
          </p>
        </div>

        <motion.button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {voting.nextBatchButton(remainingStatements)}
        </motion.button>
      </div>
    </motion.div>
  );
}
