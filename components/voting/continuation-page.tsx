"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ContinuationPageProps {
  statementsVoted: number;
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  minStatementsRequired: number;
  hasMoreStatements: boolean;
  onContinue: () => void;
  onFinish: () => void;
  error?: string | null;
  onRetry?: () => void;
}

export function ContinuationPage({
  statementsVoted,
  agreeCount,
  disagreeCount,
  unsureCount,
  minStatementsRequired,
  hasMoreStatements,
  onContinue,
  onFinish,
  error,
  onRetry,
}: ContinuationPageProps) {
  const canFinish = statementsVoted >= minStatementsRequired;
  const remainingVotes = minStatementsRequired - statementsVoted;

  // Scenario 1: No more statements - Deck Complete (Celebration)
  if (!hasMoreStatements) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full"
        >
          {/* Celebration Card */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-6">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-full p-4 shadow-lg"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">
              החפיסה הושלמה! 🎉
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">
              מיינת את כל {statementsVoted} הכרטיסים
            </p>

            {/* Final Tally */}
            <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-700 text-center mb-3 uppercase tracking-wide">
                סיכום סופי
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700 text-sm font-medium">שמירה</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{agreeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-gray-700 text-sm font-medium">השלכה</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{disagreeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 text-sm font-medium">לא בטוח</span>
                  </div>
                  <span className="text-xl font-bold text-gray-600">{unsureCount}</span>
                </div>
              </div>
            </div>

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
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        {/* Progress Card - Same amber theme as voting cards */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 rounded-2xl shadow-lg border-2 border-amber-200 p-6">
          {/* Milestone Badge */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-full p-4 shadow-lg"
            >
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">
            אבן דרך!
          </h2>
          <p className="text-center text-gray-600 text-sm mb-6">
            {statementsVoted} {statementsVoted === 1 ? "כרטיס מוין" : "כרטיסים מוינו"}
          </p>

          {/* Score Tally */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-700 text-center mb-3 uppercase tracking-wide">
              הסיכום שלך
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700 text-sm font-medium">שמירה</span>
                </div>
                <span className="text-xl font-bold text-green-600">{agreeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-gray-700 text-sm font-medium">השלכה</span>
                </div>
                <span className="text-xl font-bold text-red-600">{disagreeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700 text-sm font-medium">לא בטוח</span>
                </div>
                <span className="text-xl font-bold text-gray-600">{unsureCount}</span>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="text-center text-xs text-gray-600 mb-4">
            <p className="font-medium">יש עוד כרטיסים לחקור</p>
          </div>

          {/* Error State */}
          {error && onRetry && (
            <div className="text-center space-y-2 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
              <Button onClick={onRetry} variant="outline" size="sm" className="w-full h-9">
                נסה לטעון את הקבוצה הבאה
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={onContinue} className="w-full h-11" size="lg" disabled={!!error}>
              המשך מיון
            </Button>
            <Button
              onClick={onFinish}
              variant="outline"
              className="w-full h-11"
              size="lg"
              disabled={!canFinish}
              title={!canFinish ? `מיין עוד ${remainingVotes} כדי לסיים` : "סיום וצפייה בתובנות"}
            >
              {canFinish ? "סיום וצפייה בתובנות" : `מיין עוד ${remainingVotes} כדי לסיים`}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
