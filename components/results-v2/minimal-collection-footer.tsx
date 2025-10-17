"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { results } from '@/lib/strings/he';
import InteractiveArtifactSlot from './interactive-artifact-slot';

/**
 * Minimal Collection Footer Component
 *
 * Ultra-minimal, horizontal collection display nested inside insight card.
 * Mobile-first design that adapts gracefully to all screen sizes.
 * Keeps focus on insight while teasing collection feature.
 *
 * @version 2.1
 * @date 2025-10-16
 */

export interface ArtifactSlot {
  id: string;
  emoji: string;
  profile: string;
  rarity?: 'common' | 'rare' | 'legendary';
}

interface MinimalCollectionFooterProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current insight emoji */
  currentEmoji: string;
  /** User's collected artifacts (authenticated only) */
  artifacts?: ArtifactSlot[];
  /** User ID for fetching insights */
  userId?: string;
  /** Maximum artifacts to display */
  maxArtifacts?: number;
  /** Current poll ID to disable navigation */
  currentPollId?: string;
  /** Callback for sign up (anonymous) */
  onSignUp?: () => void;
  /** Callback to earn more */
  onEarnMore?: () => void;
  /** Custom class name */
  className?: string;
}

export default function MinimalCollectionFooter({
  isAuthenticated,
  currentEmoji,
  artifacts = [],
  userId,
  maxArtifacts = 5,
  currentPollId,
  onSignUp,
  onEarnMore,
  className = '',
}: MinimalCollectionFooterProps) {
  const achievedCount = artifacts.length;

  // For anonymous: show current emoji + locked slots
  // For authenticated: show actual artifacts + locked slots
  const displaySlots = Array.from({ length: maxArtifacts }, (_, index) => {
    if (isAuthenticated) {
      return artifacts[index] || null;
    } else {
      return index === 0 ? { emoji: currentEmoji, id: 'current', profile: '' } : null;
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
      transition={{ delay: 0.6, duration: 0.3 }}
      className={`mt-6 pt-4 border-t border-white-20 ${className}`}
    >
      {/* Mobile Layout (< 640px): Stacked */}
      <div className="sm:hidden">
        {/* Slots Row */}
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {displaySlots.map((artifact, index) => (
            <React.Fragment key={artifact?.id || `empty-${index}`}>
              {artifact ? (
                isAuthenticated && userId ? (
                  <InteractiveArtifactSlot
                    artifact={artifact}
                    userId={userId}
                    currentPollId={currentPollId}
                    size="sm"
                    index={index}
                  />
                ) : (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.7 + index * 0.04,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <div
                      className={`
                        w-8 h-8 rounded-lg flex items-center justify-center text-lg
                        bg-gradient-to-br ${
                          artifact.rarity
                            ? rarityColors[artifact.rarity]
                            : 'from-purple-400 to-pink-400'
                        }
                        shadow-md
                      `}
                    >
                      {artifact.emoji}
                    </div>
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.7 + index * 0.04,
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-white-10 border border-white-20 flex items-center justify-center">
                    <Lock size={10} className="text-white-40" />
                  </div>
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* CTA Row */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-white/70">
            {results.artifactCount(isAuthenticated ? achievedCount : 1, maxArtifacts)}
          </span>
          {isAuthenticated ? (
            <button
              onClick={onEarnMore}
              className="bg-white-20 hover-bg-white-30 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition-colors backdrop-blur-sm border border-white-20"
            >
              {results.earnMore}
            </button>
          ) : (
            <button
              onClick={onSignUp}
              className="bg-white text-primary-600 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary-50 transition-colors flex items-center gap-1 shadow-lg"
            >
              <Sparkles size={12} />
              {results.signUpToCollect}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Layout (≥ 640px): Horizontal Single Line */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        {/* Left: Slots + Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            {displaySlots.map((artifact, index) => (
              <React.Fragment key={artifact?.id || `empty-${index}`}>
                {artifact ? (
                  isAuthenticated && userId ? (
                    <InteractiveArtifactSlot
                      artifact={artifact}
                      userId={userId}
                      currentPollId={currentPollId}
                      size="md"
                      index={index}
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 0.7 + index * 0.04,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <div
                        className={`
                          w-9 h-9 rounded-lg flex items-center justify-center text-xl
                          bg-gradient-to-br ${
                            artifact.rarity
                              ? rarityColors[artifact.rarity]
                              : 'from-purple-400 to-pink-400'
                          }
                          shadow-md
                        `}
                      >
                        {artifact.emoji}
                      </div>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.7 + index * 0.04,
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white-10 border border-white-20 flex items-center justify-center">
                      <Lock size={12} className="text-white-40" />
                    </div>
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="text-sm text-white/80 font-medium ms-1">
            {results.artifactCount(isAuthenticated ? achievedCount : 1, maxArtifacts)}
          </span>
        </div>

        {/* Right: CTA */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          {isAuthenticated ? (
            <button
              onClick={onEarnMore}
              className="bg-white-20 hover-bg-white-30 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm border border-white-20"
            >
              {results.earnMore}
            </button>
          ) : (
            <button
              onClick={onSignUp}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles size={14} />
              {results.signUpToCollect}
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
