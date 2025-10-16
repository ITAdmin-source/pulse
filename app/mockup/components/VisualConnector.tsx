"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * Visual Connector Component
 *
 * Small animated connector between insight card and collection component.
 * Shows visual relationship through gradient and subtle animations.
 * Only shown for authenticated users.
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface VisualConnectorProps {
  /** Optional emoji to animate "dropping" from insight to collection */
  fallingEmoji?: string;
  /** Custom class name */
  className?: string;
}

export default function VisualConnector({
  fallingEmoji,
  className = '',
}: VisualConnectorProps) {
  return (
    <div className={`relative flex items-center justify-center py-2 ${className}`}>
      {/* Gradient Line */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-0.5 h-8 bg-gradient-to-b from-purple-400 via-pink-400 to-purple-400 rounded-full origin-top"
        style={{
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
        }}
      />

      {/* Animated Arrow/Chevron */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{
          y: [0, 5, 0],
          opacity: 1,
        }}
        transition={{
          y: {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          opacity: {
            duration: 0.3,
            delay: 0.3,
          },
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <ChevronDown size={16} className="text-white" />
        </div>
      </motion.div>

      {/* Optional Falling Emoji Animation */}
      {fallingEmoji && (
        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.5 }}
          animate={{
            y: 40,
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
          className="absolute top-0 left-1/2 transform -translate-x-1/2 text-3xl pointer-events-none z-10"
        >
          {fallingEmoji}
        </motion.div>
      )}

      {/* Decorative Dots */}
      <div className="absolute inset-0 flex flex-col items-center justify-around pointer-events-none">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: index * 0.3,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="w-1 h-1 rounded-full bg-purple-400"
          />
        ))}
      </div>
    </div>
  );
}
