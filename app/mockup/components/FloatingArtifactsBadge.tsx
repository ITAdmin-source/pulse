"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import InsightArtifactsCollection, { InsightArtifact } from './InsightArtifactsCollection';

/**
 * Floating Artifacts Badge
 *
 * A persistent floating widget that shows compact artifact progress
 * and expands on click to show the full collection.
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface FloatingArtifactsBadgeProps {
  artifacts: InsightArtifact[];
  maxArtifacts?: number;
  onShare?: () => void;
  onEarnMore?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function FloatingArtifactsBadge({
  artifacts = [],
  maxArtifacts = 5,
  onShare,
  onEarnMore,
  position = 'bottom-right',
}: FloatingArtifactsBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const achievedCount = artifacts.length;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(true)}
        className={`fixed ${positionClasses[position]} z-50 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-shadow`}
      >
        <div className="relative">
          <Trophy size={24} />
          {achievedCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
            >
              {achievedCount}
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute -top-2 -right-2 z-10 bg-gray-900 text-white rounded-full p-2 shadow-lg hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Collection Component */}
              <InsightArtifactsCollection
                artifacts={artifacts}
                maxArtifacts={maxArtifacts}
                onShare={() => {
                  setIsExpanded(false);
                  onShare?.();
                }}
                onEarnMore={() => {
                  setIsExpanded(false);
                  onEarnMore?.();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
