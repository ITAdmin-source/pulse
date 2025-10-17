"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { voting } from "@/lib/strings/he";

interface SplitVoteCardProps {
  statementText: string;
  onVote: (vote: 1 | -1 | 0) => void;
  onAddStatement?: () => void;
  showStats?: boolean;
  agreePercent?: number;
  disagreePercent?: number;
  passPercent?: number;
  disabled?: boolean;
  allowAddStatement?: boolean;
}

export function SplitVoteCard({
  statementText,
  onVote,
  onAddStatement,
  showStats = false,
  agreePercent = 0,
  disagreePercent = 0,
  disabled = false,
  allowAddStatement = true
}: SplitVoteCardProps) {
  const [hoveredButton, setHoveredButton] = useState<"agree" | "disagree" | null>(null);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Statement Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Statement Text Header */}
        <div className="p-4 sm:p-6 bg-gray-50 border-b-4 border-purple-200">
          <p
            className="text-lg sm:text-xl font-medium text-gray-800 text-center leading-relaxed"
            dir="auto"
          >
            &ldquo;{statementText}&rdquo;
          </p>
        </div>

        {/* Split Voting Buttons */}
        <div className="flex h-64 sm:h-80 relative">
          {/* Disagree Button (Left/Start) */}
          <button
            onClick={() => !disabled && onVote(-1)}
            onMouseEnter={() => !disabled && setHoveredButton("disagree")}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
              showStats
                ? "bg-red-500 cursor-default"
                : hoveredButton === "disagree"
                ? "flex-[1.2] bg-red-500"
                : "bg-red-400"
            }`}
          >
            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                showStats
                  ? "scale-110"
                  : hoveredButton === "disagree" && !showStats
                  ? "scale-125"
                  : "scale-100"
              }`}
            >
              <ThumbsDown size={48} className="text-white mb-3 sm:w-16 sm:h-16 sm:mb-4" />
              <span className="text-white font-bold text-xl sm:text-2xl">{voting.disagreeButton}</span>

              {/* Stats Overlay */}
              {showStats && (
                <div className="mt-3 sm:mt-4 animate-fadeIn">
                  <p className="text-white font-black text-4xl sm:text-5xl">
                    {Math.round(disagreePercent)}%
                  </p>
                </div>
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="w-1 bg-white relative z-10"></div>

          {/* Agree Button (Right/End) */}
          <button
            onClick={() => !disabled && onVote(1)}
            onMouseEnter={() => !disabled && setHoveredButton("agree")}
            onMouseLeave={() => setHoveredButton(null)}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
              showStats
                ? "bg-green-500 cursor-default"
                : hoveredButton === "agree"
                ? "flex-[1.2] bg-green-500"
                : "bg-green-400"
            }`}
          >
            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                showStats
                  ? "scale-110"
                  : hoveredButton === "agree" && !showStats
                  ? "scale-125"
                  : "scale-100"
              }`}
            >
              <ThumbsUp size={48} className="text-white mb-3 sm:w-16 sm:h-16 sm:mb-4" />
              <span className="text-white font-bold text-xl sm:text-2xl">{voting.agreeButton}</span>

              {/* Stats Overlay */}
              {showStats && (
                <div className="mt-3 sm:mt-4 animate-fadeIn">
                  <p className="text-white font-black text-4xl sm:text-5xl">
                    {Math.round(agreePercent)}%
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Footer with Pass and Add Statement */}
        <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 border-t border-gray-200">
          {/* Pass Button */}
          <button
            onClick={() => !disabled && onVote(0)}
            disabled={disabled}
            className="flex-1 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <HelpCircle size={18} className="sm:w-5 sm:h-5" />
            <span>{voting.passButton}</span>
          </button>

          {/* Add Statement Button */}
          {allowAddStatement && onAddStatement && (
            <button
              onClick={onAddStatement}
              className="flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span>{voting.addPositionButton}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
