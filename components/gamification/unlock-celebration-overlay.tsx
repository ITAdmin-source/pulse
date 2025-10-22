"use client";

/**
 * Unlock Celebration Overlay
 *
 * Displays a brief celebration when user reaches 10 votes and unlocks Results view.
 * Shows for 2 seconds with confetti animation, then auto-dismisses.
 *
 * Design:
 * - Fullscreen dark overlay with semi-transparent background
 * - Centered unlock icon with scale + rotate animation
 * - Celebration message in large, bold white text
 * - Auto-dismiss after 2 seconds
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Unlock } from "lucide-react";
import { voting } from "@/lib/strings/he";

interface UnlockCelebrationOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function UnlockCelebrationOverlay({
  isVisible,
  onDismiss,
}: UnlockCelebrationOverlayProps) {
  // Auto-dismiss after 2 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="text-center"
          >
            {/* Animated unlock icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                duration: 0.6,
                delay: 0.1,
              }}
              className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 sm:mb-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Unlock className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </motion.div>

            {/* Celebration message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4">
                {voting.unlockCelebrationTitle}
              </h2>
              <p className="text-lg sm:text-xl text-white/90">
                {voting.unlockCelebrationSubtitle}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
