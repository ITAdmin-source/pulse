"use client";

/**
 * Results Action Buttons Component
 *
 * Displays 0-2 action buttons in Results view:
 * - "Continue Voting" (if hasMoreStatements && !isPollClosed)
 * - "Add Statement" (if allowUserStatements && !isPollClosed)
 *
 * Design:
 * - Flexbox layout: stacked vertically on mobile (<640px), side-by-side on desktop
 * - Each button: flex-1 with min-h-[48px] for proper touch targets
 * - Continue Voting: Gradient background (purple-to-pink)
 * - Add Statement: Primary button style
 */

import { motion } from "framer-motion";
import { results } from "@/lib/strings/he";

interface ResultsActionButtonsProps {
  hasMoreStatements: boolean;
  allowUserStatements: boolean;
  isPollClosed: boolean;
  onContinueVoting: () => void;
  onAddStatement: () => void;
}

export function ResultsActionButtons({
  hasMoreStatements,
  allowUserStatements,
  isPollClosed,
  onContinueVoting,
  onAddStatement,
}: ResultsActionButtonsProps) {
  // Don't render if poll is closed or no actions available
  if (isPollClosed || (!hasMoreStatements && !allowUserStatements)) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Continue Voting Button */}
      {hasMoreStatements && (
        <motion.button
          onClick={onContinueVoting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 min-h-[48px] px-6 py-3 bg-gradient-poll-header text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          {results.continueVotingButton}
        </motion.button>
      )}

      {/* Add Statement Button */}
      {allowUserStatements && (
        <motion.button
          onClick={onAddStatement}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 min-h-[48px] px-6 py-3 btn-primary text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          {results.addStatementButtonAction}
        </motion.button>
      )}
    </div>
  );
}
