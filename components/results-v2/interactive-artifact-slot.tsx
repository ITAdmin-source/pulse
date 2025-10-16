"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getInsightWithPollDetailsAction } from '@/actions/user-poll-insights-actions';
import type { ArtifactSlot } from './minimal-collection-footer';
import InsightDetailModal, { type InsightDetailData } from './insight-detail-modal';

/**
 * Interactive Artifact Slot Component
 *
 * Clickable artifact that opens a modal showing the insight details.
 * - Desktop: Single click opens modal
 * - Mobile: Single tap opens modal
 * - Current poll artifacts show current poll insight
 * - No navigation - keeps user in current context
 *
 * @version 2.0
 * @date 2025-10-16
 */

interface InteractiveArtifactSlotProps {
  /** Artifact data */
  artifact: ArtifactSlot;
  /** Current user ID for fetching insight */
  userId: string;
  /** Current poll ID (optional - for UX context) */
  currentPollId?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Index for animation delay */
  index?: number;
}

export default function InteractiveArtifactSlot({
  artifact,
  userId,
  currentPollId,
  size = 'md',
  index = 0,
}: InteractiveArtifactSlotProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [insightData, setInsightData] = useState<InsightDetailData | null>(null);

  const isCurrentPoll = artifact.id === currentPollId;

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500',
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-9 h-9 text-xl',
  };

  const handleClick = async () => {
    console.log('[InteractiveArtifact] Opening modal for artifact', {
      artifactId: artifact.id,
      userId,
      isCurrentPoll,
    });

    // Open modal and start loading
    setIsModalOpen(true);
    setIsLoading(true);

    try {
      const result = await getInsightWithPollDetailsAction(userId, artifact.id);
      console.log('[InteractiveArtifact] Insight fetch result:', result);

      if (result.success && result.data) {
        // Extract emoji from title
        const emojiMatch = result.data.insight.title.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/u);
        const emoji = emojiMatch ? emojiMatch[0] : artifact.emoji;
        const profile = result.data.insight.title.replace(emoji, '').trim();

        setInsightData({
          emoji,
          profile,
          description: result.data.insight.body,
          pollQuestion: result.data.poll.question,
          pollSlug: result.data.poll.slug,
          rarity: result.data.insight.artifactRarity || artifact.rarity,
        });
      } else {
        console.error('[InteractiveArtifact] Failed to fetch insight:', result.error);
        // Keep modal open but show error state
        setInsightData(null);
      }
    } catch (error) {
      console.error('[InteractiveArtifact] Error fetching insight:', error);
      setInsightData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Clear data after animation completes
    setTimeout(() => {
      setInsightData(null);
    }, 300);
  };

  return (
    <>
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
        <button
          onClick={handleClick}
          className={`
            ${sizeClasses[size]} rounded-lg flex items-center justify-center
            bg-gradient-to-br ${artifact.rarity ? rarityColors[artifact.rarity] : 'from-purple-400 to-pink-400'}
            shadow-md transition-all duration-200
            hover:scale-110 hover:shadow-lg active:scale-95
            cursor-pointer
          `}
          aria-label={`View insight: ${artifact.profile}`}
          title={artifact.profile}
        >
          {artifact.emoji}
        </button>
      </motion.div>

      {/* Insight Detail Modal */}
      <InsightDetailModal
        open={isModalOpen}
        onClose={handleCloseModal}
        insight={insightData}
        isLoading={isLoading}
      />
    </>
  );
}
