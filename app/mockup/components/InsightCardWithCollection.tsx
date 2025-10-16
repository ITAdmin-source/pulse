"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import NewArtifactBadge from './NewArtifactBadge';
import MinimalCollectionFooter from './MinimalCollectionFooter';
import { InsightArtifact } from './InsightArtifactsCollection';

/**
 * Insight Card With Collection Component
 *
 * Unified component that combines personal insight with artifact collection.
 * Conditionally renders based on authentication state:
 * - Anonymous: Shows insight + nested collection preview (teaser)
 * - Authenticated: Shows insight + celebration badge + full collection below
 *
 * @version 2.0
 * @date 2025-10-16
 */

export interface PersonalInsight {
  profile: string;
  emoji: string;
  description: string;
}

interface InsightCardWithCollectionProps {
  /** The user's personal voting insight */
  insight: PersonalInsight;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User's collected artifacts (authenticated only) */
  artifacts?: InsightArtifact[];
  /** ID of newly earned artifact for celebration (authenticated only) */
  newlyEarned?: string | null;
  /** Callback to share the current profile */
  onShare: () => void;
  /** Callback to share collection (authenticated only) */
  onShareCollection?: () => void;
  /** Callback for sign up (anonymous only) */
  onSignUp?: () => void;
  /** Callback to earn more artifacts */
  onEarnMore?: () => void;
  /** Callback when new artifact badge is dismissed */
  onDismissNewBadge?: () => void;
  /** Custom class name */
  className?: string;
}

export default function InsightCardWithCollection({
  insight,
  isAuthenticated,
  artifacts = [],
  newlyEarned,
  onShare,
  onShareCollection,
  onSignUp,
  onEarnMore,
  onDismissNewBadge,
  className = '',
}: InsightCardWithCollectionProps) {
  const newArtifact = newlyEarned
    ? artifacts.find((a) => a.id === newlyEarned)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 sm:p-8 shadow-2xl text-white relative overflow-hidden ${className}`}
    >
      {/* Decorative Background Circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        {/* Profile Header */}
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="text-4xl sm:text-5xl"
          >
            {insight.emoji}
          </motion.span>
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-purple-200 uppercase tracking-wide">
              Your Voting Profile
            </h3>
            <h2 className="text-xl sm:text-3xl font-bold leading-tight">{insight.profile}</h2>
          </div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm sm:text-lg text-purple-50 leading-relaxed mb-5 sm:mb-6"
        >
          {insight.description}
        </motion.p>

        {/* New Artifact Celebration (Authenticated Only) */}
        {isAuthenticated && newArtifact && (
          <NewArtifactBadge
            emoji={newArtifact.emoji}
            profileName={newArtifact.profile}
            onDismiss={onDismissNewBadge}
            autoDismiss={5000}
          />
        )}

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-1"
        >
          <button
            onClick={onShare}
            className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base w-full sm:w-auto"
          >
            <Share2 size={16} className="sm:w-5 sm:h-5" />
            Share My Profile
          </button>
        </motion.div>

        {/* Minimal Collection Footer - Nested Inside Card */}
        <MinimalCollectionFooter
          isAuthenticated={isAuthenticated}
          currentEmoji={insight.emoji}
          artifacts={artifacts}
          maxArtifacts={5}
          onSignUp={onSignUp}
          onEarnMore={onEarnMore}
        />
      </div>
    </motion.div>
  );
}
