"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Share2, Sparkles } from 'lucide-react';

/**
 * Insight Artifacts Collection Component
 *
 * Displays user's collected insight profiles as unlockable artifacts.
 * Gamifies engagement by showing 5 artifact slots that unlock as users
 * complete polls and earn different voting profiles.
 *
 * @version 2.0
 * @date 2025-10-16
 */

export interface InsightArtifact {
  id: string;
  emoji: string;
  profile: string;
  description: string;
  pollTitle: string;
  earnedDate: string;
  rarity?: 'common' | 'rare' | 'legendary';
}

interface InsightArtifactsCollectionProps {
  /** Array of earned artifacts (max 5) */
  artifacts: InsightArtifact[];
  /** Maximum artifacts to display */
  maxArtifacts?: number;
  /** Callback when user wants to share their collection */
  onShare?: () => void;
  /** Callback when user clicks to earn more */
  onEarnMore?: () => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export default function InsightArtifactsCollection({
  artifacts = [],
  maxArtifacts = 5,
  onShare,
  onEarnMore,
  compact = false,
  className = '',
}: InsightArtifactsCollectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const achievedCount = artifacts.length;
  const isComplete = achievedCount >= maxArtifacts;
  const progressPercent = (achievedCount / maxArtifacts) * 100;

  // Fill empty slots
  const displayArtifacts: (InsightArtifact | null)[] = [...artifacts];
  while (displayArtifacts.length < maxArtifacts) {
    displayArtifacts.push(null);
  }

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500',
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {displayArtifacts.slice(0, maxArtifacts).map((artifact, index) => (
          <div
            key={artifact?.id || `empty-${index}`}
            className="relative"
          >
            {artifact ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.1,
                }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xl
                  bg-gradient-to-br ${rarityColors[artifact.rarity || 'common']}
                  shadow-lg
                `}
              >
                {artifact.emoji}
              </motion.div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300/50 flex items-center justify-center">
                <Lock size={16} className="text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl p-6 shadow-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-purple-600" size={20} />
          <h3 className="text-lg font-bold text-gray-800">
            Your Insight Collection
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-purple-600 font-semibold">
            {achievedCount}/{maxArtifacts}
          </span>
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="text-yellow-500" size={20} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>

      {/* Artifacts Grid */}
      <div className="flex justify-center gap-3 mb-6">
        {displayArtifacts.slice(0, maxArtifacts).map((artifact, index) => (
          <motion.div
            key={artifact?.id || `empty-${index}`}
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {artifact ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.1,
                }}
                whileHover={{ scale: 1.1, y: -5 }}
                className={`
                  w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl
                  bg-gradient-to-br ${rarityColors[artifact.rarity || 'common']}
                  shadow-xl cursor-pointer relative
                `}
              >
                {artifact.emoji}

                {/* Rarity indicator */}
                {artifact.rarity === 'rare' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white" />
                )}
                {artifact.rarity === 'legendary' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
                )}
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200 flex flex-col items-center justify-center cursor-help"
              >
                <Lock size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Locked</span>
              </motion.div>
            )}

            {/* Tooltip on hover */}
            <AnimatePresence>
              {hoveredIndex === index && artifact && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
                >
                  <div className="font-bold mb-1">{artifact.profile}</div>
                  <div className="text-gray-300 text-[10px] mb-1">
                    {artifact.pollTitle}
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    {artifact.earnedDate}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Status Message */}
      <div className="text-center mb-4">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <p className="text-lg font-bold text-purple-600">
              🎉 Collection Complete!
            </p>
            <p className="text-sm text-gray-600">
              You&apos;ve unlocked all 5 voting profiles!
            </p>
          </motion.div>
        ) : achievedCount === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Vote in polls to discover your unique voting profiles
            </p>
            <p className="text-xs text-gray-500">
              Each poll reveals a new insight about your perspective
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {maxArtifacts - achievedCount} more {maxArtifacts - achievedCount === 1 ? 'profile' : 'profiles'} to unlock!
            </p>
            <p className="text-xs text-gray-500">
              Vote in more polls to grow your collection
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isComplete && onShare ? (
          <button
            onClick={onShare}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Share2 size={18} />
            Share Achievement
          </button>
        ) : (
          <button
            onClick={onEarnMore}
            className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {achievedCount === 0 ? 'Start Collecting' : 'Earn More'}
          </button>
        )}

        {achievedCount > 0 && !isComplete && onShare && (
          <button
            onClick={onShare}
            className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={18} />
          </button>
        )}
      </div>

      {/* Legend (for rarity tiers) */}
      {achievedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">Rarity Tiers</p>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-500" />
              <span className="text-gray-600">Common</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <span className="text-gray-600">Rare</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse" />
              <span className="text-gray-600">Legendary</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
