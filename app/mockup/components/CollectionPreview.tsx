"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';

/**
 * Collection Preview Component
 *
 * Compact teaser for anonymous users showing current insight + locked slots.
 * Nested inside the insight card to create visual hierarchy.
 * Single CTA eliminates duplication.
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface CollectionPreviewProps {
  /** Current insight emoji to show in first slot */
  currentEmoji: string;
  /** Total number of collection slots (default 5) */
  totalSlots?: number;
  /** Callback when user clicks sign up */
  onSignUp: () => void;
  /** Custom class name */
  className?: string;
}

export default function CollectionPreview({
  currentEmoji,
  totalSlots = 5,
  onSignUp,
  className = '',
}: CollectionPreviewProps) {
  // Generate slots array
  const slots = Array.from({ length: totalSlots }, (_, index) => ({
    id: index,
    isUnlocked: index === 0,
    emoji: index === 0 ? currentEmoji : null,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <h4 className="text-sm font-semibold text-white">
          Collect Voting Profiles
        </h4>
      </div>

      {/* Slots Preview */}
      <div className="flex justify-center gap-2 mb-4">
        {slots.map((slot, index) => (
          <motion.div
            key={slot.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.4 + index * 0.08,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="relative"
          >
            {slot.isUnlocked ? (
              <motion.div
                animate={{
                  rotate: [0, -5, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.8,
                  ease: 'easeInOut',
                }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl shadow-lg"
              >
                {slot.emoji}
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={{
                  opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-12 h-12 rounded-xl bg-white/5 border-2 border-white/20 border-dashed flex items-center justify-center"
              >
                <Lock size={16} className="text-white/40" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Message */}
      <p className="text-white/90 text-sm text-center mb-3 leading-relaxed">
        Sign up to save this profile and unlock <strong>{totalSlots - 1} more</strong>!
      </p>

      {/* CTA Button */}
      <button
        onClick={onSignUp}
        className="w-full bg-white text-purple-600 py-2.5 px-4 rounded-lg font-semibold hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
      >
        <Sparkles
          size={16}
          className="group-hover:rotate-12 transition-transform"
        />
        <span>Sign Up Free</span>
      </button>

      {/* Optional: Learn More Link */}
      <button
        onClick={() => alert('Learn more about collections!')}
        className="w-full text-white/70 hover:text-white text-xs mt-2 underline transition-colors"
      >
        Learn more
      </button>
    </motion.div>
  );
}
