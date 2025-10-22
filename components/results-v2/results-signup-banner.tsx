"use client";

/**
 * Results Signup Banner Component
 *
 * Displays a signup banner for anonymous users in Results view.
 * Only renders if user is not authenticated.
 *
 * Design:
 * - Gradient background (purple-to-pink)
 * - Icon, title, message, and CTA button
 * - Calls Clerk signup modal via onSignUp callback
 */

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { results } from "@/lib/strings/he";

interface ResultsSignupBannerProps {
  onSignUp: () => void;
}

export function ResultsSignupBanner({ onSignUp }: ResultsSignupBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-poll-header rounded-xl p-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Star className="w-8 h-8 text-white" />
        </div>

        {/* Text Content */}
        <div className="flex-1 text-center sm:text-right">
          <h3 className="text-xl font-bold text-white mb-1">
            {results.signupBannerTitle}
          </h3>
          <p className="text-white/90 text-sm sm:text-base">
            {results.signupBannerMessage}
          </p>
        </div>

        {/* CTA Button */}
        <motion.button
          onClick={onSignUp}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-6 py-3 bg-white text-primary-600 rounded-lg font-bold shadow-lg hover:shadow-xl transition-shadow whitespace-nowrap"
        >
          {results.signupBannerButton}
        </motion.button>
      </div>
    </motion.div>
  );
}
