"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Trophy } from 'lucide-react';
import { InsightArtifact } from './InsightArtifactsCollection';

/**
 * Minimal Collection Nested Component
 *
 * Clean, minimal collection display that works for both anonymous and authenticated users.
 * White background, nested below insight card, keeps focus on the insight itself.
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface MinimalCollectionNestedProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current insight emoji */
  currentEmoji: string;
  /** User's collected artifacts (authenticated only) */
  artifacts?: InsightArtifact[];
  /** Maximum artifacts to display */
  maxArtifacts?: number;
  /** Callback to share collection (authenticated) */
  onShare?: () => void;
  /** Callback for sign up (anonymous) */
  onSignUp?: () => void;
  /** Callback to earn more */
  onEarnMore?: () => void;
  /** Custom class name */
  className?: string;
}

export default function MinimalCollectionNested({
  isAuthenticated,
  currentEmoji,
  artifacts = [],
  maxArtifacts = 5,
  onShare,
  onSignUp,
  onEarnMore,
  className = '',
}: MinimalCollectionNestedProps) {
  const achievedCount = artifacts.length;

  // For anonymous: show current emoji + locked slots
  // For authenticated: show actual artifacts + locked slots
  const displaySlots = Array.from({ length: maxArtifacts }, (_, index) => {
    if (isAuthenticated) {
      return artifacts[index] || null;
    } else {
      return index === 0 ? { emoji: currentEmoji, id: 'current' } : null;
    }
  });

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={`bg-white rounded-xl p-4 sm:p-5 shadow-md border border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-purple-600" size={18} />
          <h4 className="text-sm font-semibold text-gray-800">
            {isAuthenticated ? 'Your Collection' : 'Collect Profiles'}
          </h4>
        </div>
        <span className="text-xs text-purple-600 font-semibold">
          {isAuthenticated ? `${achievedCount}/${maxArtifacts}` : `1/${maxArtifacts}`}
        </span>
      </div>

      {/* Artifact Slots - Minimal & Clean */}
      <div className="flex justify-center gap-2 mb-4">
        {displaySlots.map((artifact, index) => (
          <motion.div
            key={artifact?.id || `empty-${index}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.4 + index * 0.05,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="relative"
          >
            {artifact ? (
              <div
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl
                  bg-gradient-to-br ${
                    'rarity' in artifact
                      ? rarityColors[artifact.rarity || 'common']
                      : 'from-purple-400 to-pink-400'
                  }
                  shadow-md
                `}
              >
                {artifact.emoji}
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                <Lock size={14} className="text-gray-300" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Message - Minimal */}
      <p className="text-xs sm:text-sm text-gray-600 text-center mb-3">
        {isAuthenticated ? (
          achievedCount === maxArtifacts ? (
            <>Collection complete! <span className="font-semibold">🎉</span></>
          ) : (
            <>Vote in more polls to unlock <strong>{maxArtifacts - achievedCount} more</strong></>
          )
        ) : (
          <>Sign up to save & unlock <strong>4 more profiles</strong></>
        )}
      </p>

      {/* CTA - Single Button */}
      <div className="flex gap-2">
        {isAuthenticated ? (
          <>
            <button
              onClick={onEarnMore}
              className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Earn More
            </button>
            {achievedCount > 0 && onShare && (
              <button
                onClick={onShare}
                className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Share
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onSignUp}
            className="flex-1 bg-purple-600 text-white py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            Sign Up Free
          </button>
        )}
      </div>
    </motion.div>
  );
}
