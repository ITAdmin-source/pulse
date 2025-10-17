"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface EncouragementToastProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
  duration?: number;
}

/**
 * Encouragement Toast Component
 *
 * Brief, celebratory message that appears at voting milestones.
 * - Non-blocking, positioned at top-center
 * - Auto-dismisses after duration (default 1.5s)
 * - Smooth entrance/exit animations
 * - RTL-aware text direction
 */
export function EncouragementToast({
  message,
  isVisible,
  onDismiss,
  duration = 1500,
}: EncouragementToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full shadow-2xl">
            <p className="text-lg sm:text-xl font-bold text-center" dir="auto">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
