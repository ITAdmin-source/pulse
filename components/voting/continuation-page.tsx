"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { getStatementBatchAction } from "@/actions/votes-actions";

interface ContinuationPageProps {
  statementsVoted: number;
  minStatementsRequired: number;
  hasMoreStatements: boolean;
  onContinue: () => void;
  onFinish: () => void;
  error?: string | null;
  onRetry?: () => void;
  pollId?: string;
  userId?: string;
  currentBatch?: number;
}

export function ContinuationPage({
  statementsVoted,
  minStatementsRequired,
  hasMoreStatements,
  onContinue,
  onFinish,
  error,
  onRetry,
  pollId,
  userId,
  currentBatch,
}: ContinuationPageProps) {
  const canFinish = statementsVoted >= minStatementsRequired;
  const remainingVotes = minStatementsRequired - statementsVoted;

  // Prefetch next batch in background when continuation page loads
  useEffect(() => {
    if (hasMoreStatements && pollId && userId && currentBatch) {
      const prefetchNextBatch = async () => {
        try {
          const nextBatchNumber = currentBatch + 1;
          await getStatementBatchAction(pollId, userId, nextBatchNumber);
          // Data is now cached and will load instantly when user clicks "continue"
        } catch (error) {
          // Silent fail - prefetch is optimization, not critical
          console.debug("Prefetch next batch failed:", error);
        }
      };

      // Small delay to avoid blocking animation
      const timer = setTimeout(prefetchNextBatch, 200);
      return () => clearTimeout(timer);
    }
  }, [hasMoreStatements, pollId, userId, currentBatch]);

  // Scenario 1: No more statements - Deck Complete (Celebration)
  if (!hasMoreStatements) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="max-w-md w-full"
        >
          {/* Celebration Card */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-8">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-full p-4 shadow-lg"
              >
                <Trophy className="h-12 w-12 text-white" />
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              החפיסה הושלמה! 🎉
            </h2>
            <p className="text-center text-gray-600 mb-8">
              בחרת את כל {statementsVoted} הקלפים
            </p>

            {/* Call to Action */}
            <Button onClick={onFinish} className="w-full h-12" size="lg">
              צפייה בתובנות
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scenario 2: More statements available - Progress Milestone
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="max-w-md w-full"
      >
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-8">
          {/* Milestone Badge */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-4 shadow-lg"
            >
              <Trophy className="h-12 w-12 text-white" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            אבן דרך!
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {statementsVoted} {statementsVoted === 1 ? "קלף נבחר" : "קלפים נבחרו"}
          </p>

          {/* Status Message */}
          <div className="text-center text-sm text-gray-600 mb-6">
            <p className="font-medium">יש עוד קלפים לבחור</p>
          </div>

          {/* Error State */}
          {error && onRetry && (
            <div className="text-center space-y-2 mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
              <Button onClick={onRetry} variant="outline" size="sm" className="w-full h-9">
                נסה לטעון את הקבוצה הבאה
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={onContinue} className="w-full h-11" size="lg" disabled={!!error}>
              המשך לבחור
            </Button>
            <Button
              onClick={onFinish}
              variant="outline"
              className="w-full h-11"
              size="lg"
              disabled={!canFinish}
              title={!canFinish ? `בחר עוד ${remainingVotes} כדי לסיים` : "סיום וצפייה בתובנות"}
            >
              {canFinish ? "סיום וצפייה בתובנות" : `בחר עוד ${remainingVotes} כדי לסיים`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
