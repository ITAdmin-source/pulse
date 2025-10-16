"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { results } from '@/lib/strings/he';

/**
 * New Artifact Badge Component
 *
 * Celebration banner shown when authenticated user earns a new artifact.
 * Appears inside the insight card, above the share button.
 * Auto-dismisses after a few seconds.
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface NewArtifactBadgeProps {
  /** The emoji of the newly earned artifact */
  emoji: string;
  /** Profile name of the artifact */
  profileName: string;
  /** Auto-dismiss after this many ms (default 5000) */
  autoDismiss?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Custom class name */
  className?: string;
}

export default function NewArtifactBadge({
  emoji,
  profileName,
  autoDismiss = 5000,
  onDismiss,
  className = '',
}: NewArtifactBadgeProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Wait for exit animation
      }, autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className={`bg-white/20 backdrop-blur border border-white/30 rounded-xl p-3 mb-4 ${className}`}
        >
          <div className="flex items-center gap-3">
            {/* Animated Emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: [-180, 20, 0],
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.6, 1],
                ease: 'easeOut',
              }}
              className="text-4xl flex-shrink-0"
            >
              {emoji}
            </motion.div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-yellow-300 flex-shrink-0" />
                <p className="text-white font-bold text-sm">
                  {results.newArtifactUnlocked}
                </p>
              </div>
              <p className="text-white/80 text-xs truncate" dir="auto">
                {profileName}
              </p>
            </div>

            {/* Optional Dismiss Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => onDismiss?.(), 300);
              }}
              className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1"
              aria-label="Dismiss"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Animated Progress Bar (shows time remaining) */}
          {autoDismiss && (
            <motion.div
              className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-300 to-orange-300"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: autoDismiss / 1000,
                  ease: 'linear',
                }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
