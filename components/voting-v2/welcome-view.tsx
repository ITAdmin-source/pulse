"use client";

/**
 * WelcomeView Component - Poll-First Splash Screen
 *
 * Visual hierarchy:
 * 1. PRIMARY: Poll emoji + question + description (large, prominent)
 * 2. SECONDARY: 3 simple instruction steps (small, subtle)
 * 3. TERTIARY: Privacy note (tiny, muted)
 * 4. ACTION: CTA button
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { splashScreen } from "@/lib/strings/he";

interface WelcomeViewProps {
  pollQuestion: string;
  pollDescription?: string | null;
  pollEmoji?: string | null;
  onStart: () => void;
}

export function WelcomeView({
  pollQuestion,
  pollDescription,
  pollEmoji,
  onStart,
}: WelcomeViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto"
      dir="rtl"
    >
      {/* Single White Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 space-y-8">

        {/* PRIMARY CONTENT: Poll Info */}
        <div className="text-center space-y-4">
          {/* Large Emoji */}
          {pollEmoji && (
            <div className="text-7xl sm:text-8xl mb-2">
              {pollEmoji}
            </div>
          )}

          {/* MAIN FOCUS: Poll Question */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {pollQuestion}
          </h1>

          {/* Poll Description (if exists) */}
          {pollDescription && (
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-xl mx-auto">
              {pollDescription}
            </p>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-gray-200" />

        {/* SECONDARY CONTENT: Instructions (subtle) */}
        <div className="space-y-2">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-poll-header text-white text-xs font-semibold flex items-center justify-center">
              1
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {splashScreen.step1}
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-poll-header text-white text-xs font-semibold flex items-center justify-center">
              2
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {splashScreen.step2}
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-poll-header text-white text-xs font-semibold flex items-center justify-center">
              3
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {splashScreen.step3}
            </p>
          </div>
        </div>

        {/* TERTIARY CONTENT: Privacy Note (very subtle) */}
        <p className="text-center text-xs text-gray-400">
          🔒 {splashScreen.privacyNote}
        </p>

        {/* CTA Button (clear action) */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full bg-gradient-poll-header text-white font-bold text-base sm:text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {splashScreen.startButton}
        </Button>
      </div>
    </motion.div>
  );
}
