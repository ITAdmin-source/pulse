"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { voting } from "@/lib/strings/he";
import { AddStatementPulse } from "@/components/gamification/add-statement-pulse";

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
  showAddButtonPulse?: boolean;
}

export function SplitVoteCard({
  statementText,
  onVote,
  onAddStatement,
  showStats = false,
  agreePercent = 0,
  disagreePercent = 0,
  disabled = false,
  allowAddStatement = true,
  showAddButtonPulse = false
}: SplitVoteCardProps) {
  const [hoveredButton, setHoveredButton] = useState<"agree" | "disagree" | null>(null);

  // Touch event handlers for mobile feedback
  const handleTouchStart = (button: "agree" | "disagree") => {
    if (!disabled && !showStats) {
      setHoveredButton(button);
    }
  };

  const handleTouchEnd = () => {
    setHoveredButton(null);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Statement Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Statement Text Header */}
        <div className="flex-1 min-h-[150px] sm:min-h-[180px] p-4 sm:p-6 bg-gray-50 border-b-4 border-primary-200 flex items-center justify-center">
          <p
            className="text-xl sm:text-3xl font-bold text-gray-800 text-center leading-relaxed"
            dir="auto"
          >
            &ldquo;{statementText}&rdquo;
          </p>
        </div>

        {/* Split Voting Buttons */}
        <div className="flex flex-1 min-h-[200px] sm:min-h-[240px] relative">
          {/* Disagree Button (Left/Start) */}
          <button
            onClick={() => !disabled && onVote(-1)}
            onMouseEnter={() => !disabled && setHoveredButton("disagree")}
            onMouseLeave={() => setHoveredButton(null)}
            onTouchStart={() => handleTouchStart("disagree")}
            onTouchEnd={handleTouchEnd}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
              showStats
                ? "bg-voting-disagree cursor-default"
                : hoveredButton === "disagree"
                ? "flex-[1.2] bg-voting-disagree"
                : "bg-voting-disagree"
            }`}
            style={{ opacity: hoveredButton === "disagree" && !showStats ? 1 : showStats ? 1 : 0.9 }}
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
            onTouchStart={() => handleTouchStart("agree")}
            onTouchEnd={handleTouchEnd}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
              showStats
                ? "bg-voting-agree cursor-default"
                : hoveredButton === "agree"
                ? "flex-[1.2] bg-voting-agree"
                : "bg-voting-agree"
            }`}
            style={{ opacity: hoveredButton === "agree" && !showStats ? 1 : showStats ? 1 : 0.9 }}
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
            className="flex-1 py-3 sm:py-3.5 min-h-[44px] bg-voting-pass hover:bg-voting-pass text-voting-pass rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
          >
            <HelpCircle size={18} className="sm:w-5 sm:h-5" />
            <span>{voting.passButton}</span>
          </button>

          {/* Add Statement Button */}
          {allowAddStatement && onAddStatement && (
            <AddStatementPulse shouldPulse={showAddButtonPulse}>
              <button
                onClick={onAddStatement}
                className="w-full py-3 sm:py-3.5 min-h-[44px] btn-primary text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <Plus size={18} className="sm:w-5 sm:h-5" />
                <span>{voting.addPositionButton}</span>
              </button>
            </AddStatementPulse>
          )}
        </div>
      </motion.div>
    </div>
  );
}
